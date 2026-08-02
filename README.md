# ThreadExtract

Slack middleware that turns tribal knowledge into documentation with zero behavior change. React to any Slack thread with a 🧠 emoji, and ThreadExtract fetches the thread, uses an AI model to extract the core problem/solution, and publishes clean Markdown into a Notion database.

## Tech stack

- Next.js (App Router) + TypeScript + TailwindCSS
- PostgreSQL via Prisma ORM
- Auth: NextAuth v5 (`next-auth`) — Google OAuth + Resend magic-link, database sessions
- Billing: Stripe (Checkout + webhook + customer portal)
- AI: `@google/generative-ai` (Gemini) with `groq-sdk` (Groq/Llama) fallback
- `@slack/web-api`, `@notionhq/client`
- pnpm, deployed via PM2 on EC2 (see `infra/`)

## Local setup

```bash
pnpm install
cp .env.example .env.local   # fill in the values below
pnpm exec prisma generate
pnpm exec prisma db push
pnpm dev
```

### Environment variables

See `.env.example` for the full list. Highlights:

- `DATABASE_URL` — Postgres connection string.
- `SLACK_CLIENT_ID` / `SLACK_CLIENT_SECRET` / `SLACK_SIGNING_SECRET` — from your Slack app at [api.slack.com/apps](https://api.slack.com/apps). Required OAuth scopes: `channels:history`, `groups:history`, `im:history`, `mpim:history`, `reactions:read`, `chat:write`. Event subscription: `reaction_added`, pointed at `/api/slack/events`.
- `GEMINI_API_KEYS` / `GROQ_API_KEYS` — comma-separated keys, tried in order with automatic rotation/fallback.
- `TOKEN_ENCRYPTION_KEY` — encrypts Slack/Notion tokens at rest (AES-256-GCM). Generate with `openssl rand -base64 32`.
- `CLAIM_TOKEN_SECRET` — signs the short-lived workspace-claim and OAuth CSRF-state tokens. Generate with `openssl rand -hex 32`.
- `NEXTAUTH_SECRET` — generate with `openssl rand -hex 32`. `NEXTAUTH_URL` is the app's public base URL.
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — a Google Cloud OAuth client (Web application type), authorized redirect URI `{NEXTAUTH_URL}/api/auth/callback/google`.
- `RESEND_API_KEY` / `EMAIL_FROM` — magic-link sign-in emails.
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `STRIPE_PRICE_PRO_MONTHLY` / `STRIPE_PRICE_PRO_ANNUAL` — Stripe subscription billing. Webhook endpoint: `/api/stripe/webhook`, listening for `checkout.session.completed`, `customer.subscription.created`/`updated`/`deleted`, `invoice.payment_failed`.
- `AUTH_TRUST_HOST="true"` — **required in any EC2/nginx deployment**, not just for local dev. Without it, Auth.js rejects every request with `UntrustedHost` because the Host header behind the reverse proxy doesn't match `NEXTAUTH_URL`'s origin the way it would on a platform like Vercel.

## How it works

1. A Slack admin clicks "Add to Slack" and completes OAuth. The workspace is created with a 14-day trial and no owner yet.
2. They're redirected through `/claim` (a short-lived signed link) to sign in via Google or magic-link, which attaches the workspace to their account.
3. `/dashboard` (Notion config) and `/billing` (plan management) are gated by that account — one owner per workspace.
4. Reacting to a Slack message with 🧠 fires `reaction_added` → `/api/slack/events` (signature-verified) → fetches the thread, checks the workspace's usage cap, calls the AI model, and pushes a formatted page to Notion.
5. Free-tier workspaces are capped at 5 extractions/month after their trial ends; Pro is unlimited.

## Testing

### Unit tests (Vitest)

```bash
pnpm test
```

Covers the pure-function logic: Slack signature verification, claim/OAuth-state tokens, markdown→Notion-block conversion, AI output validation, and billing tier/cap logic.

### End-to-end tests (Playwright)

```bash
createdb threadextract_test   # once
DATABASE_URL="postgresql://$(whoami)@localhost:5432/threadextract_test?schema=public" pnpm exec prisma db push
pnpm test:e2e
```

Runs against a real local Postgres database and a real `next dev` server (port 3100), driven by `.env.test` (committed, safe placeholder secrets — Next.js loads it automatically for `NODE_ENV=test` and skips `.env.local`, so this never touches your real dev secrets). It does **not** drive real Slack/Google/Notion/AI UIs — those can't be automated reliably — instead:

- **Auth** is bypassed by seeding a real Auth.js database `Session` row and injecting its cookie directly (`e2e/helpers/auth.ts`), exercising every downstream authorization check for real.
- **Slack OAuth install** is bypassed by seeding a `Workspace` row directly and driving `/claim` with a real signed token from `src/lib/claim-token.ts` — the actual claim/ownership logic runs for real, just without a live Slack consent screen.
- **Slack events** and **Stripe webhooks** are tested with directly-POSTed, correctly-HMAC-signed payloads (`e2e/helpers/signing.ts`, mirroring the exact schemes in `src/lib/slack-verify.ts` and the Stripe SDK) — this is the most reliable way to test webhook security/logic, and covers signature rejection, replay-window rejection, malformed-payload handling, and the full subscription lifecycle (checkout → active → canceled) against real DB state.
- **Stripe Checkout** itself is asserted only as far as "redirects to a real `checkout.stripe.com` session" — that assertion is skipped by default (`.env.test` ships no real Stripe price) and activates automatically once you add real test-mode Stripe credentials via a gitignored `.env.test.local`.
- **The real AI (Gemini/Groq) → Notion round trip** (`e2e/ai-notion-roundtrip.spec.ts`) calls `extractAndPublish()` — the AI+Notion half of `src/lib/extractor.ts`, split out from the Slack-fetching half specifically so it's testable without a live Slack thread — with a canned transcript, against your real AI provider and a real Notion database, then verifies Notion's actual API accepted the generated `heading_3`/`paragraph` blocks (not just that our types compiled), and archives the test page afterward. Skipped unless configured; set `E2E_NOTION_TOKEN` (a Notion internal integration secret, shared with the target database — see Notion's "Connections" UI on that database) and `E2E_NOTION_DATABASE_ID` via a gitignored `.env.test.local`, plus a real `GEMINI_API_KEYS` or `GROQ_API_KEYS`.
  - **In CI**: this same test runs against the `E2E_NOTION_TOKEN`, `E2E_NOTION_DATABASE_ID`, and `E2E_GEMINI_API_KEY` repo secrets (Settings → Secrets and variables → Actions) — it self-skips (green, not failed) if they're unset, so CI stays green before they're configured. Every CI run that has them configured creates and archives one real Notion page and makes one real AI call.

If you edit `.env.test`, the `TOKEN_ENCRYPTION_KEY`/`CLAIM_TOKEN_SECRET`/`NEXTAUTH_SECRET` fail-fast checks still apply — keep them valid-shaped (32-byte base64 / hex respectively) or the webServer will crash on boot.

## Deploying

Deploys are manual, via `/Users/ashishbhagat/products/deploy_threadextract_{prod,uat}.sh` on the host machine — they rsync the repo to an EC2 box, run `pnpm install && prisma generate && prisma db push && pnpm build`, and reload PM2 (`infra/ecosystem.threadextract.config.js`). Both environments read secrets from `.env.production` / `.env.uat` on the EC2 host, not from this repo — any new env var added here must also be added there before deploying.
