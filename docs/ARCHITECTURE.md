# Architecture

One Next.js application on Vercel, backed by Supabase (Postgres, Auth, Storage). This records the
plan approved in Phase 1; sections marked _(planned)_ are not built yet.

## Boundaries

- `app/(site)` — public, statically prerendered, indexable.
- `app/admin` _(planned)_ — admin dashboard; requires `admin` role **and** TOTP (aal2).
- `app/portal` _(planned)_ — client portal; invite-only, magic link / one-time code.
- `domain/` — pure business logic, no I/O, fully unit-tested (money, invoice maths, state machines).
- `server/` — server-only: repositories, authorisation guards, email, PDF, payment adapters.

## Data access and security _(planned)_

- Server code uses the **signed-in user's session**, so Postgres Row Level Security applies to
  admins and clients alike. The service-role key is confined to inquiry intake, webhooks and the
  admin bootstrap script.
- Three layers: proxy (route gate + noindex) → server guards in every action → RLS backstop.
- Clients read through narrow views; internal notes live in a separate table no client policy
  touches. A project reference never grants access on its own.
- Initial admin: `pnpm admin:bootstrap --email …` run locally; refuses if an admin exists.
- Every protected page and Server Action calls a guard in `src/server/auth.ts`
  (`requireAdmin`, `assertAdmin`, `requirePortalUser`); the guard forces request-time rendering.
- Database tests in `tests/db/rls.test.ts` exercise each rule with real sessions.
- Audit log is append-only via triggers on invoices, payments, roles and settings.

## Data model _(planned)_

Profiles, clients, client_members, pipeline_stages, leads, consent_records,
inquiry_resume_tokens, project_statuses, projects (unique `lead_id`), milestones,
project_updates, internal_notes, invoices, invoice_items, invoice_taxes, payment_methods,
invoice_payment_methods (instructions snapshot), payments (unique provider event id and
idempotency key), receipts, email_templates, email_messages (outbox + log), notification_rules,
activities, audit_log, business_settings, number_sequences, rate_limits.

Money is stored as `bigint` minor units plus an ISO currency (USD, GBP, EUR, BDT); there is no
automatic conversion. Balances come from a view over confirmed payments.

Invoice states: Draft → Sent → Partially Paid → Paid, with Overdue set by a daily job and
Cancelled allowed only without confirmed payments. Issued invoices are immutable.

## Content

Services and general FAQs live in the database and are edited at `/admin/content`; public pages
read them through `src/server/content.ts` (`"use cache"`, tag `content`) and refresh on save.
Site identity, process and principles stay in `src/content`. Case studies move to the database
once real ones exist. Interactive demos stay in
code and are selected per service by key (`components/graphics/service-demo.tsx`).

## Rendering notes (Next.js 16)

- Cache Components and Partial Prefetching are on. Route segment exports like `dynamic` and
  `revalidate` are unavailable; use `"use cache"` + `cacheLife`.
- Dynamic routes must return at least one param from `generateStaticParams`.
- `src/proxy.ts` (formerly middleware) rejects unknown service slugs so they return a true 404
  instead of a streamed soft-404.
- Content saves call `revalidateTag("content", "max")` and warm the affected pages, instead of
  `updateTag`: expiring prerendered pages outright intermittently breaks the first client-side
  navigation in Next.js 16.4 ("Connection closed"). Re-test on upgrade (see the content e2e test).

## Email and intake (Phase 4)

- `src/server/email/`: `outbox.ts` writes every message to `email_messages` before sending, keyed
  by an idempotency key; `deliverEmail` claims the row so concurrent calls send once; failures are
  recorded and retried with backoff by `/api/cron/email`. Providers: Resend (with its
  Idempotency-Key header) or Mailpit. `EMAIL_MODE` (log/allowlist/live) decides whether anything
  leaves the server.
- Delivery status changes only via `/api/webhooks/resend`, after Svix signature verification;
  events are stored once by id.
- Public intake (`src/app/(site)/start-a-project/actions.ts`): honeypot, minimum fill time,
  Turnstile, rate limits, then `submit_inquiry` in one transaction; notifications are queued after
  the response with `after()`, so an email failure never affects the stored lead.
- The service role is used only by intake, the outbox, webhooks and scheduled jobs — each behind
  its own checks. Admin pages use the admin's session and RLS.
