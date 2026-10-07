import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { z } from "zod";

export const responseTypes = ["lead", "owner", "general"] as const;
export const languages = ["auto", "en", "es"] as const;
export const leadStages = [
  "New lead", "Initial contact", "Interested", "Question/objection", "Pricing question",
  "Platform question", "Trust question", "Follow-up needed", "Ready to onboard",
  "Onboarding started", "Owner already active",
] as const;
export const assistantActions = [
  "answer", "regenerate", "shorter", "friendlier", "professional", "follow-up",
  "objection", "promotion", "management", "onboarding", "natural", "translate",
] as const;

export const assistantThreads = pgTable("assistant_threads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  staffUserId: text("staff_user_id").notNull(),
  leadId: varchar("lead_id"),
  title: text("title").notNull().default("New conversation"),
  leadName: text("lead_name").notNull().default(""),
  propertyName: text("property_name").notNull().default(""),
  propertyLocation: text("property_location").notNull().default(""),
  phone: text("phone").notNull().default(""),
  email: text("email").notNull().default(""),
  leadSource: text("lead_source").notNull().default(""),
  stage: text("stage").notNull().default("New lead"),
  responseType: text("response_type").notNull().default("lead"),
  language: text("language").notNull().default("auto"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, table => [index("assistant_threads_staff_updated_idx").on(table.staffUserId, table.updatedAt)]);

export interface AttachmentMetadata { name: string; mime: string; size: number }
export interface AssistantMessageMetadata {
  attachments?: AttachmentMetadata[];
  attachmentContext?: string;
  action?: string;
  edited?: boolean;
}
export const assistantMessages = pgTable("assistant_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  threadId: varchar("thread_id").notNull().references(() => assistantThreads.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  feedback: text("feedback"),
  metadata: jsonb("metadata").$type<AssistantMessageMetadata>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, table => [index("assistant_messages_thread_created_idx").on(table.threadId, table.createdAt)]);

export const savedResponses = pgTable("saved_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  staffUserId: text("staff_user_id").notNull(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, table => [index("saved_responses_staff_idx").on(table.staffUserId)]);

export const aiKnowledge = pgTable("ai_knowledge", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  seedKey: text("seed_key").unique(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  content: text("content").notNull(),
  updatedBy: text("updated_by"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

const shortText = z.string().trim().max(250);
export const assistantThreadInputSchema = z.object({
  title: shortText.optional(),
  leadId: z.string().uuid().optional(),
  leadName: shortText.optional(),
  propertyName: shortText.optional(),
  propertyLocation: shortText.optional(),
  phone: z.string().trim().max(100).optional(),
  email: z.string().trim().max(250).optional(),
  leadSource: shortText.optional(),
  stage: z.enum(leadStages).optional(),
  responseType: z.enum(responseTypes).optional(),
  language: z.enum(languages).optional(),
}).strict();

export const generateResponseSchema = z.object({
  message: z.string().trim().max(15000).default(""),
  action: z.enum(assistantActions).default("answer"),
  language: z.enum(languages).default("auto"),
  responseType: z.enum(responseTypes).default("lead"),
}).strict();
export const savedResponseInputSchema = z.object({
  title: z.string().trim().min(1).max(120),
  category: z.string().trim().min(1).max(80),
  content: z.string().trim().min(1).max(15000),
}).strict();
export const knowledgeInputSchema = savedResponseInputSchema.extend({
  content: z.string().trim().min(1).max(20000),
});

export type AssistantThread = typeof assistantThreads.$inferSelect;
export type AssistantMessage = typeof assistantMessages.$inferSelect;
export type SavedResponse = typeof savedResponses.$inferSelect;
export type AIKnowledge = typeof aiKnowledge.$inferSelect;
export type AssistantThreadInput = z.infer<typeof assistantThreadInputSchema>;
export type GenerateResponseInput = z.infer<typeof generateResponseSchema>;
