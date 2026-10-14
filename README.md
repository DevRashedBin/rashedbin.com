# rashedbin.com

Website, CRM, client portal and invoicing for **Rashed (Rashedul Islam)** — an independent website
design, development and optimisation business serving the UK, US, Europe and Bangladesh.

> **Status:** Phases 0–4 complete locally (site, database, auth, admin, CRM, email). Enquiries are
> stored and emails work against the local inbox; production needs the accounts listed in
> [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). See [docs/ROADMAP.md](docs/ROADMAP.md).

## Stack

| Concern            | Choice                                                                              |
| ------------------ | ----------------------------------------------------------------------------------- |
| Framework          | Next.js 16 (App Router, Cache Components, Turbopack), React 19, TypeScript (strict) |
| Styling            | Tailwind CSS v4 with design tokens in `src/app/globals.css`                         |
| Validation         | Zod (shared by browser and server)                                                  |
| Tests              | Vitest (unit), Playwright + axe-core (end-to-end, accessibility)                    |
| Planned (Phase 3+) | Supabase (Postgres, Auth, Storage, RLS), Resend, Cloudflare Turnstile, Vercel       |

## Getting started

Requires Node 22 (see `.nvmrc`), pnpm and Docker.

```bash
pnpm install
pnpm db:start                    # local Supabase (Postgres, Auth, Mailpit) — applies migrations
cp .env.example .env.local       # then paste API_URL / PUBLISHABLE_KEY / SECRET_KEY from `npx supabase status`
pnpm admin:bootstrap --email you@example.com   # create the first admin (prompts for a password)
pnpm dev                         # http://localhost:3000 — admin at /admin, client portal at /portal
```

Local emails (enquiry acknowledgements, alerts, follow-ups, portal sign-in codes) arrive in
Mailpit at http://127.0.0.1:54324 — set `EMAIL_PROVIDER=mailpit` and `EMAIL_MODE=live` in
`.env.local`. Nothing is sent to real inboxes locally.

## Scripts

| Script                         | What it does                                                                              |
| ------------------------------ | ----------------------------------------------------------------------------------------- |
| `pnpm dev`                     | Development server                                                                        |
| `pnpm build` / `pnpm start`    | Production build / serve it                                                               |
| `pnpm lint`                    | ESLint                                                                                    |
| `pnpm typecheck`               | Generate route types and run `tsc`                                                        |
| `pnpm test`                    | Unit tests (Vitest)                                                                       |
| `pnpm test:e2e`                | End-to-end tests on mobile, tablet, laptop and desktop viewports — run `pnpm build` first |
| `pnpm format` / `format:check` | Prettier                                                                                  |
| `pnpm check`                   | lint + typecheck + unit tests + build                                                     |

If your environment has a pre-installed Chromium that doesn't match Playwright's version, set
`PLAYWRIGHT_CHROMIUM_PATH=/path/to/chromium`.

## Project structure

```
src/
  app/
    (site)/            public website: home, services, about, start-a-project, legal
    admin/             dashboard: (auth) login + MFA, (app) overview, clients, content, settings, audit
    portal/            client portal: (auth) email-code login, (app) client home
    layout.tsx         root layout: fonts, default metadata, indexing control
    sitemap.ts robots.ts opengraph-image.tsx not-found.tsx global-error.tsx
  components/
    ui/                design-system primitives (buttons, containers, FAQ, breadcrumbs…)
    site/              header, footer, service switcher, process timeline, CTA band
    graphics/          hero diagram and one explainer graphic per service
    forms/             multi-step enquiry form and accessible field components
  content/             static content: site identity, process, principles, case studies
  domain/              pure business logic and validation (no I/O): inquiry, content, clients, settings
  server/              server-only: auth guards (auth.ts), Supabase clients, content repository, DB types
  lib/                 SEO metadata and JSON-LD helpers
  proxy.ts             404s for unknown service URLs; session refresh + nonce CSP for admin/portal
supabase/              config, SQL migrations, email templates
scripts/               admin bootstrap
tests/db/              RLS and content tests (Vitest, real API sessions)
e2e/                   Playwright tests
docs/                  architecture, roadmap, content checklist, deployment
```

## Documentation

- [Architecture](docs/ARCHITECTURE.md) — system design, data model, security model
- [Roadmap](docs/ROADMAP.md) — phases, status and what's next
- [Content checklist](docs/CONTENT.md) — what the business owner needs to supply or approve
- [Deployment](docs/DEPLOYMENT.md) — environments, indexing, launch checklist
