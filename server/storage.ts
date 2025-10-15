import { type Property, type InsertProperty, type Lead, type InsertLead, type ChatMessage, type InsertChatMessage, properties, leads, chatMessages } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Properties
  getAllProperties(): Promise<Property[]>;
  getPropertyById(id: string): Promise<Property | undefined>;
  createProperty(property: InsertProperty): Promise<Property>;
  
  // Leads
  getAllLeads(): Promise<Lead[]>;
  getLeadById(id: string): Promise<Lead | undefined>;
  getLeadsBySession(sessionId: string): Promise<Lead[]>;
  createLead(lead: InsertLead): Promise<Lead>;
  
  // Chat Messages
  getChatMessagesBySession(sessionId: string): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
}

export class DatabaseStorage implements IStorage {
  // Properties
  async getAllProperties(): Promise<Property[]> {
    return await db.select().from(properties);
  }

  async getPropertyById(id: string): Promise<Property | undefined> {
    const [property] = await db.select().from(properties).where(eq(properties.id, id));
    return property || undefined;
  }

  async createProperty(insertProperty: InsertProperty): Promise<Property> {
    const [property] = await db
      .insert(properties)
      .values(insertProperty)
      .returning();
    return property;
  }

  // Leads
  async getAllLeads(): Promise<Lead[]> {
    return await db.select().from(leads);
  }

  async getLeadById(id: string): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    return lead || undefined;
  }

  async getLeadsBySession(sessionId: string): Promise<Lead[]> {
    return await db.select().from(leads).where(eq(leads.sessionId, sessionId));
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    const [lead] = await db
      .insert(leads)
      .values({
        ...insertLead,
        qualificationStatus: "new",
      })
      .returning();
    return lead;
  }

  // Chat Messages
  async getChatMessagesBySession(sessionId: string): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(chatMessages.timestamp);
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db
      .insert(chatMessages)
      .values(insertMessage)
      .returning();
    return message;
  }
}

export const storage = new DatabaseStorage();
