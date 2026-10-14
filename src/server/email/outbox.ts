import "server-only";
import { decideDelivery, MAX_ATTEMPTS, nextAttemptAt } from "@/domain/email/policy";
import { textToHtml } from "@/domain/email/template";
import { createSupabaseServiceClient } from "@/server/supabase/admin";
import { emailConfig } from "./config";
import { EmailProviderError, sendWithProvider } from "./providers";

/**
 * Email outbox. Every message is written to email_messages BEFORE any send is
 * attempted, keyed by an idempotency key, so:
 *   - the same logical email is never queued (or sent) twice,
 *   - a provider failure is recorded and retried, never silently lost,
 *   - business records are written independently and are never rolled back
 *     because an email failed.
 *
 * Uses the service role: delivery runs from public intake, Server Actions and
 * scheduled jobs. Callers must authorise the user first.
 */

export type QueueInput = {
  idempotencyKey: string;
  to: string;
  subject: string;
  bodyText: string;
  templateKey?: string;
  related?: { type: "lead" | "client" | "project"; id: string };
  createdBy?: string | null;
};

export type QueuedEmail = { id: string; status: string; alreadyQueued: boolean };

export async function queueEmail(input: QueueInput): Promise<QueuedEmail> {
  const db = createSupabaseServiceClient();
  const cfg = emailConfig();
  const { data, error } = await db
    .from("email_messages")
    .insert({
      idempotency_key: input.idempotencyKey,
      to_email: input.to.trim().toLowerCase(),
      from_email: cfg.from,
      reply_to: cfg.replyTo,
      subject: input.subject,
      body_text: input.bodyText,
      template_key: input.templateKey ?? null,
      related_type: input.related?.type ?? null,
      related_id: input.related?.id ?? null,
      created_by: input.createdBy ?? null,
    })
    .select("id, status")
    .single();

  if (error?.code === "23505") {
    const { data: existing } = await db
      .from("email_messages")
      .select("id, status")
      .eq("idempotency_key", input.idempotencyKey)
      .single();
    if (!existing) throw new Error("Email already queued but could not be read back");
    return { ...existing, alreadyQueued: true };
  }
  if (error || !data) throw new Error(`Could not queue email: ${error?.message}`);
  return { ...data, alreadyQueued: false };
}

export type DeliveryResult = {
  id: string;
  status: "sent" | "failed" | "suppressed" | "skipped";
  error?: string;
};

/** Attempts delivery of one message. Safe to call concurrently: the row is claimed first. */
export async function deliverEmail(id: string): Promise<DeliveryResult> {
  const db = createSupabaseServiceClient();
  const cfg = emailConfig();

  const { data: current } = await db
    .from("email_messages")
    .select("attempts")
    .eq("id", id)
    .single();
  if (!current) return { id, status: "skipped", error: "not found" };

  // Claim: only one worker can move a message from queued/failed to sending.
  const { data: claimed } = await db
    .from("email_messages")
    .update({ status: "sending", attempts: current.attempts + 1 })
    .eq("id", id)
    .eq("attempts", current.attempts)
    .in("status", ["queued", "failed"])
    .lt("attempts", MAX_ATTEMPTS)
    .select("*")
    .maybeSingle();
  if (!claimed) return { id, status: "skipped" };

  const decision = decideDelivery(claimed.to_email, cfg.mode, cfg.allowlist);
  if (!decision.send) {
    await db
      .from("email_messages")
      .update({ status: "suppressed", status_reason: decision.reason, next_attempt_at: null })
      .eq("id", id);
    return { id, status: "suppressed", error: decision.reason };
  }

  const { data: settings } = await db
    .from("business_settings")
    .select("business_name")
    .eq("id", true)
    .single();
  try {
    const result = await sendWithProvider(cfg.provider, {
      from: claimed.from_email,
      to: claimed.to_email,
      replyTo: claimed.reply_to,
      subject: claimed.subject,
      text: claimed.body_text,
      html: textToHtml(claimed.body_text, settings?.business_name ?? "Rashed"),
      idempotencyKey: claimed.idempotency_key,
    });
    await db
      .from("email_messages")
      .update({
        status: "sent",
        status_reason: null,
        provider: cfg.provider,
        provider_message_id: result.providerMessageId,
        sent_at: new Date().toISOString(),
        next_attempt_at: null,
      })
      .eq("id", id);
    return { id, status: "sent" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const permanent = err instanceof EmailProviderError && err.permanent;
    const retryAt = permanent ? null : nextAttemptAt(claimed.attempts);
    await db
      .from("email_messages")
      .update({
        status: "failed",
        status_reason: message.slice(0, 500),
        provider: cfg.provider,
        next_attempt_at: retryAt?.toISOString() ?? null,
      })
      .eq("id", id);
    console.error("email_delivery_failed", { id, message });
    return { id, status: "failed", error: message };
  }
}

/** Retries due messages and recovers ones stuck in "sending" (e.g. after a crash). */
export async function processDueEmails(limit = 25): Promise<DeliveryResult[]> {
  const db = createSupabaseServiceClient();
  const now = new Date().toISOString();
  const stuckBefore = new Date(Date.now() - 10 * 60_000).toISOString();

  await db
    .from("email_messages")
    .update({
      status: "failed",
      status_reason: "Interrupted while sending; retrying",
      next_attempt_at: now,
    })
    .eq("status", "sending")
    .lt("updated_at", stuckBefore);

  const { data } = await db
    .from("email_messages")
    .select("id")
    .or(`status.eq.queued,and(status.eq.failed,next_attempt_at.lte.${now})`)
    .lt("attempts", MAX_ATTEMPTS)
    .order("created_at")
    .limit(limit);

  const results: DeliveryResult[] = [];
  for (const row of data ?? []) results.push(await deliverEmail(row.id));
  return results;
}
