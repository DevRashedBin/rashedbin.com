"use server";

import { headers } from "next/headers";
import { z } from "zod";
import {
  draftSchema,
  inquirySchema,
  normaliseWebsiteUrl,
  NOT_SURE,
  toFieldErrors,
  type FieldErrors,
} from "@/domain/inquiry/schema";
import { clientIp, hashIp, withinRateLimit } from "@/server/abuse";
import { getServices } from "@/server/content";
import { saveInquiryDraft, submitInquiry } from "@/server/inquiries";
import { verifyTurnstile } from "@/server/turnstile";

export type InquiryActionState =
  | { status: "idle" }
  | { status: "invalid"; errors: FieldErrors }
  | { status: "success"; reference: string }
  | { status: "unavailable" }
  | { status: "rate_limited" }
  | { status: "verification_failed" }
  | { status: "error" };

/** Submissions completed faster than this are almost certainly automated. */
const MIN_FILL_MS = 4_000;

const envelope = z.object({
  idempotencyKey: z.uuid(),
  startedAt: z.number().int().positive(),
  /** Honeypot: hidden from people, often filled in by bots. */
  hp: z.string().max(0).optional().or(z.literal("")),
  turnstileToken: z.string().max(4096).optional(),
  resumeToken: z.string().max(200).optional(),
  data: z.record(z.string(), z.unknown()),
});

async function serviceLabelFor(slug: string | undefined): Promise<string | null | undefined> {
  if (!slug) return null;
  if (slug === NOT_SURE) return "Not sure yet";
  return (await getServices()).find((s) => s.slug === slug)?.name; // undefined = not a published service
}

async function requestContext() {
  const h = await headers();
  const ip = clientIp(h);
  return { ipHash: hashIp(ip), ip, userAgent: h.get("user-agent") };
}

export async function submitInquiryAction(payload: unknown): Promise<InquiryActionState> {
  const parsedEnvelope = envelope.safeParse(payload);
  if (!parsedEnvelope.success) return { status: "error" };
  const { idempotencyKey, startedAt, hp, data, turnstileToken, resumeToken } = parsedEnvelope.data;

  // Bot heuristics: respond as if successful without storing anything, so
  // automated submitters get no signal to adapt to.
  if (hp || Date.now() - startedAt < MIN_FILL_MS) {
    return { status: "success", reference: "received" };
  }

  const parsed = inquirySchema.safeParse(data);
  if (!parsed.success) return { status: "invalid", errors: toFieldErrors(parsed.error) };
  const serviceLabel = await serviceLabelFor(parsed.data.service);
  if (!serviceLabel)
    return {
      status: "invalid",
      errors: { service: "Choose the option closest to what you need." },
    };

  const ctx = await requestContext();
  const turnstile = await verifyTurnstile(turnstileToken, ctx.ip);
  if (!turnstile.ok) return { status: "verification_failed" };

  // Per-IP limits apply whenever the platform supplies the client IP (always on
  // Vercel); the per-email limit always applies.
  const allowed =
    (!ctx.ipHash || (await withinRateLimit(`inquiry:ip:${ctx.ipHash}`, 5, 600))) &&
    (await withinRateLimit(`inquiry:email:${parsed.data.email}`, 5, 3600));
  if (!allowed) return { status: "rate_limited" };

  try {
    const result = await submitInquiry(parsed.data, serviceLabel, {
      idempotencyKey,
      ipHash: ctx.ipHash,
      userAgent: ctx.userAgent,
      resumeToken,
    });
    if (result.status === "unavailable") return { status: "unavailable" };
    return { status: "success", reference: result.reference };
  } catch (error) {
    console.error("inquiry_submit_failed", error);
    return { status: "error" };
  }
}

export type DraftActionState =
  | { status: "idle" }
  | { status: "saved"; email: string }
  | { status: "invalid"; errors: FieldErrors }
  | { status: "already_submitted" }
  | { status: "rate_limited" }
  | { status: "unavailable" }
  | { status: "error" };

/** "Save and finish later": only runs after the visitor explicitly asks and consents. */
export async function saveInquiryDraftAction(payload: unknown): Promise<DraftActionState> {
  const parsedEnvelope = envelope.safeParse(payload);
  if (!parsedEnvelope.success) return { status: "error" };
  const { idempotencyKey, hp, data } = parsedEnvelope.data;
  if (hp) return { status: "saved", email: "" };

  const parsed = draftSchema.safeParse(data);
  if (!parsed.success) return { status: "invalid", errors: toFieldErrors(parsed.error) };
  const draft = {
    ...parsed.data,
    websiteUrl: parsed.data.websiteUrl
      ? (normaliseWebsiteUrl(parsed.data.websiteUrl) ?? undefined)
      : undefined,
  };
  const label = await serviceLabelFor(draft.service);
  if (label === undefined) draft.service = undefined;

  const ctx = await requestContext();
  const allowed =
    (!ctx.ipHash || (await withinRateLimit(`draft:ip:${ctx.ipHash}`, 5, 3600))) &&
    (await withinRateLimit(`draft:email:${draft.email}`, 3, 3600));
  if (!allowed) return { status: "rate_limited" };

  try {
    const result = await saveInquiryDraft(draft, label ?? null, {
      idempotencyKey,
      ipHash: ctx.ipHash,
      userAgent: ctx.userAgent,
    });
    if (result.status === "saved") return { status: "saved", email: draft.email };
    return { status: result.status };
  } catch (error) {
    console.error("inquiry_draft_failed", error);
    return { status: "error" };
  }
}
