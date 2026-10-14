import "server-only";
import { createHash } from "node:crypto";
import { createSupabaseServiceClient } from "./supabase/admin";

/**
 * First client IP from proxy headers (Vercel sets x-forwarded-for). Loopback
 * addresses are treated as unknown: they only occur when the server is called
 * from the same machine (local development and tests), never for real visitors.
 */
export function clientIp(headers: Headers): string | null {
  const ip =
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || null;
  if (!ip || /^(127\.|::1$|::ffff:127\.)/.test(ip)) return null;
  return ip;
}

/**
 * Salted one-way hash of the IP, so abuse can be limited without storing raw
 * addresses. IP_HASH_SALT must be set (and kept secret) in production.
 */
export function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  const salt = process.env.IP_HASH_SALT ?? "development-only-salt";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

/** True while within the limit. Fails open only if the database is unreachable. */
export async function withinRateLimit(
  bucket: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  const { data, error } = await createSupabaseServiceClient().rpc("check_rate_limit", {
    p_bucket: bucket,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    console.error("rate_limit_check_failed", error.message);
    return true;
  }
  return data === true;
}
