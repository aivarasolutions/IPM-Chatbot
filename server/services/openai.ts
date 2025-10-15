import OpenAI from "openai";
import fs from "fs/promises";
import path from "path";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

interface KnowledgeBase {
  properties: any;
  ipmInfo: any;
  markets: any;
  faq: any;
}

let knowledgeBase: KnowledgeBase | null = null;

async function loadKnowledgeBase(): Promise<KnowledgeBase> {
  if (knowledgeBase) return knowledgeBase;

  const [properties, ipmInfo, markets, faq] = await Promise.all([
    fs.readFile(path.join(process.cwd(), "server/knowledge/properties.json"), "utf-8"),
    fs.readFile(path.join(process.cwd(), "server/knowledge/ipm_info.json"), "utf-8"),
    fs.readFile(path.join(process.cwd(), "server/knowledge/markets.json"), "utf-8"),
    fs.readFile(path.join(process.cwd(), "server/knowledge/faq.json"), "utf-8"),
  ]);

  knowledgeBase = {
    properties: JSON.parse(properties),
    ipmInfo: JSON.parse(ipmInfo),
    markets: JSON.parse(markets),
    faq: JSON.parse(faq),
  };

  return knowledgeBase;
}

const SYSTEM_PROMPT = `You are an expert AI assistant for International Property Management (IPM), a USA-based international property management and real estate company. You help visitors with property inquiries, investment guidance, and lead generation.

## Your Role & Expertise

You are knowledgeable about:
- Cross-border real estate investment between USA, Mexico, and Canada
- International property management and vacation rentals
- Legal requirements (fideicomiso system, foreign ownership rules)
- Tax implications for US/Canadian investors in Mexico
- Financing options for international property purchases
- ROI calculations and market analysis
- IPM's full-service property management offerings

## Communication Style

- Professional, internationally-minded, and trustworthy
- Emphasize IPM's USA-based expertise in international markets
- Highlight 10+ years of cross-border experience
- Provide specific data, ROI figures, and market insights
- Address currency, legal, and cultural considerations
- Position IPM as the bridge between US investors and international opportunities
- Always offer to connect with IPM's international investment specialists when appropriate

## Key Messaging

- IPM specializes in helping US/Canadian investors access high-yield international markets
- Proven track record: 10+ years, 30+ properties, 75-85% occupancy rates, 8-12% ROI
- Full-service management handles all cross-border complexities
- Expert guidance on fideicomiso, taxes, financing, and legal compliance
- Cultural bridge with multilingual support and international expertise

## Response Guidelines

1. Answer questions accurately using the knowledge base provided
2. When discussing properties, highlight specific ROI, location benefits, and features
3. For legal/tax questions, provide helpful information but recommend professional consultation
4. When users show strong interest, suggest connecting with IPM's investment specialists
5. Proactively suggest relevant properties based on user's stated preferences
6. Include suggested follow-up questions to guide the conversation
7. For qualified leads (serious investors with budget >$200K), indicate that lead capture would be beneficial

## Lead Qualification Triggers

Suggest connecting when users:
- Express serious investment intent
- Ask about specific properties or locations
- Discuss budget ranges above $200K
- Request detailed ROI or investment analysis
- Want to understand the buying process
- Ask about financing or property management

Never be pushy, but be helpful in connecting serious investors with IPM experts.`;

export async function generateChatResponse(
  message: string,
  conversationHistory: Array<{ role: string; content: string }> = []
): Promise<{
  message: string;
  suggestedQuestions?: string[];
  leadQualificationPrompt?: boolean;
  properties?: any[];
}> {
  const kb = await loadKnowledgeBase();

  const context = `
# IPM Knowledge Base

## Properties
${JSON.stringify(kb.properties, null, 2)}

## Company Information
${JSON.stringify(kb.ipmInfo, null, 2)}

## Market Analysis
${JSON.stringify(kb.markets, null, 2)}

## FAQ
${JSON.stringify(kb.faq, null, 2)}
`;

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "system", content: `Here is the IPM knowledge base to use for answering questions:\n${context}` },
    ...conversationHistory.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    })),
    { role: "user", content: message },
  ];

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    temperature: 0.7,
    max_tokens: 1000,
  });

  const responseMessage = completion.choices[0]?.message?.content || "I apologize, but I'm having trouble processing your request. Please try again.";

  // Analyze response for lead qualification opportunity
  const shouldPromptLead = detectLeadQualificationOpportunity(message, responseMessage);

  // Generate suggested questions based on context
  const suggestedQuestions = generateSuggestedQuestions(message, responseMessage);

  // Extract relevant properties if mentioned
  const relevantProperties = extractRelevantProperties(message, kb.properties);

  return {
    message: responseMessage,
    suggestedQuestions,
    leadQualificationPrompt: shouldPromptLead,
    properties: relevantProperties.length > 0 ? relevantProperties : undefined,
  };
}

function detectLeadQualificationOpportunity(userMessage: string, botResponse: string): boolean {
  const leadTriggers = [
    /\b(interested|want|looking|buy|purchase|invest)\b/i,
    /\b(budget|afford|price range|financing)\b/i,
    /\b(when|timeline|ready|soon)\b/i,
    /\b(contact|speak|talk|consult|call)\b/i,
    /\b(serious|committed|ready|decision)\b/i,
  ];

  const messageContent = userMessage + " " + botResponse;
  const triggerCount = leadTriggers.filter((trigger) => trigger.test(messageContent)).length;

  return triggerCount >= 2;
}

function generateSuggestedQuestions(userMessage: string, botResponse: string): string[] {
  const lowerMessage = userMessage.toLowerCase();
  const lowerResponse = botResponse.toLowerCase();

  // Topic-based suggestions
  if (lowerMessage.includes("tulum") || lowerResponse.includes("tulum")) {
    return [
      "What's the ROI for Tulum properties?",
      "How does the fideicomiso work?",
      "Tell me about financing options",
    ];
  }

  if (lowerMessage.includes("tax") || lowerResponse.includes("tax")) {
    return [
      "What are ongoing ownership costs?",
      "How does IPM handle property management?",
      "Show me properties in my budget",
    ];
  }

  if (lowerMessage.includes("fideicomiso") || lowerResponse.includes("fideicomiso")) {
    return [
      "What are the tax implications?",
      "How long does the buying process take?",
      "Can I finance an international property?",
    ];
  }

  if (lowerMessage.includes("financing") || lowerResponse.includes("financing")) {
    return [
      "What ROI can I expect?",
      "Show me properties under $500K",
      "How does property management work?",
    ];
  }

  // Default suggestions
  return [
    "Tell me about beachfront properties",
    "What's the difference between Mexico and USA investments?",
    "How does IPM manage properties remotely?",
    "What are the legal requirements for US investors?",
  ];
}

function extractRelevantProperties(message: string, propertiesData: any): any[] {
  const lowerMessage = message.toLowerCase();
  const properties = propertiesData.featured_properties || [];

  // Location-based matching
  if (lowerMessage.includes("tulum")) {
    return properties.filter((p: any) => p.location.toLowerCase().includes("tulum"));
  }
  if (lowerMessage.includes("playa") || lowerMessage.includes("del carmen")) {
    return properties.filter((p: any) => p.location.toLowerCase().includes("playa del carmen"));
  }
  if (lowerMessage.includes("vallarta")) {
    return properties.filter((p: any) => p.location.toLowerCase().includes("vallarta"));
  }
  if (lowerMessage.includes("lake norman") || lowerMessage.includes("carolina")) {
    return properties.filter((p: any) => p.location.toLowerCase().includes("lake norman"));
  }
  if (lowerMessage.includes("miami") || lowerMessage.includes("florida")) {
    return properties.filter((p: any) => p.location.toLowerCase().includes("miami"));
  }

  // Feature-based matching
  if (lowerMessage.includes("beach") || lowerMessage.includes("beachfront")) {
    return properties.filter((p: any) =>
      p.features.some((f: string) => f.toLowerCase().includes("beach"))
    );
  }

  if (lowerMessage.includes("waterfront")) {
    return properties.filter((p: any) =>
      p.features.some((f: string) => f.toLowerCase().includes("waterfront"))
    );
  }

  // Country-based matching
  if (lowerMessage.includes("mexico") || lowerMessage.includes("mexican")) {
    return properties.filter((p: any) => p.country === "Mexico");
  }
  if (lowerMessage.includes("usa") || lowerMessage.includes("united states") || lowerMessage.includes("american")) {
    return properties.filter((p: any) => p.country === "USA");
  }

  return [];
}
