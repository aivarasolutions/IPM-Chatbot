import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateChatResponse } from "./services/openai";
import { chatRequestSchema, insertLeadSchema, propertySearchSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // Get all properties
  app.get("/api/properties", async (req, res) => {
    try {
      const properties = await storage.getAllProperties();
      res.json(properties);
    } catch (error) {
      console.error("Error fetching properties:", error);
      res.status(500).json({ error: "Failed to fetch properties" });
    }
  });

  // Get property by ID
  app.get("/api/properties/:id", async (req, res) => {
    try {
      const property = await storage.getPropertyById(req.params.id);
      if (!property) {
        return res.status(404).json({ error: "Property not found" });
      }
      res.json(property);
    } catch (error) {
      console.error("Error fetching property:", error);
      res.status(500).json({ error: "Failed to fetch property" });
    }
  });

  // Search properties
  app.post("/api/properties/search", async (req, res) => {
    try {
      const searchParams = propertySearchSchema.parse(req.body);
      let properties = await storage.getAllProperties();

      // Filter by location
      if (searchParams.location) {
        properties = properties.filter((p) =>
          p.location.toLowerCase().includes(searchParams.location!.toLowerCase())
        );
      }

      // Filter by country
      if (searchParams.country) {
        properties = properties.filter((p) =>
          p.country.toLowerCase() === searchParams.country!.toLowerCase()
        );
      }

      // Filter by property type
      if (searchParams.propertyType) {
        properties = properties.filter((p) =>
          p.propertyType.toLowerCase().includes(searchParams.propertyType!.toLowerCase())
        );
      }

      res.json(properties);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid search parameters", details: error.errors });
      }
      console.error("Error searching properties:", error);
      res.status(500).json({ error: "Failed to search properties" });
    }
  });

  // Chat endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, sessionId, context } = chatRequestSchema.parse(req.body);

      // Store user message
      await storage.createChatMessage({
        sessionId: sessionId || `session-${Date.now()}`,
        role: "user",
        content: message,
        metadata: context || null,
      });

      // Get conversation history
      const history = await storage.getChatMessagesBySession(sessionId || "");
      const conversationHistory = history.slice(-10).map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Generate AI response
      const aiResponse = await generateChatResponse(message, conversationHistory);

      // Store assistant message
      await storage.createChatMessage({
        sessionId: sessionId || `session-${Date.now()}`,
        role: "assistant",
        content: aiResponse.message,
        metadata: {
          suggestedQuestions: aiResponse.suggestedQuestions,
          leadQualificationPrompt: aiResponse.leadQualificationPrompt,
        },
      });

      res.json({
        message: aiResponse.message,
        sessionId: sessionId || `session-${Date.now()}`,
        suggestedQuestions: aiResponse.suggestedQuestions,
        leadQualificationPrompt: aiResponse.leadQualificationPrompt,
        properties: aiResponse.properties,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request", details: error.errors });
      }
      console.error("Error in chat endpoint:", error);
      res.status(500).json({ error: "Failed to process chat message" });
    }
  });

  // Create lead
  app.post("/api/leads", async (req, res) => {
    try {
      const leadData = insertLeadSchema.parse(req.body);
      const lead = await storage.createLead(leadData);
      
      console.log("New lead captured:", {
        id: lead.id,
        email: lead.email,
        budget: lead.budget,
        location: lead.locationPreference,
      });

      res.status(201).json(lead);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid lead data", details: error.errors });
      }
      console.error("Error creating lead:", error);
      res.status(500).json({ error: "Failed to create lead" });
    }
  });

  // Get all leads (admin endpoint)
  app.get("/api/leads", async (req, res) => {
    try {
      const leads = await storage.getAllLeads();
      res.json(leads);
    } catch (error) {
      console.error("Error fetching leads:", error);
      res.status(500).json({ error: "Failed to fetch leads" });
    }
  });

  // Get leads by session
  app.get("/api/leads/session/:sessionId", async (req, res) => {
    try {
      const leads = await storage.getLeadsBySession(req.params.sessionId);
      res.json(leads);
    } catch (error) {
      console.error("Error fetching leads by session:", error);
      res.status(500).json({ error: "Failed to fetch leads" });
    }
  });

  // Get chat history
  app.get("/api/chat/:sessionId", async (req, res) => {
    try {
      const messages = await storage.getChatMessagesBySession(req.params.sessionId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat history:", error);
      res.status(500).json({ error: "Failed to fetch chat history" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
