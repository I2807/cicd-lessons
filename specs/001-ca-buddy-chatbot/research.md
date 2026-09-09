# Phase 0 Research: CA Buddy Tax Guidance Chatbot

## Decision 1: Use a single React + TypeScript + Vite browser application

- **Decision**: Build one frontend project with React and TypeScript, bundled by Vite.
- **Rationale**: This is the stack required by the PRD and constitution, and the feature
  has no server, database, authentication, or persistent data boundary. A single
  project keeps the one-screen workflow and deployment artifact straightforward.
- **Alternatives considered**: A full-stack application was rejected because the
  product explicitly forbids a backend and saved user records. A multi-package
  workspace was rejected because no independent package boundary is needed for this
  feature.

## Decision 2: Use Node.js 22 LTS and npm scripts as the project execution baseline

- **Decision**: Standardize local and CI execution on Node.js 22 LTS with a committed
  npm lockfile and scripts for development, unit tests, end-to-end tests, and build.
- **Rationale**: Current Vitest guidance requires Node.js 22.12 or newer and Vite
  tooling is designed to run from the project package configuration. One declared
  runtime prevents local and CI drift.
- **Alternatives considered**: An unpinned Node version was rejected because it makes
  test and build behavior dependent on the runner image. pnpm or Yarn was rejected
  because the repository has no existing package-manager convention.

## Decision 3: Keep the ChatService boundary provider-independent

- **Decision**: The UI calls a `ChatService` contract that accepts the current user
  question and ordered conversation history, then resolves to one assistant response.
  The production adapter owns provider-specific prompt and model configuration; tests
  inject a deterministic fake.
- **Rationale**: This directly satisfies the constitution's Explicit Service Contracts
  principle and makes context forwarding, failures, and reset behavior unit-testable
  without a network call.
- **Alternatives considered**: Calling the Gemini client directly from the UI was
  rejected because it would couple presentation state to provider details and make
  tests brittle. A backend proxy was rejected by the browser-only product boundary.

## Decision 4: Use the required Gemini model through LangChain.js

- **Decision**: The production adapter uses `@langchain/google-genai` with model
  `gemma-4-26b-a4b-it`, the versioned CA system prompt, ordered history, and a maximum
  output of 1,024 tokens.
- **Rationale**: These provider, model, prompt, and token requirements are explicit in
  the PRD and constitution. Keeping them in the adapter prevents model configuration
  from leaking into UI code.
- **Alternatives considered**: A direct Google SDK call was rejected because the PRD
  explicitly selects LangChain.js. The deprecated Gemini model was rejected because
  the required Gemma model name is now part of the product contract.

## Decision 5: Treat the browser API key as a constrained demo credential

- **Decision**: Read only `VITE_GOOGLE_API_KEY` through Vite's client environment
  mechanism. Local development uses an ignored `.env.local`; CI receives the value
  from a GitHub Actions secret. Tests never require a live key and never log it.
  Deployment documentation MUST require Google API restrictions, referrer limits,
  quota limits, and rotation for the exposed browser credential.
- **Rationale**: Vite documents that `VITE_*` variables are statically bundled and
  visible to browser users, so this architecture cannot provide server-grade secret
  confidentiality. The restrictions reduce abuse while preserving the explicitly
  required frontend-only design.
- **Alternatives considered**: A server-side proxy would protect the key but violates
  the no-backend requirement. Committing a key is unacceptable and violates the
  constitution. Hiding the value in another client-side variable would not improve
  confidentiality.

## Decision 6: Use Vitest and Testing Library for behavior-focused unit tests

- **Decision**: Configure Vitest with a browser-like DOM environment and Testing
  Library tests around the chat UI/controller. Use fake `ChatService` implementations
  for valid submissions, context, failures, and New chat reset.
- **Rationale**: Vitest integrates with Vite configuration and supports one-shot CI
  execution. Testing Library verifies user-visible behavior and stable accessible
  controls rather than implementation details.
- **Alternatives considered**: Testing only the provider adapter was rejected because
  the highest-risk behavior is the UI/service/context boundary. Snapshot-only testing
  was rejected because it would not prove submission, reset, or stale-response rules.

## Decision 7: Use Playwright request interception for end-to-end coverage

- **Decision**: Run a production-like app in Playwright and intercept the outbound
  Gemini request with a deterministic response. Cover the single-screen layout, happy
  path, follow-up context signal, professional-boundary response, and New chat reset.
- **Rationale**: Interception keeps end-to-end tests deterministic, avoids exposing a
  real credential, and verifies the browser wiring without depending on model output
  or network availability.
- **Alternatives considered**: Live Gemini calls were rejected because they are
  nondeterministic, cost-bearing, and would require a secret in CI. Unit tests alone
  were rejected because they cannot prove the built frontend's browser integration.

## Decision 8: Invalidate stale responses on New chat

- **Decision**: Give each active conversation a generation identity and associate each
  submitted request with that generation. New chat increments the identity and clears
  messages; a response from an older generation is ignored even if it resolves later.
- **Rationale**: Clearing only rendered messages is insufficient when an in-flight
  request can append an old answer afterward. Generation checks provide deterministic
  protection even when the provider client cannot be cancelled.
- **Alternatives considered**: Relying only on an abort signal was rejected because
  cancellation is not guaranteed across every provider and promise boundary. Disabling
  New chat while a response is pending was rejected because the requirement allows a
  reset during a pending answer.

## Decision 9: Gate GitHub Pages deployment after all validation jobs

- **Decision**: CI runs unit tests, production build, and Playwright tests on pushes
  and pull requests. A deployment job runs only for the production branch after the
  required validation jobs pass, uploads the built static artifact, and deploys it to
  GitHub Pages with the required Pages permissions.
- **Rationale**: This implements the constitution's Delivery Quality Gates and the
  PRD's requirement that tests pass before deployment. Artifact-based Pages deployment
  keeps deployment separate from validation and avoids rebuilding unverified output.
- **Alternatives considered**: Deploying directly from a branch was rejected because
  it does not make the test gate explicit. Deploying on pull requests was rejected
  because the first release needs one production deployment path and previews are out
  of scope.

## Sources consulted

- Vite, "Env Variables and Modes": https://vite.dev/guide/env-and-mode
- Vitest, "Getting Started": https://vitest.dev/guide/
- GitHub Actions, `deploy-pages`: https://github.com/actions/deploy-pages
- LangChain JavaScript Google Generative AI integration page (current URL redirected
  to the LangChain overview during research):
  https://js.langchain.com/docs/integrations/chat/google_generative_ai/
- Playwright Test introduction: https://playwright.dev/docs/test-intro
