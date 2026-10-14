<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project rules

- Read `docs/ARCHITECTURE.md` and `docs/ROADMAP.md` before starting work.
- Never invent client results, testimonials, metrics, credentials or business details.
- Money is integer minor units; never use floating point for amounts.
- Local database: `pnpm db:start` (Docker). After changing `supabase/migrations`, run
  `pnpm db:reset && pnpm db:types`. Never edit a migration that has been applied in production;
  add a new one.
- Every protected page or Server Action must call a guard from `src/server/auth.ts`; RLS is the
  backstop, not the only check. Add an RLS test in `tests/db` for every new table.
- Run `pnpm check`, `pnpm test:db` and `pnpm test:e2e` (after `pnpm build`) before pushing.
