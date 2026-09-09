import { describe, expect, it } from "vitest";
import { ChatServiceError, getSafeResponse, unavailableChatService } from "../../src/services/chatService";
import { CA_SYSTEM_PROMPT, CA_SYSTEM_PROMPT_VERSION } from "../../src/ai/caSystemPrompt";
import { MAX_OUTPUT_TOKENS, MODEL_NAME, normalizeModelResponse } from "../../src/services/geminiChatService";
import { FAKE_SCENARIO_RESPONSES, FakeChatService } from "../support/fakeChatService";

describe("ChatService contract", () => {
  it("records the normalized request shape in the fake service", async () => {
    const service = new FakeChatService({ defaultResponse: "Answer" });
    const response = await service.sendMessage({ question: "A question", history: [{ role: "user", content: "Earlier question" }], generation: 3 });
    expect(response).toBe("Answer");
    expect(service.requests).toEqual([{ question: "A question", history: [{ role: "user", content: "Earlier question" }], generation: 3 }]);
  });
  it("provides deterministic supported-topic and boundary fixtures", async () => {
    const service = new FakeChatService({ responsesByQuestion: FAKE_SCENARIO_RESPONSES });
    await expect(service.sendMessage({ question: "What is a GST return?", history: [], generation: 0 })).resolves.toContain("summarizes taxable sales");
    await expect(service.sendMessage({ question: "Calculate my tax from my private records.", history: [], generation: 0 })).resolves.toContain("consult a Chartered Accountant");
  });
  it("rejects through the safe unavailable service", async () => {
    await expect(unavailableChatService.sendMessage({ question: "Question", history: [], generation: 0 })).rejects.toBeInstanceOf(ChatServiceError);
  });
  it("accepts only non-empty string responses", () => {
    expect(getSafeResponse("  Answer  ")).toBe("Answer");
    expect(() => getSafeResponse("   ")).toThrow(ChatServiceError);
    expect(() => getSafeResponse(null)).toThrow(ChatServiceError);
  });
  it("normalizes text content blocks without exposing empty output", () => {
    expect(normalizeModelResponse([{ type: "text", text: " First " }, { type: "text", text: "answer. " }])).toBe("First answer.");
    expect(() => normalizeModelResponse([])).toThrow(ChatServiceError);
    expect(() => normalizeModelResponse({ text: "not a message" })).toThrow(ChatServiceError);
  });
  it("keeps the model and prompt safety contract explicit", () => {
    expect(MODEL_NAME).toBe("gemma-4-26b-a4b-it");
    expect(MAX_OUTPUT_TOKENS).toBe(1024);
    expect(CA_SYSTEM_PROMPT_VERSION).toBe("ca-buddy-v1");
    expect(CA_SYSTEM_PROMPT).toContain("GST");
    expect(CA_SYSTEM_PROMPT).toContain("consult a Chartered Accountant");
    expect(CA_SYSTEM_PROMPT).toContain("general information, not professional advice");
  });
});
