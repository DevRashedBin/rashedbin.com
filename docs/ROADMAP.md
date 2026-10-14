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

## Phase 3 summary

**Built**

- Migrations (`supabase/migrations`): profiles and roles, clients, client memberships, internal
  notes, business settings, concurrency-safe business numbering, append-only audit log, services and
  FAQs, plus the Phase 2 content copied into the database.
- Row Level Security on every table. Admin access needs the admin role **and** a TOTP-verified
  session (`aal2`) — enforced in the database, not just the UI. Clients see only their own client
  records; internal notes, settings and the audit log are admin-only.
- Auth: admin password + mandatory TOTP (QR enrolment on first sign-in); client portal sign-in with
  an emailed 6-digit code (no passwords, no self sign-up, no account enumeration).
- `pnpm admin:bootstrap`: creates the first admin interactively; refuses if an admin exists; can
  reset that admin's password or authenticator.
- Proxy refreshes sessions and applies a per-request nonce CSP to `/admin`, `/portal`, `/auth`.
- Admin dashboard: overview, clients (create, edit, search, paginate, archive/restore with
  confirmation, private notes, duplicate-email protection), website content (service editor,
  publish/unpublish, general FAQs), business settings (numbering preview), audit log.
- Client portal: sign-in, account overview (projects arrive in Phase 5).
- Public pages read services and FAQs from the database through a cached repository; edits appear
  on the site within moments.

**Tested** (all executed locally against the real local Supabase stack):

- 24 unit tests; 27 database tests covering client isolation (including ID tampering), privilege
  escalation, MFA enforcement at the database, duplicate prevention, audit immutability (even for
  the service role), numbering uniqueness under concurrency, and content rules.
- 180 Playwright tests: the Phase 2 suite plus admin and portal journeys on mobile and laptop —
  login, MFA enrolment and rejection of wrong codes, aal1 sessions blocked, client accounts kept out
  of the admin area, nonce CSP present with zero CSP violations, client CRUD with validation,
  content edit reflected on the public site, settings validation, portal email-code sign-in seeing
  only the user's own account, no account creation for unknown emails.
- The bootstrap script's refusal and reset paths, run manually.

**Found and fixed during testing**

- A `SECURITY DEFINER` numbering function checked `current_user`, which is the function owner, so
  any signed-in user could draw numbers. It now authorises on the request's JWT role. The RLS test
  caught it.
- Next.js 16.4 intermittently breaks the first client-side navigation to a page whose cache was
  expired outright (`updateTag`). Content saves now use stale-while-revalidate plus immediate
  background regeneration; a regression test covers it.

**Not done yet / limitations**

- Nothing is deployed: there is no production Supabase project yet (see `docs/DEPLOYMENT.md`).
- Inviting clients to the portal, projects and invoices arrive in Phases 5–6.
- The enquiry form's service list is still fixed in code; it becomes data-driven in Phase 4.
- Case studies remain in `src/content/work.ts` until real ones exist.
