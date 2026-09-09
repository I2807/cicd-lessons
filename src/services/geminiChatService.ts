import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { CA_SYSTEM_PROMPT } from "../ai/caSystemPrompt";
import { ChatServiceError, getSafeResponse, unavailableChatService, type ChatService } from "./chatService";
import type { ChatRequest } from "../types/chat";

const MODEL_NAME = "gemma-4-26b-a4b-it";
const MAX_OUTPUT_TOKENS = 1024;

interface TextContentBlock { type: "text"; text: string; }

export function normalizeModelResponse(content: unknown): string {
  if (typeof content === "string") return getSafeResponse(content);
  if (Array.isArray(content)) {
    const text = content.filter((block): block is TextContentBlock => typeof block === "object" && block !== null && "type" in block && block.type === "text" && "text" in block && typeof block.text === "string").map((block) => block.text).join("");
    return getSafeResponse(text);
  }
  throw new ChatServiceError();
}

export function createGeminiChatService(): ChatService {
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY?.trim() || (import.meta.env.MODE === "e2e" ? globalThis.crypto.randomUUID() : undefined);
  if (!apiKey) return unavailableChatService;
  const model = new ChatGoogleGenerativeAI({ apiKey, model: MODEL_NAME, maxOutputTokens: MAX_OUTPUT_TOKENS });
  return {
    async sendMessage(request: ChatRequest): Promise<string> {
      const promptMessages = [new SystemMessage(CA_SYSTEM_PROMPT), ...request.history.map((message) => message.role === "user" ? new HumanMessage(message.content) : new AIMessage(message.content)), new HumanMessage(request.question)];
      const response = await model.invoke(promptMessages);
      return normalizeModelResponse(response.content);
    },
  };
}

export { MAX_OUTPUT_TOKENS, MODEL_NAME };
