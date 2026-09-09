# Quickstart: CA Buddy Tax Guidance Chatbot

This guide validates the feature without requiring a live Gemini response in tests.
The expected user-facing flow is defined in [ui-behavior.md](contracts/ui-behavior.md),
and conversation state is defined in [data-model.md](data-model.md).

## Prerequisites

- Node.js 22.12 or newer
- npm
- A modern browser for the local app and Playwright browsers for end-to-end tests
- A Google Gemini key only when manually exercising the real provider

## Install and Configure

From the repository root:

```bash
npm install
cp .env.example .env.local
```

For a manual provider run, put the local development credential in `.env.local` as
`VITE_GOOGLE_API_KEY=...`. Do not commit `.env.local`, paste the key into tests, or
print it in the terminal. Because `VITE_*` values are bundled into browser code, use
an API-restricted, quota-limited, rotatable key for any deployed demonstration.

## Run the Application

```bash
npm run dev
```

Open the local URL shown by Vite and verify:

1. The header identifies CA Buddy.
2. The chat panel, question input, submit control, New chat control, and one-line
   general-information disclaimer are visible on the initial screen.
3. Asking `When is my GST return due?` adds the question and one concise answer.
4. A follow-up uses the earlier conversation.
5. An individualized or out-of-scope question states the limit and directs the user
   to consult a Chartered Accountant.
6. New chat clears the visible exchange, and the next question starts without the old
   context.

## Run Unit Tests

```bash
npm run test:unit
```

The unit suite must cover:

- initial landmarks and disclaimer;
- valid submit through the control and Enter;
- whitespace-only rejection;
- assistant response rendering;
- ordered follow-up context;
- service failure and reusable input;
- New chat clearing state and ignoring a delayed old response.

## Run End-to-End Tests

```bash
npm run test:e2e:install
npm run test:e2e
```

The Playwright suite must run against the built or preview app and intercept the
Gemini request with deterministic responses. It must not require or expose a live
credential; its dedicated E2E build mode uses an ephemeral runtime value only so the
intercepted request follows the production browser path. The suite covers the primary
walkthrough, safety fallback, context signal, reset, and refresh behavior described
above.

## Build Validation

```bash
npm run build
```

A successful build produces the static artifact used by GitHub Pages. It must not rely
on a server endpoint or committed credential.

## CI and Deployment Validation

On every push and pull request, GitHub Actions must run the unit suite, production
build, and Playwright suite. The deployment job may run only for the production branch
after those jobs pass, then upload the verified build artifact and deploy it to GitHub
Pages. Review the workflow logs to confirm that no API key or request header is printed.

## Validated Locally

The implementation has been validated with Node.js 22.22.2 using:

- `npm run test:unit` — 17 unit tests passed.
- `npm run build` — TypeScript check and Vite production build passed.
- `npm run test:e2e` — 4 intercepted-browser scenarios passed.

The production build reports a non-blocking bundle-size advisory because the Gemini
client increases the main JavaScript chunk above 500 kB. This does not affect the
current acceptance flow or deployment gate.
