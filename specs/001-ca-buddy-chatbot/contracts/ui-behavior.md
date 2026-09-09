# UI Behavior Contract

## Required Regions and Accessible Names

The single screen exposes stable, user-facing landmarks:

| Region | Required behavior |
|---|---|
| Header | Identifies the product as `CA Buddy`. |
| Chat panel | Exposes a labeled conversation region and renders user questions and assistant responses in chronological order. |
| Question input | Has an accessible label that tells the user to ask a tax question, accepts text, and remains usable after success or failure. |
| Submit control | Has a clear accessible name and submits the current non-empty question. Enter in the input submits the same way. |
| New chat control | Has the accessible name `New chat`, clears visible messages immediately, and starts a fresh conversation generation. |
| Disclaimer | Remains visible on the screen and states that CA Buddy provides general information, not professional advice. |

The implementation may use semantic roles, labels, or stable test identifiers, but unit
and end-to-end tests must locate these regions through stable user-facing semantics.

## Submission Behavior

1. Trim the input before validation.
2. Ignore an empty or whitespace-only value without adding a chat item.
3. Add the accepted question to the chat before awaiting the response.
4. Show exactly one corresponding assistant response for a successful request.
5. Keep the input available after a response or an unavailable error.
6. Render response content as plain text and keep long text within the chat layout.

## Context and Reset Behavior

- A follow-up request includes all completed messages from the current conversation.
- New chat removes every visible message and pending indicator, increments the
  conversation generation, and leaves the input and disclaimer available.
- A response belonging to a prior generation must not appear after New chat.
- The disclaimer remains visible before, during, and after an active conversation.

## Safety Behavior

- Supported general questions receive concise, practical information for GST, TDS, ITR
  deadlines, or audit basics.
- Individualized, record-dependent, high-stakes, or out-of-scope questions receive a
  limitation statement and a direction to consult a Chartered Accountant.
- The UI does not claim that CA Buddy replaces a Chartered Accountant or provides
  personalized legal or financial advice.

## Error Behavior

When the service fails, the chat shows a clear unavailable message rather than a
plausible invented answer. The input and controls remain usable so the user can try a
new question or start a new chat.
