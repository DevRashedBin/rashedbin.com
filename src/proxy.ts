import { NextResponse, type NextRequest } from "next/server";
import { getServices } from "@/content/services";

const serviceSlugs = new Set(getServices().map((s) => s.slug));

/**
 * Rejects unknown service slugs before rendering starts. With Partial
 * Prerendering, an unknown slug would otherwise stream the static shell with a
 * 200 status before `notFound()` runs — a "soft 404" that search engines
 * penalise. Rewriting to an unmatched path renders the not-found page with a
 * real 404 status.
 *
 * Phase 3 extends this file with session refresh for /admin and /portal.
 */
export function proxy(request: NextRequest) {
  const slug = request.nextUrl.pathname.split("/")[2];
  if (slug && !serviceSlugs.has(slug)) {
    return NextResponse.rewrite(new URL("/__not-found", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/services/:slug",
};
