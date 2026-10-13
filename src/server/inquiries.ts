import "server-only";
import type { Inquiry } from "@/domain/inquiry/schema";

export type SubmitInquiryResult =
  | { status: "created"; reference: string }
  | { status: "duplicate"; reference: string }
  | { status: "unavailable" };

/** Inquiry storage needs the database configured in Phase 3/4. */
export function isInquiryStorageConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * Persist a validated inquiry as a CRM lead.
 *
 * NOT YET IMPLEMENTED — Phase 4 replaces this with a single database
 * transaction that creates (or de-duplicates) the lead, records consent,
 * logs the activity and queues the notification emails. Until then it
 * reports "unavailable" so the form never claims a submission was received.
 */
export async function submitInquiry(
  _inquiry: Inquiry,
  _meta: { idempotencyKey: string; ipHash: string | null; userAgent: string | null },
): Promise<SubmitInquiryResult> {
  if (!isInquiryStorageConfigured()) return { status: "unavailable" };
  // Fail closed: configuration exists but the storage layer is not built yet.
  return { status: "unavailable" };
}
