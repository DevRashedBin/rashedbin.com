import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Request proxy (formerly middleware). Three jobs:
 *  1. Return a real 404 for unknown service slugs before rendering starts, so
 *     Partial Prerendering cannot stream a "soft 404" with status 200.
 *  2. Refresh Supabase auth cookies for the admin dashboard and client portal.
 *  3. Apply a per-request nonce Content-Security-Policy to those private,
 *     dynamically rendered areas.
 *
 * This is NOT authorisation. Every protected page and action re-checks the
 * session in the Data Access Layer (src/server/auth.ts) and the database
 * enforces Row Level Security.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// ── Service slug validation ─────────────────────────────────────────────────

const SLUG_TTL_MS = 60_000;
let slugCache: { slugs: Set<string>; expires: number } | null = null;

async function publishedServiceSlugs(): Promise<Set<string> | null> {
  if (slugCache && slugCache.expires > Date.now()) return slugCache.slugs;
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/services?select=slug&published=eq.true`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      signal: AbortSignal.timeout(2_000),
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as { slug: string }[];
    slugCache = { slugs: new Set(rows.map((r) => r.slug)), expires: Date.now() + SLUG_TTL_MS };
    return slugCache.slugs;
  } catch {
    // If the lookup fails, let the page decide (it calls notFound()).
    return null;
  }
}

// ── Private areas ───────────────────────────────────────────────────────────

function privateCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV !== "production";
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // Inline style attributes are used by components; scripts stay nonce-only.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src 'self'${SUPABASE_URL ? ` ${SUPABASE_URL}` : ""}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

async function handlePrivate(request: NextRequest): Promise<NextResponse> {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = privateCsp(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  let response = NextResponse.next({ request: { headers: requestHeaders } });

  if (SUPABASE_URL && SUPABASE_KEY) {
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet, headers) => {
          for (const { name, value } of toSet) request.cookies.set(name, value);
          response = NextResponse.next({ request: { headers: requestHeaders } });
          for (const { name, value, options } of toSet) response.cookies.set(name, value, options);
          for (const [key, value] of Object.entries(headers ?? {}))
            response.headers.set(key, value);
        },
      },
    });
    // Refreshes an expiring session and writes the new cookies to the response.
    await supabase.auth.getClaims();
  }

  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/services/")) {
    const slug = pathname.split("/")[2];
    const slugs = await publishedServiceSlugs();
    if (slug && slugs && !slugs.has(slug)) {
      return NextResponse.rewrite(new URL("/__not-found", request.url));
    }
    return NextResponse.next();
  }

  return handlePrivate(request);
}

export const config = {
  matcher: ["/services/:slug", "/admin/:path*", "/portal/:path*", "/auth/:path*"],
};
