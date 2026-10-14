# Deployment

Target: **Vercel** (Pro plan — commercial use and cron jobs) with Supabase Pro (Phase 3+).

## Environments

| Environment            | `NEXT_PUBLIC_ALLOW_INDEXING` | Notes                                      |
| ---------------------- | ---------------------------- | ------------------------------------------ |
| Local                  | `false`                      | `.env.local`                               |
| Preview (every branch) | `false`                      | Site-wide `noindex` + `Disallow: /` robots |
| Production             | `true`                       | Only once Phase 4 is complete              |

Set `NEXT_PUBLIC_SITE_URL` to the canonical origin (`https://rashedbin.com`) in production.

## Supabase production project (one-time setup)

1. Create a project on the **Pro** plan in **London (eu-west-2)**.
2. Authentication → Settings:
   - Disable "Allow new users to sign up".
   - Minimum password length 12, require lower/upper case letters and digits.
   - Enable "Secure password change".
   - Enable TOTP multi-factor authentication.
   - Site URL `https://rashedbin.com`; redirect URLs for the production and preview domains.
3. Authentication → Email templates → **Magic link**: use the content of
   `supabase/templates/magic-link.html` (the portal signs in with the `{{ .Token }}` code).
4. Configure custom SMTP (Resend) before launch — the built-in sender is heavily rate-limited.
5. Apply migrations from your machine:
   ```bash
   npx supabase link --project-ref <project-ref>
   npx supabase db push
   ```
6. In Vercel, set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and
   `SUPABASE_SECRET_KEY` (Production and Preview; use a separate Supabase project for previews if
   previews should not touch live data).
7. Create the admin from your machine with production credentials in `.env.local`:
   `pnpm admin:bootstrap --email you@yourdomain.com`, then sign in at `/admin/login` and enrol your
   authenticator app. Store the setup key somewhere safe; if the device is lost, run the script
   with `--reset-mfa`.

## Email (Resend) — hello@rashedbin.com

1. Create a Resend account and add the domain **rashedbin.com**. Add the DNS records Resend shows
   (SPF/MX and DKIM) at your DNS host, plus a DMARC record, e.g.
   `_dmarc.rashedbin.com TXT "v=DMARC1; p=quarantine; rua=mailto:hello@rashedbin.com"`.
   Wait until Resend shows the domain as verified.
2. Make sure **hello@rashedbin.com** can receive mail (your mailbox provider's MX records) — it is
   the reply-to address and receives new-enquiry alerts.
3. Create an API key (sending access only) → `RESEND_API_KEY`.
4. Add a webhook to `https://rashedbin.com/api/webhooks/resend` for delivered, delivery delayed,
   bounced and complained events → copy its signing secret to `RESEND_WEBHOOK_SECRET`.
5. Production env: `EMAIL_PROVIDER=resend`, `EMAIL_MODE=live`,
   `EMAIL_FROM="Rashed <hello@rashedbin.com>"`, `EMAIL_REPLY_TO=hello@rashedbin.com`,
   `APP_URL=https://rashedbin.com`. Preview deployments: `EMAIL_MODE=allowlist` with your own address.
6. In Supabase → Authentication → SMTP, use Resend's SMTP details so portal sign-in codes come from
   the same domain.

## Abuse protection and jobs

- Cloudflare Turnstile: create a widget for rashedbin.com → `NEXT_PUBLIC_TURNSTILE_SITE_KEY`,
  `TURNSTILE_SECRET_KEY`. Without them the check is skipped (development only).
- `IP_HASH_SALT`: a long random secret (e.g. `openssl rand -hex 32`).
- `CRON_SECRET`: a long random secret; Vercel sends it to the cron routes automatically. Cron jobs
  in `vercel.json` need the Vercel Pro plan.

The build reads published services from the database, so the deployment needs these variables at
build time.

## Security headers

`next.config.ts` sets CSP, HSTS, `X-Frame-Options: DENY`, `nosniff`, Referrer-Policy and
Permissions-Policy on every route, and `X-Robots-Tag: noindex` on `/admin`, `/portal`, `/login`,
`/auth` and `/api`. The public CSP allows inline scripts because the static pages can't carry
per-request nonces. The admin, portal and auth routes are rendered per request and get a strict
nonce-based CSP from `src/proxy.ts` (`'strict-dynamic'`, no inline scripts).

## Launch checklist (Phase 7)

- [ ] All phases complete; `pnpm check` and `pnpm test:e2e` green in CI
- [ ] Existing site URLs (if any) mapped to 301 redirects
- [ ] Production env vars set; `NEXT_PUBLIC_ALLOW_INDEXING=true`
- [ ] Email domain SPF, DKIM, DMARC verified; `EMAIL_MODE=live`
- [ ] Structured data validated (Rich Results Test); Lighthouse reviewed on key pages
- [ ] Search Console verified by DNS; sitemap submitted
- [ ] Backup restore tested once
