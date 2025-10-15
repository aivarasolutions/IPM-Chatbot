import { type Property, type InsertProperty, type Lead, type InsertLead, type ChatMessage, type InsertChatMessage } from "@shared/schema";
import { randomUUID } from "crypto";

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

export class MemStorage implements IStorage {
  private properties: Map<string, Property>;
  private leads: Map<string, Lead>;
  private chatMessages: Map<string, ChatMessage>;

  constructor() {
    this.properties = new Map();
    this.leads = new Map();
    this.chatMessages = new Map();
    
    this.initializeProperties();
  }

  private async initializeProperties() {
    const fs = await import("fs/promises");
    const path = await import("path");
    
    try {
      const propertiesData = await fs.readFile(
        path.join(process.cwd(), "server/knowledge/properties.json"),
        "utf-8"
      );
      const { featured_properties } = JSON.parse(propertiesData);
      
      featured_properties.forEach((prop: any) => {
        const property: Property = {
          id: prop.id,
          name: prop.name,
          location: prop.location,
          country: prop.country,
          priceRange: prop.priceRange,
          roi: prop.roi,
          features: prop.features,
          description: prop.description,
          imageUrl: prop.imageUrl,
          propertyType: prop.propertyType,
          createdAt: new Date(),
        };
        this.properties.set(property.id, property);
      });
    } catch (error) {
      console.error("Error loading properties:", error);
    }
  }

  // Properties
  async getAllProperties(): Promise<Property[]> {
    return Array.from(this.properties.values());
  }

  async getPropertyById(id: string): Promise<Property | undefined> {
    return this.properties.get(id);
  }

  async createProperty(insertProperty: InsertProperty): Promise<Property> {
    const id = randomUUID();
    const property: Property = {
      ...insertProperty,
      id,
      createdAt: new Date(),
    };
    this.properties.set(id, property);
    return property;
  }

  // Leads
  async getAllLeads(): Promise<Lead[]> {
    return Array.from(this.leads.values());
  }

  async getLeadById(id: string): Promise<Lead | undefined> {
    return this.leads.get(id);
  }

  async getLeadsBySession(sessionId: string): Promise<Lead[]> {
    return Array.from(this.leads.values()).filter(
      (lead) => lead.sessionId === sessionId
    );
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    const id = randomUUID();
    const lead: Lead = {
      ...insertLead,
      id,
      qualificationStatus: "new",
      createdAt: new Date(),
    };
    this.leads.set(id, lead);
    return lead;
  }

  // Chat Messages
  async getChatMessagesBySession(sessionId: string): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter((msg) => msg.sessionId === sessionId)
      .sort((a, b) => {
        const timeA = a.timestamp?.getTime() || 0;
        const timeB = b.timestamp?.getTime() || 0;
        return timeA - timeB;
      });
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = randomUUID();
    const message: ChatMessage = {
      ...insertMessage,
      id,
      timestamp: new Date(),
    };
    this.chatMessages.set(id, message);
    return message;
  }
}

export const storage = new MemStorage();
