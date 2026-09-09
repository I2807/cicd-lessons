# Feature Specification: CA Buddy Tax Guidance Chatbot

**Feature Branch**: `001-ca-buddy-chatbot`

**Created**: 2026-09-09

**Status**: Draft

**Input**: User description: "Create CA Buddy, a single-screen chatbot that gives small-business owners a clear starting point for everyday Indian tax and audit questions."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Get a practical tax answer (Priority: P1)

An Indian small-business owner opens CA Buddy, sees what the service can and cannot
provide, asks an everyday question such as "When is my GST return due?", and receives
an understandable answer without leaving the screen.

**Why this priority**: A useful first answer is the core value of CA Buddy and the
smallest complete experience for the target user.

**Independent Test**: Load the app, confirm the essential controls and disclaimer are
visible, submit one everyday tax question, and verify that both the question and a
practical answer appear in the chat.

**Acceptance Scenarios**:

1. **Given** a first visit with no existing conversation, **When** the user loads CA
   Buddy, **Then** the header, chat panel, question input, New chat control, and
   general-information disclaimer are visible on one screen.
2. **Given** the question input is empty, **When** the user enters a non-empty everyday
   GST, TDS, ITR-deadline, or audit-basics question and submits it, **Then** the
   question appears in the chat and a clear assistant answer appears without a page
   reload.
3. **Given** the question input contains only spaces, **When** the user submits with
   the submit control or Enter, **Then** no new chat message is created and the input
   remains available.

---

### User Story 2 - Continue or reset a conversation (Priority: P2)

A user asks a follow-up question about the same tax situation and receives an answer
that understands the earlier exchange. When the user selects New chat, the visible
conversation disappears and the next question starts without the earlier context.

**Why this priority**: Follow-up context makes the short interaction useful, while a
predictable reset lets users safely change topics or start over.

**Independent Test**: Submit an initial question, submit a follow-up that refers to
it, verify the follow-up is answered in context, select New chat, and verify that both
the visible messages and conversation context are cleared.

**Acceptance Scenarios**:

1. **Given** the chat contains an earlier question and answer, **When** the user asks
   a follow-up about that exchange, **Then** the assistant response uses the earlier
   conversation rather than treating the follow-up as unrelated text.
2. **Given** the chat contains messages, **When** the user selects New chat, **Then**
   all visible messages are removed and the next question is processed as the first
   question in a new conversation.
3. **Given** an answer is still pending, **When** the user selects New chat, **Then**
   the cleared chat does not receive a late answer from the previous conversation.

---

### User Story 3 - Recognize professional boundaries (Priority: P3)

A user can ask for general information about supported tax and audit topics, while
requests that require individualized records, professional judgment, or unrelated
expertise receive a clear limitation and a recommendation to consult a Chartered
Accountant.

**Why this priority**: Clear boundaries reduce the risk that a quick informational
answer is mistaken for personalized professional advice.

**Independent Test**: Submit one supported everyday question and one individualized
or out-of-scope question, then verify that the responses differ appropriately and the
disclaimer remains visible throughout.

**Acceptance Scenarios**:

1. **Given** the user asks about GST, TDS, ITR deadlines, or audit basics in general
   terms, **When** the question is submitted, **Then** the response is practical,
   plain-language information for a small-business owner.
2. **Given** the user asks for individualized tax advice, a calculation requiring
   private records, filing work, or an unrelated high-stakes decision, **When** the
   question is submitted, **Then** the response states the service's limit and tells
   the user to consult a Chartered Accountant.
3. **Given** the user has an active conversation, **When** the user reads the chat,
   **Then** the general-information disclaimer remains visible on the screen.

### Edge Cases

- Submitting an empty or whitespace-only question does not create a user message.
- A question that mixes a supported topic with a request for individualized judgment
  receives the professional-boundary response for the individualized part.
- If the assistant is unavailable or fails to respond, the user sees a clear,
  non-technical unavailable message, the input remains usable, and no invented tax
  answer is shown.
- Starting a New chat while an answer is pending must not allow the old answer to
  appear in the cleared conversation.
- Refreshing the page starts a new conversation; prior messages are not restored.
- Very long or unusually worded questions remain readable in the chat and do not hide
  the input, New chat control, or disclaimer.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The product MUST render a single screen containing a recognizable
  header, chat panel, question input, New chat control, and one-line disclaimer.
- **FR-002**: The product MUST accept a non-empty question through an explicit submit
  action and through Enter in the question input.
- **FR-003**: The product MUST ignore empty or whitespace-only submissions without
  adding a user message to the chat.
- **FR-004**: The product MUST display each accepted user question in the chat and
  display the corresponding assistant response without requiring a page reload.
- **FR-005**: The assistant MUST provide clear, practical, general-information
  responses for everyday GST, TDS, ITR-deadline, and audit-basics questions.
- **FR-006**: For individualized, record-dependent, high-stakes, or out-of-scope
  requests, the assistant MUST state its limitation and direct the user to consult a
  Chartered Accountant.
- **FR-007**: The product MUST keep a one-line disclaimer visible that identifies CA
  Buddy as general information and not professional advice.
- **FR-008**: The product MUST include the current conversation when answering a
  follow-up question within that conversation.
- **FR-009**: New chat MUST remove all displayed messages and clear the conversation
  context so subsequent questions start fresh.
- **FR-010**: The product MUST NOT require an account or retain conversation history
  after New chat or a page refresh.
- **FR-011**: If an answer cannot be produced, the product MUST show a clear
  unavailable message, keep the question input usable, and avoid presenting an
  unverified tax answer as fact.

### Key Entities *(include if feature involves data)*

- **Current conversation**: The ordered questions and answers in the active browser
  session; it exists only for the current conversation and is cleared by New chat or
  page refresh.
- **User question**: A non-empty piece of text submitted by the small-business owner,
  including its position in the current conversation.
- **Assistant response**: A practical general-information answer, a professional-
  boundary response, or a clear unavailable message associated with a user question.

## Success Criteria *(mandatory)

### Measurable Outcomes

- **SC-001**: A first-time evaluator can complete the happy path of asking a GST
  question, asking one follow-up, and starting a New chat in under three minutes.
- **SC-002**: In acceptance tests, 100% of valid submissions show the submitted
  question and one corresponding response without a page reload.
- **SC-003**: In acceptance tests, 100% of empty or whitespace-only submissions leave
  the chat unchanged.
- **SC-004**: In acceptance tests, 100% of follow-up questions use the earlier
  conversation, and 100% of conversations started after New chat exclude prior
  messages and context.
- **SC-005**: In acceptance tests, 100% of individualized or out-of-scope requests
  produce both a clear limitation and a recommendation to consult a Chartered
  Accountant.
- **SC-006**: The disclaimer is visible on the initial screen and remains visible in
  100% of tested active-conversation states.
- **SC-007**: In a review by five representative stakeholders, at least four judge a
  typical supported-topic answer clear enough to serve as a starting point before
  seeking professional advice.

## Assumptions

- The first release uses English for the interface and assistant responses; additional
  languages are outside this feature's scope.
- Users have an internet connection and a modern browser capable of displaying the
  single-screen chat experience.
- One browser tab has one active conversation, and conversation content is not saved
  for later retrieval.
- Tax rules and deadlines can change, so answers are general starting information and
  users with consequential decisions are expected to verify details with a
  Chartered Accountant.
- A clear unavailable message is sufficient for transient service failures; retry,
  escalation, and diagnostics are outside this feature's user-facing scope.
- The product does not perform tax filing, maintain user records, or provide
  personalized legal or financial advice.
