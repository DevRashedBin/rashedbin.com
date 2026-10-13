# Deployment

Target: **Vercel** (Pro plan — commercial use and cron jobs) with Supabase Pro (Phase 3+).

## Environments

| Environment            | `NEXT_PUBLIC_ALLOW_INDEXING` | Notes                                      |
| ---------------------- | ---------------------------- | ------------------------------------------ |
| Local                  | `false`                      | `.env.local`                               |
| Preview (every branch) | `false`                      | Site-wide `noindex` + `Disallow: /` robots |
| Production             | `true`                       | Only once Phase 4 is complete              |

Set `NEXT_PUBLIC_SITE_URL` to the canonical origin (`https://rashedbin.com`) in production.

## Security headers

`next.config.ts` sets CSP, HSTS, `X-Frame-Options: DENY`, `nosniff`, Referrer-Policy and
Permissions-Policy on every route, and `X-Robots-Tag: noindex` on `/admin`, `/portal`, `/login`,
`/auth` and `/api`. The public CSP allows inline scripts because the static pages can't carry
per-request nonces; the dynamically rendered admin and portal will get a nonce-based CSP in Phase 3.

## Launch checklist (Phase 7)

- [ ] All phases complete; `pnpm check` and `pnpm test:e2e` green in CI
- [ ] Existing site URLs (if any) mapped to 301 redirects
- [ ] Production env vars set; `NEXT_PUBLIC_ALLOW_INDEXING=true`
- [ ] Email domain SPF, DKIM, DMARC verified; `EMAIL_MODE=live`
- [ ] Structured data validated (Rich Results Test); Lighthouse reviewed on key pages
- [ ] Search Console verified by DNS; sitemap submitted
- [ ] Backup restore tested once
