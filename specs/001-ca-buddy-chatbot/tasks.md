---

description: "Task list for CA Buddy Tax Guidance Chatbot"
---

# Tasks: CA Buddy Tax Guidance Chatbot

**Input**: Design documents from `/specs/001-ca-buddy-chatbot/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/](contracts/), and [quickstart.md](quickstart.md)

**Tests**: Included because the specification and constitution explicitly require unit,
end-to-end, and build validation.

**Organization**: Detailed checklist tasks are grouped by user story. The five
Delivery Task groups below are the exact issue and pull-request sequence required by
the product brief; each group contains the implementation subtasks listed in the
phases that follow.

## Five Delivery Tasks

| Delivery task | Required issue/PR scope | Checklist task groups |
|---|---|---|
| 1 | Chat UI shell, unit tests, and initial CI workflow | Setup, Foundational, User Story 1 |
| 2 | ChatService interface, LangChain + Gemini implementation, and fake service | Foundational service seam, User Story 2 provider work |
| 3 | CA persona, scope rules, consult-a-CA fallback, disclaimer, and conversation memory | User Story 2 state work, User Story 3 |
| 4 | Playwright end-to-end tests with Gemini request interception, wired into CI | End-to-End Validation |
| 5 | GitHub Pages deployment gated on all validation jobs | Deployment and Polish |

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the React/Vite project and safe local configuration required by
all five delivery tasks.

- [X] T001 Initialize `package.json` and `package-lock.json` with React, TypeScript, Vite, `@langchain/google-genai`, Vitest, Testing Library, and Playwright dependencies plus `dev`, `build`, `test:unit`, and `test:e2e` scripts
- [X] T002 [P] Create the Vite and TypeScript entry configuration in `index.html`, `tsconfig.json`, `vite.config.ts`, and `src/vite-env.d.ts`
- [X] T003 [P] Add credential and generated-artifact protection in `.gitignore` and document the required `VITE_GOOGLE_API_KEY` placeholder in `.env.example`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create the shared contracts and deterministic test seam that every user
story depends on.

**CRITICAL**: No user story work can begin until this phase is complete.

- [X] T004 Configure Vitest with a browser-like DOM, Testing Library setup, and test cleanup in `vite.config.ts` and `tests/setup.ts`
- [X] T005 Define `ChatMessage`, conversation history, `ChatRequest`, `ChatService`, and a safe unavailable-service fallback in `src/types/chat.ts` and `src/services/chatService.ts`
- [X] T006 Create an injectable deterministic fake service that records ordered history, supports delayed responses, and can reject on demand in `tests/support/fakeChatService.ts`

**Checkpoint**: The project installs, the unit-test environment starts, and UI code can
use a provider-independent service without a live credential.

---

## Phase 3: User Story 1 - Get a practical tax answer (Priority: P1) 🎯 MVP

**Goal**: Deliver the single-screen CA Buddy shell where a user can submit a non-empty
question or Enter keypress, see the question immediately, and receive a corresponding
assistant response through an injected service.

**Independent Test**: Run the User Story 1 unit suite with the fake service. It must
locate the header, chat panel, question input, submit control, New chat control, and
disclaimer; accept a valid question through the control and Enter; reject whitespace;
and render the fake response without a page reload.

### Tests for User Story 1

- [X] T007 [US1] Write failing behavior tests for initial landmarks, disclaimer, valid control submission, Enter submission, whitespace rejection, and assistant rendering in `tests/unit/App.test.tsx`

### Implementation for User Story 1

- [X] T008 [P] [US1] Create the labeled chat panel, message list, question input, submit control, New chat control, and disclaimer markup in `src/components/ChatPanel.tsx`
- [X] T009 [US1] Implement the initial App state, input trimming, non-empty submission, service invocation, and response rendering with injectable `ChatService` in `src/App.tsx`
- [X] T010 [US1] Wire the browser entry point and responsive single-screen styling in `src/main.tsx` and `src/styles.css`
- [X] T011 [US1] Add the initial GitHub Actions validation workflow for Node 22 installation, dependency installation, `npm run test:unit`, and `npm run build` in `.github/workflows/ci.yml`

**Checkpoint**: User Story 1 is independently testable as the MVP through the unit
suite and produces the required single-screen shell and submission behavior.

---

## Phase 4: User Story 2 - Continue or reset a conversation (Priority: P2)

**Goal**: Preserve ordered conversation context for follow-up questions and guarantee
that New chat clears visible state and prevents delayed responses from an older
conversation from returning.

**Independent Test**: Extend the unit suite with an initial question, a context-aware
follow-up, New chat, a fresh question with empty history, and a delayed old response.
The old response must never appear after reset.

### Tests for User Story 2

- [X] T012 [US2] Write failing context, New chat, delayed-response, and service-request tests in `tests/unit/App.test.tsx` and `tests/unit/services.test.ts`

### Implementation for User Story 2

- [X] T013 [US2] Add ordered message state, conversation generation tracking, pending/error state, and stale-response rejection to `src/App.tsx`
- [X] T014 [US2] Render pending and unavailable states while keeping input, New chat, and disclaimer usable in `src/components/ChatPanel.tsx`
- [X] T015 [US2] Create the versioned baseline system-prompt export required by the provider seam in `src/ai/caSystemPrompt.ts`
- [X] T016 [US2] Implement and wire the browser Gemini adapter with `gemma-4-26b-a4b-it`, ordered history, `maxOutputTokens: 1024`, and `VITE_GOOGLE_API_KEY` access in `src/services/geminiChatService.ts` and `src/main.tsx`

**Checkpoint**: User Stories 1 and 2 both work independently; follow-ups carry only
current-generation history, New chat resets immediately, and the production adapter is
isolated behind `ChatService`.

---

## Phase 5: User Story 3 - Recognize professional boundaries (Priority: P3)

**Goal**: Make supported-topic answers practical and make individualized, high-stakes,
record-dependent, or out-of-scope requests produce a clear limitation and consult-a-CA
fallback while the disclaimer remains visible.

**Independent Test**: Use deterministic fake responses and the prompt/adapter tests to
verify a supported GST/TDS/ITR/audit question, an individualized question, a service
failure, and persistent disclaimer visibility.

### Tests for User Story 3

- [X] T017 [US3] Write failing safety and disclosure tests for supported topics, consult-a-CA fallback, unavailable responses, plain-text rendering, and persistent disclaimer in `tests/unit/App.test.tsx` and `tests/unit/services.test.ts`

### Implementation for User Story 3

- [X] T018 [US3] Replace the baseline prompt with the versioned CA persona, supported-topic scope, professional-boundary rules, disclaimer language, context rules, and concise-answer guidance in `src/ai/caSystemPrompt.ts`
- [X] T019 [US3] Normalize provider output and failures into non-empty plain-text answers or a safe unavailable error without logging credentials or raw provider payloads in `src/services/geminiChatService.ts`
- [X] T020 [US3] Finalize visible disclaimer copy, accessible labels, safe error presentation, and long-message layout behavior in `src/App.tsx`, `src/components/ChatPanel.tsx`, and `src/styles.css`
- [X] T021 [US3] Extend the deterministic fake to return supported-topic, boundary, and failure fixtures for repeatable unit coverage in `tests/support/fakeChatService.ts`

**Checkpoint**: All three user stories are independently testable, safety boundaries are
visible and enforced by the prompt contract, and no response is presented as
personalized professional advice.

---

## Phase 6: End-to-End Validation (Delivery Task 4)

**Purpose**: Prove the built browser workflow with Playwright while intercepting the
Gemini request, then make the E2E gate run in CI without a live API key.

- [X] T022 Configure Playwright's web server, Chromium project, base URL, and deterministic test commands in `playwright.config.ts` and `package.json`
- [X] T023 [P] Add the initial intercepted-request happy-path and single-screen checks in `tests/e2e/chat.spec.ts`
- [X] T024 Extend `tests/e2e/chat.spec.ts` with follow-up context, individualized-question fallback, New chat reset, pending-response invalidation, and refresh/no-history scenarios
- [X] T025 Add Playwright browser installation, production preview startup, intercepted-request execution, and artifact retention to `.github/workflows/ci.yml`

**Checkpoint**: Unit tests, build, and intercepted Playwright tests all pass without a
live Gemini credential.

---

## Phase 7: Polish & Cross-Cutting Concerns (Delivery Task 5)

**Purpose**: Gate GitHub Pages deployment on every validation job and perform the final
security, documentation, and acceptance walkthrough.

- [X] T026 Create the reusable GitHub Pages deployment workflow with artifact download, `pages: write` and `id-token: write` permissions, the `github-pages` environment, and `actions/deploy-pages` in `.github/workflows/deploy.yml`
- [X] T027 Connect the deployment workflow from `.github/workflows/ci.yml` so it runs only after unit tests, Playwright tests, and the production build pass on the production branch
- [X] T028 Run every scenario in `specs/001-ca-buddy-chatbot/quickstart.md`, audit `.gitignore`, `.env.example`, `.github/workflows/ci.yml`, and `.github/workflows/deploy.yml` for credential exposure, and record any final command or acceptance corrections in `specs/001-ca-buddy-chatbot/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; T001, T002, and T003 can start in parallel where their files do not overlap.
- **Foundational (Phase 2)**: Depends on Setup; T004, T005, and T006 block all user-story work.
- **User Story 1 (Phase 3)**: Depends on Foundational; this is the MVP and first delivery checkpoint.
- **User Story 2 (Phase 4)**: Depends on User Story 1 because it extends the App and chat panel state while preserving the shell.
- **User Story 3 (Phase 5)**: Depends on User Story 2 because the final prompt and safety presentation use the production adapter and conversation state.
- **End-to-End Validation (Phase 6)**: Depends on all three user stories and their buildable browser integration.
- **Polish and Deployment (Phase 7)**: Depends on every validation job and the completed quickstart walkthrough.

### User Story Dependencies

- **User Story 1 (P1)**: Starts after Foundational. It has no dependency on another user story and is the suggested MVP.
- **User Story 2 (P2)**: Starts after User Story 1 because context and reset extend the initial submission state; it must preserve all US1 tests.
- **User Story 3 (P3)**: Starts after User Story 2 because its persona and safety rules operate through the production adapter and conversation context; it must preserve US1 and US2 tests.

### Five Delivery Task Order

1. **Delivery Task 1**: Complete Setup, Foundational, and User Story 1, then merge one issue/PR containing the UI shell, unit tests, and initial CI.
2. **Delivery Task 2**: Complete the provider-independent interface seam and User Story 2 provider integration, then merge one issue/PR containing the LangChain/Gemini adapter and deterministic fake support.
3. **Delivery Task 3**: Complete User Story 3 and merge one issue/PR containing the CA prompt, safety fallback, disclaimer, and conversation-memory behavior.
4. **Delivery Task 4**: Complete End-to-End Validation and merge one issue/PR containing intercepted Playwright coverage and its CI gate.
5. **Delivery Task 5**: Complete deployment polish and merge one issue/PR containing the gated GitHub Pages workflow.

### Within Each User Story

- Tests are written before the implementation tasks and must fail for the missing behavior first.
- Shared types and service contracts precede consumers.
- UI state precedes provider integration, and provider integration precedes final persona tuning.
- Core implementation precedes end-to-end integration.
- A story is complete only when its independent test criteria pass and all earlier story tests remain green.

### Parallel Opportunities

- **Setup**: T002 and T003 can run in parallel with separate files after T001's package decisions are agreed.
- **Foundational**: T004 and T005 can be prepared in parallel; T006 follows the shared `ChatService` types.
- **User Story 1**: T008 can be developed separately from the initial test authoring in T007; App integration T009 follows both.
- **User Story 2**: Tests in T012 can be authored while the service adapter design is reviewed, but implementation tasks must follow the failing tests.
- **User Story 3**: Prompt review and fake-fixture preparation can proceed in parallel after T017 defines the assertions, provided edits to the same files are serialized.
- **End-to-End Validation**: T022 and T023 can be prepared in parallel only when package scripts and test file ownership do not conflict; T024 follows the initial E2E harness.
- **Delivery Task 5**: T026 can be authored separately from the final quickstart/security audit T028; T027 must connect the completed reusable workflow.

---

## Parallel Example: User Story 1

```text
Task T007: Write the failing UI behavior tests in tests/unit/App.test.tsx
Task T008: Create the presentational chat panel in src/components/ChatPanel.tsx
```

After both are ready:

```text
Task T009: Implement App state and service injection in src/App.tsx
Task T010: Wire src/main.tsx and src/styles.css
```

## Parallel Example: User Story 2

```text
Task T012: Write context and stale-response tests in tests/unit/App.test.tsx and tests/unit/services.test.ts
Task T015: Review the Gemini adapter request contract for src/services/geminiChatService.ts
```

T013, T014, T015, and T016 are serialized where they touch the same runtime state or
entry point.

## Parallel Example: User Story 3

```text
Task T017: Write safety and disclosure tests in tests/unit/App.test.tsx and tests/unit/services.test.ts
Task T021: Prepare deterministic supported-topic and boundary fixtures in tests/support/fakeChatService.ts
```

T018, T019, and T020 follow the assertions and are serialized by their shared prompt,
service, and UI files.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Setup and Foundational phases.
2. Complete User Story 1, including the initial CI workflow.
3. Run `npm run test:unit` and `npm run build`.
4. Validate the single-screen shell, valid submission, Enter submission, whitespace
   rejection, and fake assistant response.
5. Stop at the US1 checkpoint for the first issue/PR and demo.

### Incremental Delivery

1. Delivery Task 1: UI shell, unit tests, and initial CI.
2. Delivery Task 2: ChatService seam, Gemini adapter, and fake-service context support.
3. Delivery Task 3: CA persona, scope boundaries, disclaimer, error behavior, and
   conversation memory.
4. Delivery Task 4: Intercepted Playwright coverage wired into CI.
5. Delivery Task 5: GitHub Pages deployment after all validation jobs pass.
6. At every checkpoint, preserve the earlier story tests and do not introduce a
   backend, persistent history, or committed credential.

### Parallel Team Strategy

With multiple developers, keep the five issue/PR boundaries intact:

1. One developer completes Setup and Foundational work together.
2. After the foundation, one developer owns US1 UI/tests/CI while another reviews the
   ChatService contract for Delivery Task 2.
3. After US1 is merged, one developer owns provider/context work and another prepares
   prompt and safety test cases for Delivery Task 3.
4. E2E and deployment work begins only after the production browser path is stable.

## Notes

- Every checklist item starts with `- [ ]`, has a sequential task ID, and includes
  exact repository-relative file paths.
- `[P]` marks only tasks that can be worked on concurrently without touching an
  incomplete dependency or the same file.
- `[US1]`, `[US2]`, and `[US3]` map directly to the prioritized stories in `spec.md`.
- The API key must never appear in source, tests, workflow logs, or committed files.
- Do not add a backend, persistence layer, login, saved history, tax filing, or
  personalized legal or financial advice.
