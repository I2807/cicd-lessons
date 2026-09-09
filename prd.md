# CA Buddy PRD

## One paragraph
CA Buddy is a frontend-only chatbot for small-business owners who need clear answers to everyday Indian tax and audit questions, including GST, TDS, ITR deadlines, and audit basics. It answers in a practical Chartered Accountant persona, remembers the current conversation, and clearly tells the user when to consult a Chartered Accountant.

## User
The user is an Indian small-business owner who wants a quick, plain-language starting point before deciding whether professional CA advice is needed.

## Happy path (this is the three-minute demo)
Open CA Buddy, read the one-line disclaimer, and ask, “When is my GST return due?” The chat shows the question and a concise answer. Ask a follow-up about the same situation; the answer uses the conversation context. Ask an out-of-scope or high-stakes question; CA Buddy explains its limit and says to consult a CA. Click “New chat”; the visible conversation and model context clear, ready for another question.

## Out of scope
No login, saved history, settings, server, backend, database, tax filing, calculations that require user records, personalized legal or financial advice, or replacement of a Chartered Accountant.

## Architecture
- Frontend only. React + TypeScript + Vite. No backend, no server, no database. The browser calls Google Gemini directly through LangChain.js (@langchain/google-genai). The API key is read from VITE_GOOGLE_API_KEY — a local .env during development, a GitHub Actions secret when built in CI.
- The browser UI owns the current chat state and calls a `ChatService` interface. Production uses LangChain.js with Google Gemini; tests inject a fake service or intercept the Gemini request.
- Design: modern, attractive and simple. One screen: a header, one chat panel, an input, a "New chat" button, a one-line disclaimer. No login, no saved history, no settings.

## Functional requirements FR-1 to FR-8
- **FR-1:** On load, the app renders one screen containing a header, chat panel, text input, “New chat” button, and one-line disclaimer; a UI test can locate each element.
- **FR-2:** The user can submit a non-empty question with the input control or Enter; the submitted message appears in the chat panel and empty submissions do not create a message.
- **FR-3:** Each submitted question is sent through `ChatService`, and the returned answer appears in the chat panel without a page reload; unit tests use the fake implementation.
- **FR-4:** The assistant answers everyday Indian GST, TDS, ITR-deadline, and audit-basics questions in clear, practical language.
- **FR-5:** For requests outside this scope or requiring individualized professional judgment, the assistant states the limit and tells the user to consult a Chartered Accountant.
- **FR-6:** Follow-up questions include the current conversation context, and “New chat” clears both displayed messages and conversation memory.
- **FR-7:** The disclaimer remains visible on the single screen and makes clear that CA Buddy is general information, not professional advice.
- **FR-8:** The browser reads the Gemini key only from `VITE_GOOGLE_API_KEY` and makes the model request directly; no app backend or server endpoint is used.

## The model
- **Provider:** Google Gemini through LangChain.js (`@langchain/google-genai`).
- **Model name:** `gemma-4-26b-a4b-it`.
- **System prompt:** A versioned text constant in `src/ai/caSystemPrompt.ts`, loaded by the production `ChatService`; it defines the CA persona, scope rules, fallback, disclaimer language, and context behavior.
- **Max tokens:** 1,024 output tokens per response.

## Quality gates
- Testing: unit tests (Vitest + Testing Library) with the model faked; end-to-end tests (Playwright) with the Gemini request intercepted; both run in GitHub Actions on every push and pull request.
- Deployment: GitHub Pages through GitHub Actions. Tests must pass before anything deploys.
- A pull request is mergeable only when the unit and end-to-end suites pass, the production build succeeds, and the app meets FR-1 to FR-8. The CI workflow must not expose the API key in logs or committed files.

## The five tasks
Exactly five tasks build the whole app, in this order, one GitHub issue and one pull request each:
1. Chat UI shell, unit tests, and the CI workflow that runs them.
2. ChatService interface; LangChain + Gemini implementation; a fake implementation for tests.
3. The CA persona: system prompt in a file, scope rules, "consult a CA" fallback, disclaimer, conversation memory.
4. Playwright end-to-end tests with the Gemini call intercepted, wired into CI.
5. GitHub Pages deployment, gated on all tests passing.

## Acceptance walkthrough
1. Start the built frontend and confirm the single-screen layout, disclaimer, input, chat panel, and “New chat” control.
2. Submit an everyday GST, TDS, ITR-deadline, or audit-basics question and verify a fake-model unit test and the visible answer.
3. Ask a follow-up and verify conversation context; click “New chat” and verify both the UI and context reset.
4. Submit an out-of-scope or individualized question and verify the response tells the user to consult a CA.
5. Run the Playwright flow with the Gemini request intercepted, then push and open a pull request to verify both test suites run in GitHub Actions before the GitHub Pages deployment.
