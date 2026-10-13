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

Phase 2 content lives in typed files under `src/content`. Phase 3 moves services, FAQs and case
studies into the database with an admin editor; pages refresh on save. Interactive demos stay in
code and are selected per service by key (`components/graphics/service-demo.tsx`).

## Rendering notes (Next.js 16)

- Cache Components and Partial Prefetching are on. Route segment exports like `dynamic` and
  `revalidate` are unavailable; use `"use cache"` + `cacheLife`.
- Dynamic routes must return at least one param from `generateStaticParams`.
- `src/proxy.ts` (formerly middleware) rejects unknown service slugs so they return a true 404
  instead of a streamed soft-404.
