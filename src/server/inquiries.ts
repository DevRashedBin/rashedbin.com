import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { after } from "next/server";
import type { Inquiry, InquiryDraft } from "@/domain/inquiry/schema";
import { BUDGET_LABELS, TIMELINE_OPTIONS } from "@/domain/inquiry/schema";
import { site } from "@/content/site";
import { appOrigin } from "./email/config";
import { deliverEmail, queueEmail } from "./email/outbox";
import {
  adminLeadLink,
  baseTemplateValues,
  leadTemplateValues,
  renderStoredTemplate,
} from "./email/templates";
import { createSupabaseServiceClient } from "./supabase/admin";

export type SubmitInquiryResult =
  | { status: "created" | "completed" | "duplicate"; leadId: string; reference: string }
  | { status: "unavailable" };

export type RequestMeta = {
  idempotencyKey: string;
  ipHash: string | null;
  userAgent: string | null;
};

export function isInquiryStorageConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Service-specific answers kept with the lead. */
function detailsOf(i: Partial<Inquiry & InquiryDraft>) {
  return Object.fromEntries(
    Object.entries({
      platform: i.platform,
      urgency: i.urgency,
      storeStage: i.storeStage,
      currency: i.currency,
      budget: i.budget,
      timeline: i.timeline,
    }).filter(([, v]) => v !== undefined && v !== ""),
  );
}

/**
 * Stores a validated inquiry as a CRM lead (one database transaction), then
 * queues the acknowledgement and the admin alert. Emails are delivered after
 * the response is sent; a failed email is logged and retried, and never undoes
 * the lead.
 */
export async function submitInquiry(
  inquiry: Inquiry,
  serviceLabel: string,
  meta: RequestMeta & { resumeToken?: string },
): Promise<SubmitInquiryResult> {
  if (!isInquiryStorageConfigured()) return { status: "unavailable" };
  const db = createSupabaseServiceClient();
  const { data, error } = await db.rpc("submit_inquiry", {
    p_idempotency_key: meta.idempotencyKey,
    p_name: inquiry.name,
    p_email: inquiry.email,
    p_company: inquiry.company,
    p_website_url: inquiry.websiteUrl,
    p_service_slug: inquiry.service,
    p_service_label: serviceLabel,
    p_description: inquiry.description,
    p_details: detailsOf(inquiry),
    p_notice_version: site.privacyNoticeVersion,
    p_ip_hash: meta.ipHash ?? undefined,
    p_user_agent: meta.userAgent?.slice(0, 500),
    p_resume_token_hash: meta.resumeToken ? hashToken(meta.resumeToken) : undefined,
  });
  // A concurrent identical submission loses the unique-key race: treat as duplicate.
  if (error?.code === "23505") {
    const { data: existing } = await db
      .from("leads")
      .select("id, ref")
      .eq("idempotency_key", meta.idempotencyKey)
      .single();
    if (existing) return { status: "duplicate", leadId: existing.id, reference: existing.ref };
  }
  if (error || !data?.[0]) throw new Error(`submit_inquiry failed: ${error?.message}`);
  const row = data[0];
  const status = row.outcome as "created" | "completed" | "duplicate";

  if (status !== "duplicate") {
    after(() => sendInquiryNotifications(row.lead_id));
  }
  return { status, leadId: row.lead_id, reference: row.lead_ref };
}

async function sendInquiryNotifications(leadId: string) {
  try {
    const db = createSupabaseServiceClient();
    const [{ data: lead }, base, { data: settings }] = await Promise.all([
      db.from("leads").select("*").eq("id", leadId).single(),
      baseTemplateValues(),
      db.from("business_settings").select("notification_email").eq("id", true).single(),
    ]);
    if (!lead) return;
    const values = {
      ...base,
      ...leadTemplateValues(lead),
      admin_lead_link: adminLeadLink(lead.id),
      lead_summary: summarise(lead),
    };
    const queued = [];

    const ack = await renderStoredTemplate("inquiry_acknowledgement", values);
    queued.push(
      await queueEmail({
        idempotencyKey: `inquiry-ack:${lead.id}`,
        to: lead.email,
        subject: ack.subject,
        bodyText: ack.body,
        templateKey: "inquiry_acknowledgement",
        related: { type: "lead", id: lead.id },
      }),
    );
    if (settings?.notification_email) {
      const alert = await renderStoredTemplate("inquiry_admin_alert", values);
      queued.push(
        await queueEmail({
          idempotencyKey: `inquiry-alert:${lead.id}`,
          to: settings.notification_email,
          subject: alert.subject,
          bodyText: alert.body,
          templateKey: "inquiry_admin_alert",
          related: { type: "lead", id: lead.id },
        }),
      );
    }
    for (const q of queued) if (!q.alreadyQueued) await deliverEmail(q.id);
  } catch (err) {
    // The lead is safe; queued emails are retried by the scheduled job.
    console.error("inquiry_notification_failed", { leadId, err });
  }
}

function summarise(lead: {
  ref: string;
  name: string;
  email: string;
  company: string | null;
  website_url: string | null;
  service_label: string | null;
  description: string;
  details: unknown;
}): string {
  const d = (lead.details ?? {}) as Record<string, string>;
  const currency = (d.currency ?? "USD") as keyof typeof BUDGET_LABELS;
  const budget =
    d.budget && d.budget !== "not-sure"
      ? `${currency} ${BUDGET_LABELS[currency]?.[d.budget as keyof (typeof BUDGET_LABELS)["USD"]] ?? d.budget}`
      : "Not sure yet";
  const timeline = TIMELINE_OPTIONS.find((t) => t.value === d.timeline)?.label ?? d.timeline ?? "—";
  return [
    `Reference: ${lead.ref}`,
    `Name: ${lead.name}`,
    `Email: ${lead.email}`,
    lead.company ? `Company: ${lead.company}` : null,
    lead.website_url ? `Website: ${lead.website_url}` : null,
    `Service: ${lead.service_label ?? "Not sure yet"}`,
    `Budget: ${budget}`,
    `Timeline: ${timeline}`,
    "",
    lead.description,
  ]
    .filter((l) => l !== null)
    .join("\n");
}

// ── Save and finish later ─────────────────────────────────────────────────

const RESUME_TTL_DAYS = 14;

export type SaveDraftResult = { status: "saved" | "already_submitted" } | { status: "unavailable" };

/**
 * Stores an unfinished inquiry ONLY after the visitor chose to save it and
 * consented, then emails a single-use link to finish it.
 */
export async function saveInquiryDraft(
  draft: InquiryDraft,
  serviceLabel: string | null,
  meta: RequestMeta,
): Promise<SaveDraftResult> {
  if (!isInquiryStorageConfigured()) return { status: "unavailable" };
  const token = randomBytes(32).toString("base64url");
  const db = createSupabaseServiceClient();
  const { data, error } = await db.rpc("save_inquiry_draft", {
    p_idempotency_key: meta.idempotencyKey,
    p_name: draft.name,
    p_email: draft.email,
    p_company: draft.company,
    p_website_url: draft.websiteUrl,
    p_service_slug: draft.service,
    p_service_label: serviceLabel ?? undefined,
    p_description: draft.description ?? "",
    p_details: detailsOf(draft),
    p_notice_version: site.privacyNoticeVersion,
    p_ip_hash: meta.ipHash ?? undefined,
    p_user_agent: meta.userAgent?.slice(0, 500),
    p_token_hash: hashToken(token),
    p_token_expires_at: new Date(Date.now() + RESUME_TTL_DAYS * 86_400_000).toISOString(),
  });
  if (error || !data?.[0]) throw new Error(`save_inquiry_draft failed: ${error?.message}`);
  const row = data[0];
  if (row.outcome === "already_submitted") return { status: "already_submitted" };

  const base = await baseTemplateValues();
  const rendered = await renderStoredTemplate("inquiry_resume_link", {
    ...base,
    ...leadTemplateValues({ name: draft.name, ref: row.lead_ref, service_label: serviceLabel }),
    resume_link: `${appOrigin()}/start-a-project/resume/${token}`,
  });
  const queued = await queueEmail({
    idempotencyKey: `resume:${row.lead_id}:${hashToken(token).slice(0, 16)}`,
    to: draft.email,
    subject: rendered.subject,
    bodyText: rendered.body,
    templateKey: "inquiry_resume_link",
    related: { type: "lead", id: row.lead_id },
  });
  after(() => deliverEmail(queued.id).catch((e) => console.error("resume_email_failed", e)));
  return { status: "saved" };
}

/** Loads a saved draft for its resume link, if the link is valid and unused. */
export async function loadDraftByToken(token: string) {
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(token)) return null;
  const db = createSupabaseServiceClient();
  const { data: t } = await db
    .from("inquiry_resume_tokens")
    .select("lead_id, expires_at, used_at")
    .eq("token_hash", hashToken(token))
    .maybeSingle();
  if (!t || t.used_at || new Date(t.expires_at) < new Date()) return null;
  const { data: lead } = await db
    .from("leads")
    .select("name, email, company, website_url, service_slug, description, details, submitted_at")
    .eq("id", t.lead_id)
    .single();
  if (!lead || lead.submitted_at) return null;
  return lead;
}
