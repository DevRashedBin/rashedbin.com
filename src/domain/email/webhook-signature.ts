import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verifies a Svix-signed webhook (the scheme Resend uses).
 * Signed content: `${id}.${timestamp}.${body}`, HMAC-SHA256 with the
 * base64-decoded secret (after the "whsec_" prefix). Rejects timestamps more
 * than 5 minutes from now to prevent replays.
 */
export function verifySvixSignature(
  body: string,
  headers: { id: string | null; timestamp: string | null; signature: string | null },
  secret: string,
  now: number = Date.now(),
): boolean {
  const { id, timestamp, signature } = headers;
  if (!id || !timestamp || !signature || !secret.startsWith("whsec_")) return false;
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(now / 1000 - ts) > 300) return false;

  const key = Buffer.from(secret.slice("whsec_".length), "base64");
  const expected = createHmac("sha256", key).update(`${id}.${timestamp}.${body}`).digest();

  return signature.split(" ").some((part) => {
    const [version, sig] = part.split(",");
    if (version !== "v1" || !sig) return false;
    const given = Buffer.from(sig, "base64");
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}
