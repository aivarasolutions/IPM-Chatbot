import OpenAI from "openai";

// One provider/client/model for all IPM AI modes. Prompts and permissions stay mode-specific.
export const AI_MODEL = "gpt-4o-mini";
const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  timeout: 60000,
  maxRetries: 1,
});

export async function createAICompletion(options: {
  mode: "public" | "staff";
  messages: OpenAI.Chat.ChatCompletionMessageParam[];
  responseFormat?: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming["response_format"];
}) {
  return openai.chat.completions.create({
    model: AI_MODEL,
    messages: options.messages,
    temperature: options.mode === "public" ? 0.7 : 0.4,
    max_tokens: options.mode === "public" ? 1000 : 1600,
    ...(options.responseFormat ? { response_format: options.responseFormat } : {}),
  });
}
