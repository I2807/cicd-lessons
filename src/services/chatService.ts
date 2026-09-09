import {
  ChatServiceError,
  getSafeResponse,
  type ChatRequest,
  type ChatService,
} from "../types/chat";

export { ChatServiceError };
export { getSafeResponse };
export type { ChatRequest, ChatService };

export const unavailableChatService: ChatService = {
  async sendMessage(): Promise<string> {
    throw new ChatServiceError();
  },
};
