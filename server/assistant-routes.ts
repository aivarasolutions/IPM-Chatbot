import type { Express, Request, Response, NextFunction, RequestHandler } from "express";
import { z } from "zod";
import {
  assistantThreadInputSchema, generateResponseSchema, savedResponseInputSchema, knowledgeInputSchema,
} from "@shared/schema";
import { assistantStorage, knowledgeStorage } from "./assistant-storage";
import { storage } from "./storage";
import { requireAdmin, requireStaff } from "./middlewares/staff-auth";
import { assistantUpload, processAttachments } from "./services/assistant-attachments";
import { generateStaffResponse } from "./services/ipm-assistant";

class RequestError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
const handle = (callback: (req: Request, res: Response) => Promise<void>): RequestHandler =>
  (req, res) => {
    callback(req, res).catch(error => {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid request fields.", details: error.issues.map(issue => ({ field: issue.path.join("."), message: issue.message })) });
      } else if (error instanceof RequestError) {
        res.status(error.status).json({ error: error.message });
      } else {
        // No messages, filenames, attachments, provider payloads or lead PII in logs.
        console.error("IPM Assistant request failed", { method: req.method, route: req.route?.path });
        res.status(500).json({ error: "Unable to complete this request. Please try again." });
      }
    });
  };
const idParam = (req: Request) => z.string().uuid().parse(req.params.id);
const getThread = async (req: Request) => {
  const thread = await assistantStorage.getThread(idParam(req), req.staff!.userId);
  if (!thread) throw new RequestError(404, "Conversation not found.");
  return thread;
};

const rateWindows = new Map<string, { count: number; reset: number }>();
const inFlight = new Set<string>();
export const assistantRateLimit: RequestHandler = (req, res, next) => {
  const userId = req.staff!.userId;
  const now = Date.now();
  if (rateWindows.size > 1000) {
    rateWindows.forEach((window, key) => { if (window.reset <= now) rateWindows.delete(key); });
  }
  let window = rateWindows.get(userId);
  if (!window || window.reset <= now) {
    window = { count: 0, reset: now + 60000 };
    rateWindows.set(userId, window);
  }
  if (window.count >= 12) {
    res.setHeader("Retry-After", Math.ceil((window.reset - now) / 1000));
    res.status(429).json({ error: "Too many AI requests. Please wait a moment before generating another response." });
    return;
  }
  if (inFlight.has(userId)) {
    res.status(409).json({ error: "Another response is still being generated. Please wait for it to finish." });
    return;
  }
  window.count++;
  inFlight.add(userId);
  // Release only after processing finishes, not when the browser disconnects.
  res.locals.releaseAssistant = () => inFlight.delete(userId);
  next();
};
const upload: RequestHandler = (req, res, next) => {
  assistantUpload(req, res, error => {
    if (error) {
      res.locals.releaseAssistant?.();
      res.status(400).json({ error: error.code === "LIMIT_FILE_SIZE" ? "Each attachment must be 8 MB or smaller." : error.message });
      return;
    }
    next();
  });
};

export function registerAssistantRoutes(app: Express) {
  app.use("/api/staff", requireStaff);
  app.use("/api/assistant", requireStaff);
  app.get("/api/staff/me", (req, res) => res.json(req.staff));
  app.get("/api/staff/leads", handle(async (_req, res) => {
    res.json(await storage.getAllLeads());
  }));
  app.get("/api/assistant/threads", handle(async (req, res) => {
    res.json(await assistantStorage.listThreads(req.staff!.userId));
  }));
  app.post("/api/assistant/threads", handle(async (req, res) => {
    const input = assistantThreadInputSchema.parse(req.body);
    let context: Array<{ role: string; content: string }> = [];
    if (input.leadId) {
      const lead = await storage.getLeadById(input.leadId);
      if (!lead) throw new RequestError(404, "Lead not found.");
      // Reuse the existing lead; do not create another contact record.
      input.leadName = input.leadName ?? lead.name ?? "";
      input.phone = input.phone ?? lead.phone ?? "";
      input.email = input.email ?? lead.email ?? "";
      input.propertyLocation = input.propertyLocation ?? lead.locationPreference ?? "";
      input.title = input.title || lead.name || "Lead conversation";
      if (lead.sessionId) {
        context = (await storage.getChatMessagesBySession(lead.sessionId))
          .filter(message => message.role === "user" || message.role === "assistant")
          .slice(-20).map(message => ({ role: message.role, content: message.content }));
      }
    }
    res.status(201).json(await assistantStorage.createThread(req.staff!.userId, input, context));
  }));
  app.get("/api/assistant/threads/:id", handle(async (req, res) => {
    const thread = await getThread(req);
    res.json({ thread, messages: await assistantStorage.messages(thread.id) });
  }));
  app.patch("/api/assistant/threads/:id", handle(async (req, res) => {
    const thread = await getThread(req);
    const input = assistantThreadInputSchema.omit({ leadId: true }).parse(req.body);
    res.json(await assistantStorage.updateThread(thread.id, req.staff!.userId, input));
  }));
  app.delete("/api/assistant/threads/:id", handle(async (req, res) => {
    const removed = await assistantStorage.deleteThread(idParam(req), req.staff!.userId);
    if (!removed.length) throw new RequestError(404, "Conversation not found.");
    res.json({ ok: true });
  }));
  app.post("/api/assistant/threads/:id/generate", assistantRateLimit, upload, handle(async (req, res) => {
    const files = (req.files || []) as Express.Multer.File[];
    try {
      const thread = await getThread(req);
      const input = generateResponseSchema.parse(req.body);
      const history = await assistantStorage.messages(thread.id);
      if (input.action === "answer" && !input.message && !files.length) throw new RequestError(400, "Paste a message or attach a file.");
      if (input.action !== "answer" && !input.message && !files.length && !history.length) throw new RequestError(400, "Start a conversation before using this action.");
      let attachments;
      try { attachments = await processAttachments(files); }
      catch (error) { throw new RequestError(400, error instanceof Error ? error.message : "Invalid attachment."); }
      let result;
      try { result = await generateStaffResponse(thread, history, input, attachments); }
      catch {
        throw new RequestError(502, "Unable to generate a complete response right now. Please try again. No draft was saved.");
      }
      const hasNewClientData = !!input.message || files.length > 0;
      const generated = await assistantStorage.saveGeneration(thread.id, req.staff!.userId, {
        ...(hasNewClientData ? {
          userContent: input.message || "Attached conversation",
          userMetadata: {
            attachments: attachments.map(attachment => attachment.metadata),
            attachmentContext: result.attachmentContext, action: input.action,
          },
        } : {}),
        response: result.response, action: input.action,
        threadUpdate: {
          stage: result.stage, language: input.language, responseType: input.responseType,
          ...(thread.title === "New conversation" ? { title: thread.leadName || input.message.slice(0, 70) || "Attached conversation" } : {}),
        },
      });
      res.json(generated);
    } finally {
      for (const file of files) file.buffer.fill(0);
      req.files = undefined;
      res.locals.releaseAssistant?.();
    }
  }));
  app.patch("/api/assistant/messages/:id", handle(async (req, res) => {
    const original = await assistantStorage.getOwnedMessage(idParam(req), req.staff!.userId);
    if (!original || original.role !== "assistant") throw new RequestError(404, "Response not found.");
    const { content } = z.object({ content: z.string().trim().min(1).max(15000) }).strict().parse(req.body);
    res.json(await assistantStorage.updateMessage(original.id, { content, metadata: { ...original.metadata, edited: true } }));
  }));
  app.post("/api/assistant/messages/:id/feedback", handle(async (req, res) => {
    const original = await assistantStorage.getOwnedMessage(idParam(req), req.staff!.userId);
    if (!original || original.role !== "assistant") throw new RequestError(404, "Response not found.");
    const { rating } = z.object({ rating: z.enum(["good", "needs_improvement"]).nullable() }).strict().parse(req.body);
    res.json(await assistantStorage.updateMessage(original.id, { feedback: rating }));
  }));
  app.get("/api/assistant/saved-responses", handle(async (req, res) => {
    res.json(await assistantStorage.listSaved(req.staff!.userId));
  }));
  app.post("/api/assistant/saved-responses", handle(async (req, res) => {
    res.status(201).json(await assistantStorage.createSaved(req.staff!.userId, savedResponseInputSchema.parse(req.body)));
  }));
  app.patch("/api/assistant/saved-responses/:id", handle(async (req, res) => {
    const response = await assistantStorage.updateSaved(idParam(req), req.staff!.userId, savedResponseInputSchema.partial().parse(req.body));
    if (!response) throw new RequestError(404, "Saved response not found.");
    res.json(response);
  }));
  app.delete("/api/assistant/saved-responses/:id", handle(async (req, res) => {
    const removed = await assistantStorage.deleteSaved(idParam(req), req.staff!.userId);
    if (!removed.length) throw new RequestError(404, "Saved response not found.");
    res.json({ ok: true });
  }));
  app.use("/api/assistant/knowledge", requireAdmin);
  app.get("/api/assistant/knowledge", handle(async (_req, res) => { res.json(await knowledgeStorage.list()); }));
  const knowledgeInput = knowledgeInputSchema.refine(item => !item.category.startsWith("_"), "Reserved category.");
  app.post("/api/assistant/knowledge", handle(async (req, res) => {
    res.status(201).json(await knowledgeStorage.create(knowledgeInput.parse(req.body), req.staff!.userId));
  }));
  app.patch("/api/assistant/knowledge/:id", handle(async (req, res) => {
    const input = knowledgeInputSchema.partial().refine(item => !item.category?.startsWith("_"), "Reserved category.").parse(req.body);
    const item = await knowledgeStorage.update(idParam(req), input, req.staff!.userId);
    if (!item) throw new RequestError(404, "Knowledge item not found.");
    res.json(item);
  }));
  app.delete("/api/assistant/knowledge/:id", handle(async (req, res) => {
    const removed = await knowledgeStorage.delete(idParam(req));
    if (!removed.length) throw new RequestError(404, "Knowledge item not found.");
    res.json({ ok: true });
  }));
}
