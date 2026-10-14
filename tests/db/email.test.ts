import { createHmac, randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { POST as resendWebhook } from "@/app/api/webhooks/resend/route";
import { deliverEmail, processDueEmails, queueEmail } from "@/server/email/outbox";
import { serviceClient } from "../helpers/supabase";

/** Outbox behaviour against the local database and Mailpit inbox. */

const svc = serviceClient();
const originalEnv = { ...process.env };
afterEach(() => {
  process.env = { ...originalEnv };
});

function useMailpit(mode: "live" | "log" | "allowlist" = "live", allowlist = "") {
  process.env.EMAIL_PROVIDER = "mailpit";
  process.env.EMAIL_MODE = mode;
  process.env.EMAIL_ALLOWLIST = allowlist;
  process.env.MAILPIT_URL = originalEnv.MAILPIT_URL;
}

async function mailpitCount(to: string): Promise<number> {
  const res = await fetch(
    `${process.env.MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:${to}`)}`,
  );
  return ((await res.json()) as { messages_count?: number }).messages_count ?? 0;
}

const message = (to: string) => ({
  idempotencyKey: `test:${randomUUID()}`,
  to,
  subject: "Hello",
  bodyText: "Hi there,\n\nThis is a test.",
});

describe("email outbox", () => {
  it("queues once, sends once, and records the result", async () => {
    useMailpit();
    const to = `outbox-${randomUUID().slice(0, 8)}@example.test`;
    const input = message(to);
    const first = await queueEmail(input);
    const again = await queueEmail(input);
    expect(again).toMatchObject({ id: first.id, alreadyQueued: true });

    const results = await Promise.all([
      deliverEmail(first.id),
      deliverEmail(first.id),
      deliverEmail(first.id),
    ]);
    expect(results.filter((r) => r.status === "sent")).toHaveLength(1);

    const { data } = await svc.from("email_messages").select("*").eq("id", first.id).single();
    expect(data).toMatchObject({
      status: "sent",
      provider: "mailpit",
      delivery_status: "unknown",
      attempts: 1,
    });
    expect(data!.sent_at).not.toBeNull();
    await expect.poll(() => mailpitCount(to)).toBe(1);
  });

  it("records provider failures for retry without throwing", async () => {
    process.env.EMAIL_PROVIDER = "mailpit";
    process.env.EMAIL_MODE = "live";
    process.env.MAILPIT_URL = "http://127.0.0.1:9"; // nothing listens here
    const q = await queueEmail(message(`fail-${randomUUID().slice(0, 8)}@example.test`));
    const r = await deliverEmail(q.id);
    expect(r.status).toBe("failed");
    const { data } = await svc
      .from("email_messages")
      .select("status, status_reason, next_attempt_at, attempts")
      .eq("id", q.id)
      .single();
    expect(data!.status).toBe("failed");
    expect(data!.status_reason).toBeTruthy();
    expect(data!.next_attempt_at).not.toBeNull();

    // Retried later by the scheduled job once the provider is back.
    useMailpit();
    await svc
      .from("email_messages")
      .update({ next_attempt_at: new Date(Date.now() - 1000).toISOString() })
      .eq("id", q.id);
    const retried = await processDueEmails(100);
    expect(retried.find((x) => x.id === q.id)?.status).toBe("sent");
  });

  it("marks permanent failures as not retryable", async () => {
    process.env.EMAIL_PROVIDER = "resend";
    process.env.EMAIL_MODE = "live";
    delete process.env.RESEND_API_KEY;
    const q = await queueEmail(message(`perm-${randomUUID().slice(0, 8)}@example.test`));
    expect((await deliverEmail(q.id)).status).toBe("failed");
    const { data } = await svc
      .from("email_messages")
      .select("next_attempt_at, status_reason")
      .eq("id", q.id)
      .single();
    expect(data!.next_attempt_at).toBeNull();
    expect(data!.status_reason).toContain("RESEND_API_KEY");
  });

  it("never sends in log mode, and only to allowlisted recipients in allowlist mode", async () => {
    useMailpit("log");
    const blocked = `blocked-${randomUUID().slice(0, 8)}@example.test`;
    const q = await queueEmail(message(blocked));
    expect((await deliverEmail(q.id)).status).toBe("suppressed");

    useMailpit("allowlist", "@allowed.test");
    const q2 = await queueEmail(message(`x-${randomUUID().slice(0, 8)}@example.test`));
    expect((await deliverEmail(q2.id)).status).toBe("suppressed");
    const allowed = `ok-${randomUUID().slice(0, 8)}@allowed.test`;
    const q3 = await queueEmail(message(allowed));
    expect((await deliverEmail(q3.id)).status).toBe("sent");
    expect(await mailpitCount(blocked)).toBe(0);
  });
});

describe("Resend webhook", () => {
  const rawSecret = "webhook-test-secret";
  const secret = `whsec_${Buffer.from(rawSecret).toString("base64")}`;

  function signedRequest(body: object, id = `msg_${randomUUID()}`) {
    const ts = String(Math.floor(Date.now() / 1000));
    const text = JSON.stringify(body);
    const sig = createHmac("sha256", Buffer.from(rawSecret))
      .update(`${id}.${ts}.${text}`)
      .digest("base64");
    return new Request("http://localhost/api/webhooks/resend", {
      method: "POST",
      body: text,
      headers: { "svix-id": id, "svix-timestamp": ts, "svix-signature": `v1,${sig}` },
    });
  }

  it("updates delivery status from verified events, once", async () => {
    process.env.RESEND_WEBHOOK_SECRET = secret;
    const providerId = `re_${randomUUID()}`;
    const q = await queueEmail(message(`hook-${randomUUID().slice(0, 8)}@example.test`));
    await svc
      .from("email_messages")
      .update({ status: "sent", provider: "resend", provider_message_id: providerId })
      .eq("id", q.id);

    const req = signedRequest(
      { type: "email.delivered", data: { email_id: providerId } },
      "evt_fixed_" + q.id,
    );
    expect((await resendWebhook(req)).status).toBe(200);
    const dup = await resendWebhook(
      signedRequest(
        { type: "email.delivered", data: { email_id: providerId } },
        "evt_fixed_" + q.id,
      ),
    );
    expect(await dup.json()).toMatchObject({ duplicate: true });

    const { data } = await svc
      .from("email_messages")
      .select("delivery_status")
      .eq("id", q.id)
      .single();
    expect(data!.delivery_status).toBe("delivered");

    // A late "delayed" event cannot downgrade "delivered".
    await resendWebhook(
      signedRequest({ type: "email.delivery_delayed", data: { email_id: providerId } }),
    );
    const { data: after } = await svc
      .from("email_messages")
      .select("delivery_status")
      .eq("id", q.id)
      .single();
    expect(after!.delivery_status).toBe("delivered");
  });

  it("rejects unsigned or tampered requests", async () => {
    process.env.RESEND_WEBHOOK_SECRET = secret;
    const res = await resendWebhook(
      new Request("http://localhost/api/webhooks/resend", {
        method: "POST",
        body: JSON.stringify({ type: "email.delivered" }),
        headers: {
          "svix-id": "x",
          "svix-timestamp": String(Math.floor(Date.now() / 1000)),
          "svix-signature": "v1,AAAA",
        },
      }),
    );
    expect(res.status).toBe(401);
  });
});
