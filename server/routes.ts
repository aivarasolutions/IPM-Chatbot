import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateChatResponse } from "./services/openai";
import { getExchangeRates } from "./services/currency";
import { chatRequestSchema, insertLeadSchema, propertySearchSchema } from "@shared/schema";
import { z } from "zod";
import { registerAssistantRoutes } from "./assistant-routes";
import { requireStaff } from "./middlewares/staff-auth";

export async function registerRoutes(app: Express): Promise<Server> {
  registerAssistantRoutes(app);
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
  app.get("/api/leads", requireStaff, async (req, res) => {
    try {
      const leads = await storage.getAllLeads();
      res.json(leads);
    } catch (error) {
      console.error("Error fetching leads:", error);
      res.status(500).json({ error: "Failed to fetch leads" });
    }
  });

  // Get leads by session
  app.get("/api/leads/session/:sessionId", requireStaff, async (req, res) => {
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

  // Get exchange rates
  app.get("/api/exchange-rates", async (req, res) => {
    try {
      const rates = await getExchangeRates();
      res.json(rates);
    } catch (error) {
      console.error("Error fetching exchange rates:", error);
      res.status(500).json({ error: "Failed to fetch exchange rates" });
    }
  });

  // Analytics endpoint
  app.get("/api/analytics", requireStaff, async (req, res) => {
    try {
      const leads = await storage.getAllLeads();
      const messages = await storage.getAllChatMessages();
      
      // Calculate analytics
      const totalLeads = leads.length;
      const totalSessions = new Set(messages.map(m => m.sessionId)).size;
      const conversionRate = totalSessions > 0 ? (totalLeads / totalSessions) * 100 : 0;
      
      // Budget distribution
      const budgetDistribution = leads.reduce((acc, lead) => {
        const key = lead.budget || "Not specified";
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      // Investment experience
      const experienceDistribution = leads.reduce((acc, lead) => {
        const key = lead.investmentExperience || "Not specified";
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      // Location preference
      const locationDistribution = leads.reduce((acc, lead) => {
        const key = lead.locationPreference || "Not specified";
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      // Timeline distribution
      const timelineDistribution = leads.reduce((acc, lead) => {
        const key = lead.investmentTimeline || "Not specified";
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      // Messages per session
      const sessionMessages = messages.reduce((acc, msg) => {
        acc[msg.sessionId] = (acc[msg.sessionId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const avgMessagesPerSession = totalSessions > 0 
        ? Object.values(sessionMessages).reduce((a, b) => a + b, 0) / totalSessions 
        : 0;
      
      res.json({
        leads: {
          total: totalLeads,
          budgetDistribution,
          experienceDistribution,
          locationDistribution,
          timelineDistribution,
        },
        conversations: {
          totalSessions,
          totalMessages: messages.length,
          avgMessagesPerSession: Math.round(avgMessagesPerSession * 10) / 10,
          conversionRate: Math.round(conversionRate * 10) / 10,
        },
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
