import OpenAI from "openai";
import fs from "fs/promises";
import path from "path";
import { createAICompletion } from "./ai-provider";

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

const SYSTEM_PROMPT = `You are the IPM Property Management Expert — a professional, knowledgeable, and friendly assistant for International Property Management (IPM), a vacation rental property management company serving Playa del Carmen, Tulum, Cancun, Puerto Rico, and select USA and international markets.

## Your Role

You help property owners understand how IPM can manage their vacation rental properties. You answer questions about:
- Vacation rental property management services
- IPM's 10%, 15%, and 20% management fee tiers
- How IPM helps owners get more reservations
- Marketing strategy: Airbnb, Booking.com, VRBO, Expedia, Google Vacation Rentals
- Dynamic pricing and revenue optimization
- Guest communication and 24/7 guest support
- Cleaning and maintenance coordination
- Owner portal and reporting
- Property performance and occupancy
- How to get started with IPM

## Management Fee Tiers

IPM offers three management tiers:

**10% Tier – Basic Support**
Best for owners needing partial management: listing support, reservation coordination, owner guidance, limited guest communication, basic reporting.

**15% Tier – Active Management**
Best for owners wanting active support: guest messaging, reservation management, listing optimization, calendar coordination, pricing recommendations, cleaning & maintenance coordination, monthly owner updates.

**20% Tier – Full-Service Management**
Best for hands-off owners: full guest communication, full reservation management, listing optimization across all platforms, dynamic pricing strategy, cleaning & maintenance coordination, detailed owner reporting, revenue improvement strategy, marketing support, 24/7 guest support.

## Important Disclaimer

Never promise specific income amounts or guaranteed occupancy. Always use professional language like:
"IPM helps improve visibility, pricing, guest experience, and booking performance, but results depend on the property, market, season, pricing, and availability."

## Communication Style

- Professional and warm — like a trusted hospitality expert
- Owner-focused: explain how management benefits the owner
- Clear and easy to understand — avoid jargon
- Trust-building: be honest about what IPM can and cannot guarantee
- Not too robotic, not too casual — think luxury hospitality

## Lead Guidance

When owners ask about getting started, contacting IPM, or show clear interest in hiring a property manager, guide them to:
- **Email:** info@ipm.services
- **Website:** https://www.ipm.services/contact

## Response Format

- Use clear, readable formatting with bold for key terms
- Use bullet points for lists of services or features
- Keep responses focused and concise — don't overwhelm with information
- End responses with a helpful follow-up suggestion when appropriate`;

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

## Company & Services
${JSON.stringify(kb.ipmInfo, null, 2)}

## Frequently Asked Questions
${JSON.stringify(kb.faq, null, 2)}

## Market Information
${JSON.stringify(kb.markets, null, 2)}
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

  const completion = await createAICompletion({
    mode: "public",
    messages,
  });

  const responseMessage = completion.choices[0]?.message?.content || "I apologize, but I'm having trouble processing your request. Please try again.";

  // Analyze response for lead qualification opportunity
  const shouldPromptLead = detectLeadQualificationOpportunity(message, responseMessage);

  // Generate suggested questions based on context
  const suggestedQuestions = generateSuggestedQuestions(message, responseMessage);

  return {
    message: responseMessage,
    suggestedQuestions,
    leadQualificationPrompt: shouldPromptLead,
  };
}

function detectLeadQualificationOpportunity(userMessage: string, botResponse: string): boolean {
  const leadTriggers = [
    /\b(interested|want|looking|hire|start|sign up|enroll)\b/i,
    /\b(manage|management|managing my property)\b/i,
    /\b(how much|cost|fee|pricing|tier)\b/i,
    /\b(contact|speak|talk|consult|call|email)\b/i,
    /\b(ready|get started|next step|sign)\b/i,
  ];

  const messageContent = userMessage + " " + botResponse;
  const triggerCount = leadTriggers.filter((trigger) => trigger.test(messageContent)).length;

  return triggerCount >= 2;
}

function generateSuggestedQuestions(userMessage: string, botResponse: string): string[] {
  const lower = (userMessage + " " + botResponse).toLowerCase();

  if (lower.includes("reservation") || lower.includes("booking") || lower.includes("airbnb")) {
    return [
      "How does IPM market my property?",
      "What is included in the 20% full-service tier?",
      "How does dynamic pricing work?",
    ];
  }

  if (lower.includes("fee") || lower.includes("tier") || lower.includes("percent") || lower.includes("%")) {
    return [
      "What is included in each management tier?",
      "How do I get started with IPM?",
      "Do you help with cleaning and maintenance?",
    ];
  }

  if (lower.includes("marketing") || lower.includes("listing") || lower.includes("platform")) {
    return [
      "Can IPM manage my Airbnb or Booking.com listing?",
      "How does IPM improve my property's ranking?",
      "What is dynamic pricing and how does it work?",
    ];
  }

  if (lower.includes("guest") || lower.includes("communication") || lower.includes("support")) {
    return [
      "How does IPM handle guest communication?",
      "What reports do property owners receive?",
      "How does the owner portal work?",
    ];
  }

  if (lower.includes("cleaning") || lower.includes("maintenance") || lower.includes("repair")) {
    return [
      "How does IPM coordinate cleaning between stays?",
      "What is included in the 15% management tier?",
      "How do I track my property's performance?",
    ];
  }

  if (lower.includes("report") || lower.includes("portal") || lower.includes("earnings")) {
    return [
      "How does the owner portal work?",
      "How often do I receive owner reports?",
      "Can I see my bookings and revenue in real time?",
    ];
  }

  if (lower.includes("start") || lower.includes("onboard") || lower.includes("get started")) {
    return [
      "What information does IPM need to get started?",
      "How long does onboarding take?",
      "What management tier is right for me?",
    ];
  }

  // Default owner-focused suggestions
  return [
    "What is included in the 10%–20% management tiers?",
    "How does IPM market my property?",
    "Do you help with cleaning and maintenance?",
    "How do I get started with IPM?",
  ];
}
