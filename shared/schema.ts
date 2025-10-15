import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Properties Schema
export const properties = pgTable("properties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  location: text("location").notNull(),
  country: text("country").notNull(),
  priceRange: text("price_range").notNull(),
  roi: text("roi").notNull(),
  features: text("features").array().notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  propertyType: text("property_type").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPropertySchema = createInsertSchema(properties).omit({
  id: true,
  createdAt: true,
});

export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Property = typeof properties.$inferSelect;

// Chat Messages Schema
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  role: text("role").notNull(), // 'user' | 'assistant' | 'system'
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  metadata: jsonb("metadata"), // For storing additional context
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  timestamp: true,
});

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

// Leads Schema
export const leads = pgTable("leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id"),
  name: text("name"),
  email: text("email"),
  phone: text("phone"),
  citizenship: text("citizenship"),
  budget: text("budget"),
  investmentExperience: text("investment_experience"),
  locationPreference: text("location_preference"),
  investmentTimeline: text("investment_timeline"),
  notes: text("notes"),
  qualificationStatus: text("qualification_status").default("new"), // 'new' | 'qualified' | 'contacted'
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
});

export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;

// Chat Request/Response Types
export const chatRequestSchema = z.object({
  message: z.string().min(1),
  sessionId: z.string().optional(),
  context: z.record(z.any()).optional(),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;

export const chatResponseSchema = z.object({
  message: z.string(),
  sessionId: z.string(),
  suggestedQuestions: z.array(z.string()).optional(),
  leadQualificationPrompt: z.boolean().optional(),
  properties: z.array(z.any()).optional(),
});

export type ChatResponse = z.infer<typeof chatResponseSchema>;

// Property Search Types
export const propertySearchSchema = z.object({
  location: z.string().optional(),
  country: z.string().optional(),
  minBudget: z.number().optional(),
  maxBudget: z.number().optional(),
  propertyType: z.string().optional(),
});

export type PropertySearch = z.infer<typeof propertySearchSchema>;
