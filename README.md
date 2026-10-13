# rashedbin.com

Website, CRM, client portal and invoicing for **Rashed (Rashedul Islam)** — an independent website
design, development and optimisation business serving the UK, US, Europe and Bangladesh.

> **Status:** Phase 2 of 7 complete (design system + public website). The enquiry form validates
> fully but does **not** store submissions yet — storage arrives in Phase 4. Do not point the
> production domain at this app until Phase 4 is complete. See [docs/ROADMAP.md](docs/ROADMAP.md).

## Stack

| Concern            | Choice                                                                              |
| ------------------ | ----------------------------------------------------------------------------------- |
| Framework          | Next.js 16 (App Router, Cache Components, Turbopack), React 19, TypeScript (strict) |
| Styling            | Tailwind CSS v4 with design tokens in `src/app/globals.css`                         |
| Validation         | Zod (shared by browser and server)                                                  |
| Tests              | Vitest (unit), Playwright + axe-core (end-to-end, accessibility)                    |
| Planned (Phase 3+) | Supabase (Postgres, Auth, Storage, RLS), Resend, Cloudflare Turnstile, Vercel       |

## Getting started

```bash
nvm use            # Node 22 (see .nvmrc; minimum 20.9)
pnpm install
cp .env.example .env.local
pnpm dev           # http://localhost:3000
```

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
    layout.tsx         root layout: fonts, default metadata, indexing control
    sitemap.ts robots.ts opengraph-image.tsx not-found.tsx global-error.tsx
  components/
    ui/                design-system primitives (buttons, containers, FAQ, breadcrumbs…)
    site/              header, footer, service switcher, process timeline, CTA band
    graphics/          hero diagram and one explainer graphic per service
    forms/             multi-step enquiry form and accessible field components
  content/             typed content: site identity, services, FAQs, process, case studies
  domain/              pure business logic (no I/O) — inquiry validation today
  server/              server-only modules (inquiry storage stub until Phase 4)
  lib/                 SEO metadata and JSON-LD helpers
  proxy.ts             request proxy (404s for unknown service URLs; auth in Phase 3)
e2e/                   Playwright tests
docs/                  architecture, roadmap, content checklist, deployment
```

## Documentation

- [Architecture](docs/ARCHITECTURE.md) — system design, data model, security model
- [Roadmap](docs/ROADMAP.md) — phases, status and what's next
- [Content checklist](docs/CONTENT.md) — what the business owner needs to supply or approve
- [Deployment](docs/DEPLOYMENT.md) — environments, indexing, launch checklist
