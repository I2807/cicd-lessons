export type ChatRole = "user" | "assistant";

export interface ChatHistoryMessage { role: ChatRole; content: string; }
export interface ChatMessage extends ChatHistoryMessage { id: string; sequence: number; generation: number; }
export interface ChatRequest { question: string; history: ChatHistoryMessage[]; generation: number; }
export interface ChatService { sendMessage(request: ChatRequest): Promise<string>; }

export const UNAVAILABLE_RESPONSE = "CA Buddy is unavailable right now. Please try again. For important tax decisions, consult a Chartered Accountant.";

export class ChatServiceError extends Error {
  constructor(message = UNAVAILABLE_RESPONSE) { super(message); this.name = "ChatServiceError"; }
}

export function getSafeResponse(value: unknown): string {
  if (typeof value !== "string") throw new ChatServiceError();
  const response = value.trim();
  if (!response) throw new ChatServiceError();
  return response;
}
