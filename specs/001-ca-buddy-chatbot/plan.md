# Implementation Plan: CA Buddy Tax Guidance Chatbot

**Branch**: `001-ca-buddy-chatbot` | **Date**: 2026-09-09 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-ca-buddy-chatbot/spec.md`

## Summary

Build a single-screen browser chatbot for Indian small-business owners. The UI owns
the active conversation and depends on a provider-independent `ChatService`. The
production adapter sends the versioned CA prompt and ordered conversation history to
Gemini through LangChain.js; unit tests inject a fake service and Playwright tests
intercept the browser request. Conversation generations prevent late responses from
reappearing after New chat. GitHub Actions validates the unit suite, production build,
and end-to-end suite before GitHub Pages deployment.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 22.12+ LTS

**Primary Dependencies**: React, Vite, `@langchain/google-genai`, Vitest,
Testing Library, and Playwright

**Storage**: In-memory browser state only; no persistent storage or backend

**Testing**: Vitest + Testing Library for unit behavior; Playwright for end-to-end
browser behavior; production build validation in CI

**Target Platform**: Modern desktop and mobile browsers served as a static GitHub
Pages site

**Project Type**: Single frontend web application

**Performance Goals**: The interface remains usable while a response is pending; a
valid submission renders one corresponding response after the service resolves; model
output is capped at 1,024 tokens; the documented happy path is completable in under
three minutes

**Constraints**: No backend, database, authentication, saved history, or server
endpoint; the browser reads only `VITE_GOOGLE_API_KEY`; the key is never committed or
logged; one active conversation per browser tab; English-only v1; general information
only; New chat must invalidate pending responses

**Scale/Scope**: One screen, one active conversation, five ordered delivery tasks,
and the supported topics defined by FR-005 and FR-006

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Phase 0 Gate

- **I. User-Centered Plain Language**: PASS. The plan preserves the single-screen
  workflow, visible disclaimer, and supported-topic language from the spec.
- **II. Browser-Only Data Boundaries**: PASS. There is no server or persistence. The
  unavoidable client-exposed `VITE_GOOGLE_API_KEY` is kept out of source, logs, and
  tests, with provider restrictions and rotation documented in research.
- **III. Testable User Workflows**: PASS. Unit, end-to-end, and build checks cover the
  specified submission, context, reset, safety, and failure behaviors.
- **IV. Explicit Service Contracts**: PASS. The UI depends on `ChatService`; Gemini
  configuration stays in its adapter and the CA prompt has a dedicated file.
- **V. Professional Safety Boundaries**: PASS. The prompt and acceptance checks cover
  supported general topics and the Chartered Accountant fallback.
- **Gate result**: PASS. No constitution violation requires an exception.

## Project Structure

### Documentation (this feature)

```text
specs/001-ca-buddy-chatbot/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── chat-service.md
│   └── ui-behavior.md
└── tasks.md             # Created by /speckit-tasks, not this command
```

### Source Code (repository root)

```text
src/
├── ai/
│   └── caSystemPrompt.ts
├── components/
│   └── ChatPanel.tsx
├── services/
│   ├── chatService.ts
│   └── geminiChatService.ts
├── types/
│   └── chat.ts
├── App.tsx
├── main.tsx
├── styles.css
└── vite-env.d.ts

tests/
├── unit/
│   ├── App.test.tsx
│   └── services.test.ts
├── e2e/
│   └── chat.spec.ts
└── support/
    └── fakeChatService.ts

index.html
package.json
package-lock.json
playwright.config.ts
tsconfig.json
vite.config.ts
.env.example
.gitignore
.github/
└── workflows/
    ├── ci.yml
    └── deploy.yml
```

**Structure Decision**: Use one Vite frontend at the repository root. UI state and
components live under `src/`, provider integration is isolated under `src/services/`,
and test-only fakes stay under `tests/support/`. Unit and end-to-end suites are
separate so CI can report their gates independently. No backend, frontend subproject,
database, or API directory is introduced.

### Post-Phase 1 Gate

- **I. User-Centered Plain Language**: PASS. `contracts/ui-behavior.md` defines
  accessible names and visible copy for the single-screen experience.
- **II. Browser-Only Data Boundaries**: PASS. `data-model.md` contains no persistence
  entity, and `contracts/chat-service.md` forbids service-owned history and key logs.
- **III. Testable User Workflows**: PASS. `quickstart.md` maps the runnable scenarios
  to unit, end-to-end, and build checks.
- **IV. Explicit Service Contracts**: PASS. The service request, response, error, and
  fake-service behavior are defined in `contracts/chat-service.md`.
- **V. Professional Safety Boundaries**: PASS. The UI contract and quickstart include
  the disclaimer and consult-a-CA fallback checks.
- **Gate result**: PASS. Design artifacts introduce no unjustified complexity or
  constitution exceptions.

## Complexity Tracking

No constitution violations. No complexity justification is required.
