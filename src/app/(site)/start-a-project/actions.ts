"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { inquirySchema, toFieldErrors, type FieldErrors } from "@/domain/inquiry/schema";
import { submitInquiry } from "@/server/inquiries";

export type InquiryActionState =
  | { status: "idle" }
  | { status: "invalid"; errors: FieldErrors }
  | { status: "success"; reference: string }
  | { status: "unavailable" }
  | { status: "error" };

/** Submissions completed faster than this are almost certainly automated. */
const MIN_FILL_MS = 4_000;

const envelope = z.object({
  idempotencyKey: z.uuid(),
  startedAt: z.number().int().positive(),
  /** Honeypot: hidden from people, often filled in by bots. */
  hp: z.string().max(0).optional().or(z.literal("")),
  data: z.record(z.string(), z.unknown()),
});

export async function submitInquiryAction(payload: unknown): Promise<InquiryActionState> {
  const parsedEnvelope = envelope.safeParse(payload);
  if (!parsedEnvelope.success) return { status: "error" };
  const { idempotencyKey, startedAt, hp, data } = parsedEnvelope.data;

  // Bot heuristics: respond as if successful without storing anything, so
  // automated submitters get no signal to adapt to.
  if (hp || Date.now() - startedAt < MIN_FILL_MS) {
    return { status: "success", reference: "received" };
  }

  const parsed = inquirySchema.safeParse(data);
  if (!parsed.success) return { status: "invalid", errors: toFieldErrors(parsed.error) };

  const h = await headers();
  try {
    const result = await submitInquiry(parsed.data, {
      idempotencyKey,
      ipHash: null, // Phase 4: salted hash of the client IP for rate limiting.
      userAgent: h.get("user-agent"),
    });
    if (result.status === "unavailable") return { status: "unavailable" };
    return { status: "success", reference: result.reference };
  } catch (error) {
    console.error("inquiry_submit_failed", error);
    return { status: "error" };
  }
}
