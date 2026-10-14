/**
 * Development safety for outgoing email.
 *   log       — nothing is sent; messages are recorded as "suppressed".
 *   allowlist — only listed addresses or domains (e.g. "@example.test") receive mail.
 *   live      — everything is sent. Required explicitly in production.
 */
export type EmailMode = "log" | "allowlist" | "live";

export type DeliveryDecision = { send: true } | { send: false; reason: string };

export function parseEmailMode(value: string | undefined): EmailMode {
  return value === "live" || value === "allowlist" ? value : "log";
}

export function decideDelivery(to: string, mode: EmailMode, allowlist: string[]): DeliveryDecision {
  if (mode === "live") return { send: true };
  if (mode === "log")
    return { send: false, reason: "EMAIL_MODE=log: not sent (development safety)" };
  const addr = to.trim().toLowerCase();
  const allowed = allowlist
    .map((a) => a.trim().toLowerCase())
    .filter(Boolean)
    .some((a) => (a.startsWith("@") ? addr.endsWith(a) : addr === a));
  return allowed
    ? { send: true }
    : { send: false, reason: "EMAIL_MODE=allowlist: recipient not on the allowlist" };
}

/** Exponential backoff for failed sends: 2, 4, 8, 16 minutes; give up after 5 attempts. */
export const MAX_ATTEMPTS = 5;

export function nextAttemptAt(attempts: number, now = new Date()): Date | null {
  if (attempts >= MAX_ATTEMPTS) return null;
  return new Date(now.getTime() + 2 ** attempts * 60_000);
}
