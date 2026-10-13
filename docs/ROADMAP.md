# Roadmap

| Phase | Scope                                                                                                                                                                             | Status                              |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| 0     | Foundation: scaffold, tooling, CI, env template, security headers                                                                                                                 | ✅ Done                             |
| 2     | Design system + public website + SEO foundations                                                                                                                                  | ✅ Done (copy pending owner review) |
| 3     | Supabase migrations, RLS + RLS tests, auth (client magic link, admin password + TOTP), admin bootstrap script, dashboard shell, services/content moved to the database            | ⏳ Next                             |
| 4     | Inquiry storage, Turnstile, rate limits, save-and-resume with consent, leads board, follow-up templates, email outbox + webhooks, convert to project. **Earliest public launch.** | Planned                             |
| 5     | Manual projects, milestones, client-visible updates, notification rules, client invites, portal                                                                                   | Planned                             |
| 6     | Invoices, PDF snapshots, payment methods, partial payments, receipts, overdue job                                                                                                 | Planned                             |
| 7     | Security review, full QA, Lighthouse, backup/restore drill, redirects, DNS cutover, Search Console                                                                                | Planned                             |

Phase 1 was the read-only audit and plan.

## Phase 2 summary

**Built**

- Design tokens (monochrome palette, Geist / Geist Mono / Instrument Serif), capsule buttons,
  section system and motion rules. Scroll reveals use CSS scroll-driven animations (no JavaScript)
  and are disabled under `prefers-reduced-motion`.
- Pages: Home, Services index, 8 service pages, About, Start a project, Privacy, Terms, 404, error
  pages.
- Custom graphics: hero conversion diagram plus one explainer per service (blueprint, before/after
  slider, global styles, bug trace, crawl/index check, security layers, Core Web Vitals thresholds,
  checkout flow). Diagrams that aren't factual references are labelled "Illustration".
- Four-step enquiry form with conditional fields, client and server validation (shared Zod schema),
  honeypot and minimum fill time. Without a database it shows an honest "not sent" message.
- SEO: per-page metadata and canonical URLs, Open Graph image, JSON-LD (ProfessionalService, Person,
  WebSite, Service, BreadcrumbList, FAQPage), sitemap, robots, site-wide `noindex` unless
  `NEXT_PUBLIC_ALLOW_INDEXING=true`, real 404 status for unknown URLs.
- Work / case studies: data model ready; the section is hidden everywhere until real, approved
  case studies exist.

**Tested** (all executed locally): lint, typecheck, 28 unit tests, production build, 160 Playwright
tests (40 per viewport × 4 viewports) covering rendering, single H1, canonical URLs, no horizontal
overflow, axe WCAG 2.1 AA checks (no serious/critical issues), unique titles, robots/sitemap,
security headers, navigation, keyboard-operable tabs and slider, and form validation journeys.

**Not tested / not built yet:** real submission storage and emails (Phase 4), Lighthouse budgets
(Phase 7), Rich Results Test validation (needs the deployed URL).
