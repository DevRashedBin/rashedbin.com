import "server-only";

export type TurnstileResult = { ok: true; skipped?: boolean } | { ok: false };

/** Whether Turnstile is required for this deployment. */
export function turnstileEnabled(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY);
}

/**
 * Verifies a Cloudflare Turnstile token server-side. When no secret is
 * configured (local development and tests) verification is skipped; production
 * must set TURNSTILE_SECRET_KEY (see docs/DEPLOYMENT.md).
 */
export async function verifyTurnstile(
  token: string | undefined,
  ip: string | null,
): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: true, skipped: true };
  if (!token) return { ok: false };
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip) body.set("remoteip", ip);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
      signal: AbortSignal.timeout(8_000),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success ? { ok: true } : { ok: false };
  } catch {
    return { ok: false };
  }
}
