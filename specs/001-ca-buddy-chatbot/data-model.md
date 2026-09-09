# Data Model: CA Buddy Tax Guidance Chatbot

## Current Conversation

Represents the one active browser conversation. It is held in memory for the current
page lifetime and is never written to a database, local storage, cookies, or a remote
history service.

| Field | Type | Rules |
|---|---|---|
| `generation` | integer | Starts at `0`; increments whenever New chat is selected; identifies the active conversation instance. |
| `messages` | ordered list of Message | Preserves accepted user questions and assistant responses in display and request order. |
| `pendingRequest` | optional request identity | At most one visible pending submission is tracked by the UI; its generation must match before its response can be rendered. |
| `status` | `idle`, `pending`, or `error` | Returns to `idle` after a response or user-visible failure; New chat returns it to `idle`. |

### Conversation State Transitions

```text
idle --valid question--> pending
pending --matching response--> idle
pending --service failure--> error
error --new valid question--> pending
idle|pending|error --New chat--> idle with empty messages and generation + 1
pending --late response from old generation--> ignored
```

## Message

Represents a visible exchange item and the corresponding context item sent to the
assistant.

| Field | Type | Rules |
|---|---|---|
| `id` | unique string | Generated for the current page session; used for rendering and request correlation. |
| `role` | `user` or `assistant` | User items are submitted questions; assistant items are answers, safety fallbacks, or unavailable messages. |
| `content` | string | Must be non-empty after trimming. Display text is plain text and must not be interpreted as executable markup. |
| `sequence` | integer | Monotonically increases within a conversation and preserves chronological order. |
| `generation` | integer | Matches the conversation generation that created the message. |

## User Question

A submitted question is normalized by trimming leading and trailing whitespace before
validation and service dispatch. A whitespace-only value is rejected and does not
create a Message. The normalized question remains associated with the active
conversation generation.

## Assistant Response

A response is associated with the submitted question and has one of three semantic
outcomes:

- **General information**: clear, practical information about GST, TDS, ITR deadlines,
  or audit basics.
- **Professional boundary**: a limit statement and direction to consult a Chartered
  Accountant for individualized, record-dependent, high-stakes, or out-of-scope
  requests.
- **Unavailable**: a clear non-technical failure message that does not invent a tax
  answer and leaves the input usable.

## Retention and Reset Rules

- No entity is persisted across page refresh, browser tabs, or New chat.
- New chat clears all messages, removes pending visible state, increments `generation`,
  and makes the next accepted question use an empty history.
- A response may be rendered only when its request generation equals the current
  conversation generation. This prevents a previous conversation from repopulating a
  cleared chat.
