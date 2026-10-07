import { and, asc, desc, eq, ne } from "drizzle-orm";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { db } from "./db";
import {
  assistantThreads, assistantMessages, savedResponses, aiKnowledge,
  type AssistantThreadInput, type AssistantMessageMetadata,
} from "@shared/schema";

export const assistantStorage = {
  async listThreads(staffUserId: string) {
    return db.select().from(assistantThreads).where(eq(assistantThreads.staffUserId, staffUserId)).orderBy(desc(assistantThreads.updatedAt)).limit(200);
  },
  async getThread(id: string, staffUserId: string) {
    const [thread] = await db.select().from(assistantThreads).where(and(eq(assistantThreads.id, id), eq(assistantThreads.staffUserId, staffUserId)));
    return thread;
  },
  async createThread(staffUserId: string, input: AssistantThreadInput, context: Array<{ role: string; content: string }> = []) {
    return db.transaction(async tx => {
      const [thread] = await tx.insert(assistantThreads).values({
        ...input, title: input.title || input.leadName || "New conversation", staffUserId,
      }).returning();
      if (context.length) {
        await tx.insert(assistantMessages).values(context.map(message => ({
          threadId: thread.id, role: message.role, content: message.content,
          metadata: { action: "imported" },
        })));
      }
      return thread;
    });
  },
  async updateThread(id: string, staffUserId: string, input: AssistantThreadInput) {
    const [thread] = await db.update(assistantThreads).set({ ...input, updatedAt: new Date() })
      .where(and(eq(assistantThreads.id, id), eq(assistantThreads.staffUserId, staffUserId))).returning();
    return thread;
  },
  async deleteThread(id: string, staffUserId: string) {
    return db.delete(assistantThreads).where(and(eq(assistantThreads.id, id), eq(assistantThreads.staffUserId, staffUserId))).returning({ id: assistantThreads.id });
  },
  async messages(threadId: string) {
    return db.select().from(assistantMessages).where(eq(assistantMessages.threadId, threadId)).orderBy(asc(assistantMessages.createdAt));
  },
  async saveGeneration(threadId: string, staffUserId: string, input: {
    userContent?: string; userMetadata?: AssistantMessageMetadata; response: string;
    action: string; threadUpdate: AssistantThreadInput;
  }) {
    return db.transaction(async tx => {
      // Ownership is checked again in the transaction, including delete/generate races.
      const [thread] = await tx.update(assistantThreads).set({ ...input.threadUpdate, updatedAt: new Date() })
        .where(and(eq(assistantThreads.id, threadId), eq(assistantThreads.staffUserId, staffUserId))).returning();
      if (!thread) throw new Error("Conversation no longer exists");
      if (input.userContent !== undefined) {
        await tx.insert(assistantMessages).values({
          threadId, role: "user", content: input.userContent, metadata: input.userMetadata,
        });
      }
      const [message] = await tx.insert(assistantMessages).values({
        threadId, role: "assistant", content: input.response, metadata: { action: input.action },
      }).returning();
      return { message, thread };
    });
  },
  async getOwnedMessage(id: string, staffUserId: string) {
    const [row] = await db.select({ message: assistantMessages }).from(assistantMessages)
      .innerJoin(assistantThreads, eq(assistantMessages.threadId, assistantThreads.id))
      .where(and(eq(assistantMessages.id, id), eq(assistantThreads.staffUserId, staffUserId)));
    return row?.message;
  },
  async updateMessage(id: string, changes: { content?: string; feedback?: string | null; metadata?: AssistantMessageMetadata }) {
    const [message] = await db.update(assistantMessages).set(changes).where(eq(assistantMessages.id, id)).returning();
    return message;
  },
  async listSaved(staffUserId: string) {
    return db.select().from(savedResponses).where(eq(savedResponses.staffUserId, staffUserId)).orderBy(desc(savedResponses.updatedAt));
  },
  async createSaved(staffUserId: string, input: { title: string; category: string; content: string }) {
    const [response] = await db.insert(savedResponses).values({ ...input, staffUserId }).returning();
    return response;
  },
  async updateSaved(id: string, staffUserId: string, input: Partial<{ title: string; category: string; content: string }>) {
    const [response] = await db.update(savedResponses).set({ ...input, updatedAt: new Date() })
      .where(and(eq(savedResponses.id, id), eq(savedResponses.staffUserId, staffUserId))).returning();
    return response;
  },
  async deleteSaved(id: string, staffUserId: string) {
    return db.delete(savedResponses).where(and(eq(savedResponses.id, id), eq(savedResponses.staffUserId, staffUserId))).returning({ id: savedResponses.id });
  },
};

let seeded: Promise<void> | undefined;
async function ensureKnowledgeSeed() {
  if (!seeded) {
    seeded = (async () => {
      const [marker] = await db.select({ id: aiKnowledge.id }).from(aiKnowledge).where(eq(aiKnowledge.seedKey, "__initialized"));
      if (marker) return;
      const data = JSON.parse(await readFile(path.join(process.cwd(), "server/knowledge/lead-response.json"), "utf8"));
      await db.transaction(async tx => {
        await tx.insert(aiKnowledge).values(data).onConflictDoNothing();
        await tx.insert(aiKnowledge).values({
          seedKey: "__initialized", title: "Knowledge initialized", category: "_system", content: "Initial approved knowledge loaded.",
        }).onConflictDoNothing();
      });
    })().catch(error => { seeded = undefined; throw error; });
  }
  await seeded;
}

export const knowledgeStorage = {
  async list() {
    await ensureKnowledgeSeed();
    return db.select().from(aiKnowledge).where(ne(aiKnowledge.category, "_system")).orderBy(asc(aiKnowledge.category), asc(aiKnowledge.title));
  },
  async create(input: { title: string; category: string; content: string }, userId: string) {
    await ensureKnowledgeSeed();
    const [item] = await db.insert(aiKnowledge).values({ ...input, updatedBy: userId }).returning();
    return item;
  },
  async update(id: string, input: Partial<{ title: string; category: string; content: string }>, userId: string) {
    const [item] = await db.update(aiKnowledge).set({ ...input, updatedBy: userId, updatedAt: new Date() })
      .where(and(eq(aiKnowledge.id, id), ne(aiKnowledge.category, "_system"))).returning();
    return item;
  },
  async delete(id: string) {
    return db.delete(aiKnowledge).where(and(eq(aiKnowledge.id, id), ne(aiKnowledge.category, "_system"))).returning({ id: aiKnowledge.id });
  },
};
