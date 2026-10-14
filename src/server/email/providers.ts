import "server-only";

export type OutgoingEmail = {
  from: string;
  to: string;
  replyTo?: string | null;
  subject: string;
  text: string;
  html: string;
  idempotencyKey: string;
};

export type SendResult = { providerMessageId: string };

export class EmailProviderError extends Error {
  constructor(
    message: string,
    /** Retrying cannot help (e.g. invalid recipient, bad request). */
    readonly permanent: boolean,
  ) {
    super(message);
  }
}

/** Resend HTTP API. The idempotency key stops duplicate sends on retries. */
async function sendWithResend(email: OutgoingEmail): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new EmailProviderError("RESEND_API_KEY is not set", true);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "Idempotency-Key": email.idempotencyKey.slice(0, 256),
    },
    body: JSON.stringify({
      from: email.from,
      to: [email.to],
      reply_to: email.replyTo ?? undefined,
      subject: email.subject,
      text: email.text,
      html: email.html,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  const body = (await res.json().catch(() => ({}))) as {
    id?: string;
    message?: string;
    name?: string;
  };
  if (!res.ok || !body.id) {
    const permanent = res.status >= 400 && res.status < 500 && res.status !== 429;
    throw new EmailProviderError(
      `Resend ${res.status}: ${body.message ?? body.name ?? "unknown error"}`,
      permanent,
    );
  }
  return { providerMessageId: body.id };
}

/** Local development inbox (Mailpit, started with `pnpm db:start`). Nothing leaves the machine. */
async function sendWithMailpit(email: OutgoingEmail): Promise<SendResult> {
  const base = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";
  const parse = (addr: string) => {
    const m = addr.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
    return m ? { Name: m[1].replace(/^"|"$/g, ""), Email: m[2] } : { Email: addr.trim() };
  };
  const res = await fetch(`${base}/api/v1/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      From: parse(email.from),
      To: [parse(email.to)],
      ReplyTo: email.replyTo ? [parse(email.replyTo)] : [],
      Subject: email.subject,
      Text: email.text,
      HTML: email.html,
      Headers: { "X-Idempotency-Key": email.idempotencyKey },
    }),
    signal: AbortSignal.timeout(10_000),
  });
  const body = (await res.json().catch(() => ({}))) as { ID?: string };
  if (!res.ok || !body.ID) throw new EmailProviderError(`Mailpit ${res.status}`, false);
  return { providerMessageId: `mailpit:${body.ID}` };
}

export function sendWithProvider(
  provider: "resend" | "mailpit",
  email: OutgoingEmail,
): Promise<SendResult> {
  return provider === "mailpit" ? sendWithMailpit(email) : sendWithResend(email);
}
