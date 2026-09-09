import type { ChatRequest, ChatService } from "../../src/types/chat";

export type FakeResponder = (
  request: ChatRequest,
  callIndex: number,
) => string | Promise<string>;

export interface FakeChatServiceOptions {
  defaultResponse?: string;
  rejectWith?: Error;
  responder?: FakeResponder;
  responsesByQuestion?: Record<string, string>;
}

export const FAKE_SCENARIO_RESPONSES = {
  "What is a GST return?":
    "A GST return summarizes taxable sales, purchases, and tax due for a filing period.",
  "Calculate my tax from my private records.":
    "I cannot provide individualized tax advice. Please consult a Chartered Accountant.",
} as const;

export class FakeChatService implements ChatService {
  readonly requests: ChatRequest[] = [];

  private readonly defaultResponse: string;
  private readonly rejectWith?: Error;
  private readonly responder?: FakeResponder;
  private readonly responsesByQuestion: Record<string, string>;

  constructor(options: FakeChatServiceOptions = {}) {
    this.defaultResponse =
      options.defaultResponse ?? "The fake CA service returned a practical answer.";
    this.rejectWith = options.rejectWith;
    this.responder = options.responder;
    this.responsesByQuestion = options.responsesByQuestion ?? {};
  }

  async sendMessage(request: ChatRequest): Promise<string> {
    const recordedRequest: ChatRequest = {
      ...request,
      history: request.history.map((message) => ({ ...message })),
    };
    this.requests.push(recordedRequest);

    if (this.rejectWith) throw this.rejectWith;
    if (this.responder) return this.responder(recordedRequest, this.requests.length - 1);
    const questionResponse = this.responsesByQuestion[recordedRequest.question];
    if (questionResponse) return questionResponse;
    return this.defaultResponse;
  }
}
