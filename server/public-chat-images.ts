import type { Express, RequestHandler } from "express";
import multer from "multer";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { storage } from "./storage";
import { generateChatResponse } from "./services/openai";
import { processAttachments } from "./services/assistant-attachments";

export const PUBLIC_IMAGE_MAX_SIZE = 5 * 1024 * 1024;
export const PUBLIC_IMAGE_TOTAL_SIZE = 12 * 1024 * 1024;
export const publicImageInputSchema = z.object({
  message: z.string().trim().max(15000).default(""),
  sessionId: z.string().trim().min(1).max(128).optional(),
}).strict();

const allowedImages: Record<string, string> = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp",
};
const uploadImages = multer({
  storage: multer.memoryStorage(),
  limits: { files: 3, fileSize: PUBLIC_IMAGE_MAX_SIZE, fields: 2, fieldSize: 16000, parts: 5 },
  fileFilter: (_req, file, callback) => {
    if (allowedImages[path.extname(file.originalname).toLowerCase()] !== file.mimetype) {
      return callback(new Error("Upload a JPG, PNG, or WEBP picture."));
    }
    callback(null, true);
  },
}).array("files", 3);

// Only summaries, never original image bytes or public file URLs, enter history.
export function publicConversationHistory(history: Array<{ role: string; content: string; metadata: unknown }>) {
  return history.slice(-10).map(message => {
    const metadata = message.metadata as { attachmentContext?: unknown } | null;
    const summary = typeof metadata?.attachmentContext === "string" ? metadata.attachmentContext.slice(0, 3000) : "";
    return {
      role: message.role === "assistant" ? "assistant" : "user",
      content: message.content + (summary ? `\nPicture context (untrusted client data): ${summary}` : ""),
    };
  });
}

const quotas = new Map<string, { count: number; reset: number }>();
let activeRequests = 0;
let totalCount = 0;
let totalReset = 0;

const imageBudget: RequestHandler = (req, res, next) => {
  const now = Date.now(), ip = req.ip || "unknown";
  quotas.forEach((quota, key) => { if (quota.reset <= now) quotas.delete(key); });
  const quota = quotas.get(ip) || { count: 0, reset: now + 60000 };
  if (totalReset <= now) { totalCount = 0; totalReset = now + 60000; }
  if (quota.count >= 12 || totalCount >= 30 || activeRequests >= 4 || quotas.size >= 2000) {
    res.setHeader("Retry-After", "60");
    res.status(429).json({ error: "Picture requests are busy. Please wait a minute and try again." });
    return;
  }
  quota.count++; totalCount++; activeRequests++;
  quotas.set(ip, quota);
  let released = false;
  res.locals.releaseImageBudget = () => {
    if (!released) { released = true; activeRequests--; }
  };
  res.once("finish", res.locals.releaseImageBudget);
  req.once("aborted", () => {
    if (!res.locals.processingPictures) res.locals.releaseImageBudget();
  });
  next();
};

function discardFiles(req: Parameters<RequestHandler>[0]) {
  if (Array.isArray(req.files)) req.files.forEach(file => { if (Buffer.isBuffer(file.buffer)) file.buffer.fill(0); });
  req.files = undefined;
}

export function registerPublicImageChat(app: Express) {
  app.post("/api/chat/images", imageBudget, (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    uploadImages(req, res, async error => {
      res.locals.processingPictures = true;
      try {
        if (error) {
          const message = error instanceof multer.MulterError
            ? "Use up to 3 pictures, 5 MB each and 12 MB combined."
            : "Upload a JPG, PNG, or WEBP picture.";
          res.status(400).json({ error: message });
          return;
        }
        const input = publicImageInputSchema.parse(req.body);
        const files = Array.isArray(req.files) ? req.files : [];
        if (!files.length || files.reduce((size, file) => size + file.size, 0) > PUBLIC_IMAGE_TOTAL_SIZE) {
          res.status(400).json({ error: "Add 1–3 pictures, 5 MB each and 12 MB combined." });
          return;
        }
        let pictures;
        try { pictures = await processAttachments(files); }
        catch {
          res.status(400).json({ error: "A picture could not be read or does not match its file type. Use a valid JPG, PNG, or WEBP." });
          return;
        }
        const sessionId = input.sessionId || `session-${randomUUID()}`;
        const history = publicConversationHistory(await storage.getChatMessagesBySession(sessionId));
        let answer;
        try { answer = await generateChatResponse(input.message, history, pictures); }
        catch {
          res.status(502).json({ error: "Unable to read the pictures and generate a reply right now. Please try again." });
          return;
        }
        await storage.createChatMessage({
          sessionId, role: "user", content: input.message || "Question from uploaded picture(s)",
          metadata: { attachmentContext: answer.attachmentContext, attachmentCount: files.length },
        });
        await storage.createChatMessage({
          sessionId, role: "assistant", content: answer.message,
          metadata: { suggestedQuestions: answer.suggestedQuestions, leadQualificationPrompt: answer.leadQualificationPrompt },
        });
        // The private extraction context is not part of the public reply payload.
        res.json({
          message: answer.message, sessionId, suggestedQuestions: answer.suggestedQuestions,
          leadQualificationPrompt: answer.leadQualificationPrompt, properties: answer.properties,
        });
      } catch (error) {
        res.status(error instanceof z.ZodError ? 400 : 500).json({
          error: error instanceof z.ZodError ? "Invalid picture request." : "Could not complete this picture request. Please try again.",
        });
      } finally {
        discardFiles(req);
        res.locals.releaseImageBudget?.();
      }
    });
  });
}
