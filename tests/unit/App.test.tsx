import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { App } from "../../src/App";
import { FakeChatService } from "../support/fakeChatService";

function renderApp(service = new FakeChatService()) { return render(<App chatService={service} />); }

describe("CA Buddy shell and first answer", () => {
  it("renders the required single-screen regions and disclaimer", () => {
    renderApp();
    expect(screen.getByRole("heading", { name: "CA Buddy" })).toBeVisible();
    expect(screen.getByRole("log", { name: /chat conversation/i })).toBeVisible();
    expect(screen.getByLabelText(/ask a tax question/i)).toBeVisible();
    expect(screen.getByRole("button", { name: /send question/i })).toBeVisible();
    expect(screen.getByRole("button", { name: "New chat" })).toBeVisible();
    expect(screen.getByText(/general information, not professional advice/i)).toBeVisible();
  });
  it("submits a trimmed question and renders the assistant response", async () => {
    const user = userEvent.setup();
    const service = new FakeChatService({ defaultResponse: "GST returns are usually due on a recurring monthly or quarterly date." });
    renderApp(service);
    const input = screen.getByLabelText(/ask a tax question/i);
    await user.type(input, "  When is my GST return due?  ");
    await user.click(screen.getByRole("button", { name: /send question/i }));
    expect(screen.getByText("When is my GST return due?")).toBeVisible();
    expect(await screen.findByText("GST returns are usually due on a recurring monthly or quarterly date.")).toBeVisible();
    expect(service.requests).toHaveLength(1);
    expect(service.requests[0].question).toBe("When is my GST return due?");
    expect(service.requests[0].history).toEqual([]);
  });
  it("submits the question when Enter is pressed", async () => {
    const user = userEvent.setup();
    const service = new FakeChatService({ defaultResponse: "TDS answer" });
    renderApp(service);
    await user.type(screen.getByLabelText(/ask a tax question/i), "What is TDS?{Enter}");
    expect(await screen.findByText("TDS answer")).toBeVisible();
    expect(service.requests[0].question).toBe("What is TDS?");
  });
  it("does not create a message for a whitespace-only question", async () => {
    const user = userEvent.setup();
    const service = new FakeChatService();
    renderApp(service);
    await user.type(screen.getByLabelText(/ask a tax question/i), "   ");
    await user.click(screen.getByRole("button", { name: /send question/i }));
    expect(service.requests).toHaveLength(0);
    expect(screen.getByRole("log", { name: /chat conversation/i })).toHaveTextContent(/your questions and practical answers will appear here/i);
  });
});

describe("CA Buddy conversation state", () => {
  it("sends completed conversation history with a follow-up question", async () => {
    const user = userEvent.setup();
    const service = new FakeChatService({ responder: (_request, callIndex) => `Answer ${callIndex + 1}` });
    renderApp(service);
    const input = screen.getByLabelText(/ask a tax question/i);
    await user.type(input, "When is GST due?");
    await user.click(screen.getByRole("button", { name: /send question/i }));
    expect(await screen.findByText("Answer 1")).toBeVisible();
    await user.type(input, "What about the next month?");
    await user.click(screen.getByRole("button", { name: /send question/i }));
    expect(await screen.findByText("Answer 2")).toBeVisible();
    expect(service.requests[1].history).toEqual([{ role: "user", content: "When is GST due?" }, { role: "assistant", content: "Answer 1" }]);
  });
  it("clears visible messages and starts the next request with empty history", async () => {
    const user = userEvent.setup();
    const service = new FakeChatService({ defaultResponse: "First answer" });
    renderApp(service);
    const input = screen.getByLabelText(/ask a tax question/i);
    await user.type(input, "First question");
    await user.click(screen.getByRole("button", { name: /send question/i }));
    expect(await screen.findByText("First answer")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "New chat" }));
    expect(screen.queryByText("First question")).not.toBeInTheDocument();
    expect(screen.getByText(/your questions and practical answers will appear here/i)).toBeVisible();
    await user.type(input, "Fresh question");
    await user.click(screen.getByRole("button", { name: /send question/i }));
    expect(await screen.findByText("First answer")).toBeVisible();
    expect(service.requests[1].history).toEqual([]);
  });
  it("ignores a response that resolves after New chat", async () => {
    const user = userEvent.setup();
    let resolveOldResponse!: (response: string) => void;
    const oldResponse = new Promise<string>((resolve) => { resolveOldResponse = resolve; });
    const service = new FakeChatService({ responder: (_request, callIndex) => callIndex === 0 ? oldResponse : "Fresh answer" });
    renderApp(service);
    const input = screen.getByLabelText(/ask a tax question/i);
    await user.type(input, "Old question");
    await user.click(screen.getByRole("button", { name: /send question/i }));
    expect(await screen.findByText("Old question")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "New chat" }));
    await user.type(input, "Fresh question");
    await user.click(screen.getByRole("button", { name: /send question/i }));
    expect(await screen.findByText("Fresh answer")).toBeVisible();
    resolveOldResponse("Old answer");
    await waitFor(() => { expect(screen.queryByText("Old answer")).not.toBeInTheDocument(); });
  });
});

describe("CA Buddy safety and disclosure", () => {
  it("keeps the disclaimer visible for a supported-topic answer", async () => {
    const user = userEvent.setup();
    const service = new FakeChatService({ defaultResponse: "For general GST information, check the return period and applicable due date." });
    renderApp(service);
    await user.type(screen.getByLabelText(/ask a tax question/i), "What is a GST return?");
    await user.click(screen.getByRole("button", { name: /send question/i }));
    expect(await screen.findByText("For general GST information, check the return period and applicable due date.")).toBeVisible();
    expect(screen.getByText(/general information, not professional advice/i)).toBeVisible();
  });
  it("shows the consult-a-CA boundary response for individualized advice", async () => {
    const user = userEvent.setup();
    const service = new FakeChatService({ defaultResponse: "I cannot provide individualized tax advice. Please consult a Chartered Accountant." });
    renderApp(service);
    await user.type(screen.getByLabelText(/ask a tax question/i), "Calculate my tax from my private records.");
    await user.click(screen.getByRole("button", { name: /send question/i }));
    const assistantMessage = await screen.findByRole("article", { name: "Assistant message" });
    expect(within(assistantMessage).getByText(/consult a Chartered Accountant/i)).toBeVisible();
  });
  it("shows a safe unavailable response and keeps the input usable", async () => {
    const user = userEvent.setup();
    const service = new FakeChatService({ rejectWith: new Error("private provider response") });
    renderApp(service);
    const input = screen.getByLabelText(/ask a tax question/i);
    await user.type(input, "When is my GST return due?");
    await user.click(screen.getByRole("button", { name: /send question/i }));
    expect(await screen.findByText(/CA Buddy is unavailable right now/i)).toBeVisible();
    expect(screen.queryByText(/private provider response/i)).not.toBeInTheDocument();
    expect(input).toBeEnabled();
  });
  it("renders provider text literally instead of interpreting markup", async () => {
    const user = userEvent.setup();
    const service = new FakeChatService({ defaultResponse: '<script>alert("not code")</script>' });
    renderApp(service);
    await user.type(screen.getByLabelText(/ask a tax question/i), "What is audit basics?");
    await user.click(screen.getByRole("button", { name: /send question/i }));
    expect(await screen.findByText('<script>alert("not code")</script>')).toBeVisible();
    expect(screen.queryByRole("script")).not.toBeInTheDocument();
  });
});
