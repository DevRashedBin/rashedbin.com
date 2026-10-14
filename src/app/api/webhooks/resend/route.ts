import { verifySvixSignature } from "@/domain/email/webhook-signature";
import { createSupabaseServiceClient } from "@/server/supabase/admin";

/**
 * Resend delivery events. Signatures are verified before anything is read,
 * and each event id is stored once, so retried deliveries are harmless.
 * Only verified events change an email's delivery status.
 */
const STATUS_BY_EVENT: Record<string, "delivered" | "delayed" | "bounced" | "complained"> = {
  "email.delivered": "delivered",
  "email.delivery_delayed": "delayed",
  "email.bounced": "bounced",
  "email.complained": "complained",
};

// A later, more definite status must not be overwritten by an earlier one.
const RANK = { unknown: 0, delayed: 1, delivered: 2, bounced: 3, complained: 4 } as const;

export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return new Response("Webhook not configured", { status: 503 });

  const body = await request.text();
  const ok = verifySvixSignature(
    body,
    {
      id: request.headers.get("svix-id"),
      timestamp: request.headers.get("svix-timestamp"),
      signature: request.headers.get("svix-signature"),
    },
    secret,
  );
  if (!ok) return new Response("Invalid signature", { status: 401 });

  let event: { type?: string; data?: { email_id?: string } };
  try {
    event = JSON.parse(body);
  } catch {
    return new Response("Bad payload", { status: 400 });
  }

  const db = createSupabaseServiceClient();
  const providerMessageId = event.data?.email_id ?? null;
  const { data: message } = providerMessageId
    ? await db
        .from("email_messages")
        .select("id, delivery_status")
        .eq("provider_message_id", providerMessageId)
        .maybeSingle()
    : { data: null };

  const { error } = await db.from("email_events").insert({
    provider_event_id: request.headers.get("svix-id")!,
    email_message_id: message?.id ?? null,
    type: event.type ?? "unknown",
    payload: event,
  });
  if (error?.code === "23505") return Response.json({ ok: true, duplicate: true });
  if (error) return new Response("Could not record event", { status: 500 });

  const next = event.type ? STATUS_BY_EVENT[event.type] : undefined;
  if (message && next && RANK[next] >= RANK[message.delivery_status as keyof typeof RANK]) {
    await db.from("email_messages").update({ delivery_status: next }).eq("id", message.id);
  }
  return Response.json({ ok: true });
}
