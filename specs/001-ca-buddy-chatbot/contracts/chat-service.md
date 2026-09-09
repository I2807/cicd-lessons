# ChatService Contract

## Purpose

Provide one provider-independent boundary between the chat UI and an assistant. The UI
can submit questions, supply the current conversation, receive one response, and show
a safe failure without knowing how the response was produced.

## Request

Each accepted submission sends:

- `question`: the trimmed, non-empty current user question.
- `history`: the ordered completed conversation messages before the current question.
  Each item has `role` (`user` or `assistant`) and non-empty plain-text `content`.
- `generation`: the active conversation identity used by the caller to reject stale
  responses. The provider adapter does not persist this value.

The first question in a conversation sends an empty history. A follow-up sends all
prior completed user and assistant messages in order. A request after New chat sends
an empty history and a new generation identity.

## Response

A successful request resolves to one non-empty plain-text assistant response. The
response must be suitable for display without interpreting it as executable markup.
The service does not return a second hidden state or write conversation history.

## Failure

A provider or network failure rejects the request. The UI converts that failure into a
clear, non-technical unavailable message, keeps the question input usable, and does
not fabricate a tax answer. The failure must not expose provider credentials or raw
network diagnostics to the user.

## Production Adapter Rules

The production implementation MUST:

- use `@langchain/google-genai` with model `gemma-4-26b-a4b-it`;
- load the versioned system prompt from `src/ai/caSystemPrompt.ts`;
- include the ordered request history and current question;
- cap output at 1,024 tokens;
- read the credential only from `VITE_GOOGLE_API_KEY`;
- avoid logging the credential, full request headers, or sensitive provider payloads;
- remain a browser-side adapter with no persistence or backend endpoint.

## Test Adapter Rules

The fake service MUST be injectable into the UI and MUST be able to:

- return deterministic responses for supported and boundary questions;
- record request history so follow-up context can be asserted;
- reject on demand to exercise the unavailable state;
- delay a response so New chat can assert that an old response is ignored.

## Behavioral Contract

The UI owns message state and generation checks. The service must not append messages,
clear the UI, or decide whether New chat is enabled. A service response from an older
generation is ignored by the caller even if the promise resolves successfully.
