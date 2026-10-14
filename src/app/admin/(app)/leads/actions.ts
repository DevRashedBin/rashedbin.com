"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { submittedValues, type ActionState } from "@/components/admin/action-state";
import { toFieldErrors } from "@/domain/inquiry/schema";
import {
  followUpSchema,
  leadStatusSchema,
  PRIORITY_LABELS,
  unresolvedPlaceholders,
} from "@/domain/leads/format";
import { assertAdmin } from "@/server/auth";
import { deliverEmail, queueEmail } from "@/server/email/outbox";
import { createSupabaseServerClient } from "@/server/supabase/server";

export async function updateLeadStatusAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await assertAdmin();
  const parsed = leadStatusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: "Choose a valid stage and priority." };
  const { leadId, stage, priority } = parsed.data;

  const supabase = await createSupabaseServerClient();
  const { data: before } = await supabase
    .from("leads")
    .select("stage_key, priority")
    .eq("id", leadId)
    .single();
  if (!before) return { status: "error", message: "Lead not found." };
  if (before.stage_key === stage && before.priority === priority)
    return { status: "success", message: "No changes." };

  const { error } = await supabase
    .from("leads")
    .update({ stage_key: stage, priority, last_activity_at: new Date().toISOString() })
    .eq("id", leadId);
  if (error) return { status: "error", message: "The lead could not be updated." };

  const { data: stages } = await supabase.from("pipeline_stages").select("key, label");
  const label = (k: string) => stages?.find((s) => s.key === k)?.label ?? k;
  const changes = [
    before.stage_key !== stage ? `stage ${label(before.stage_key)} → ${label(stage)}` : null,
    before.priority !== priority
      ? `priority ${PRIORITY_LABELS[before.priority as keyof typeof PRIORITY_LABELS]} → ${PRIORITY_LABELS[priority]}`
      : null,
  ].filter(Boolean);
  await supabase.from("activities").insert({
    subject_type: "lead",
    subject_id: leadId,
    kind: "status_changed",
    summary: `Changed ${changes.join(" and ")}`,
    actor_id: user.id,
  });
  refresh();
  return { status: "success", message: "Lead updated." };
}

const noteInput = z.object({
  leadId: z.uuid(),
  body: z.string().trim().min(1, "Write a note first.").max(10000),
});

export async function addLeadNoteAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await assertAdmin();
  const parsed = noteInput.safeParse({
    leadId: formData.get("subjectId"),
    body: formData.get("body"),
  });
  if (!parsed.success)
    return {
      status: "error",
      errors: toFieldErrors(parsed.error),
      values: submittedValues(formData),
    };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("internal_notes").insert({
    subject_type: "lead",
    subject_id: parsed.data.leadId,
    body: parsed.data.body,
    author_id: user.id,
  });
  if (error)
    return {
      status: "error",
      message: "The note could not be saved.",
      values: submittedValues(formData),
    };
  await supabase
    .from("leads")
    .update({ last_activity_at: new Date().toISOString() })
    .eq("id", parsed.data.leadId);
  refresh();
  return { status: "success", message: "Note added." };
}

/**
 * Sends a personal follow-up. The message is recorded before sending and keyed
 * by an idempotency key generated when the compose page loaded, so a double
 * click or a retried request can never send the same email twice.
 */
export async function sendFollowUpAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await assertAdmin();
  const parsed = followUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the message.",
      errors: toFieldErrors(parsed.error),
      values: submittedValues(formData),
    };
  }
  const { leadId, subject, body, templateKey, idempotencyKey } = parsed.data;
  const leftover = unresolvedPlaceholders(`${subject}\n${body}`);
  if (leftover.length) {
    return {
      status: "error",
      message: `Replace the placeholders before sending: ${leftover.map((v) => `{{${v}}}`).join(", ")}.`,
      values: submittedValues(formData),
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: lead } = await supabase
    .from("leads")
    .select("id, email, stage_key, anonymised_at")
    .eq("id", leadId)
    .single();
  if (!lead || lead.anonymised_at)
    return { status: "error", message: "This lead can't be emailed." };

  const queued = await queueEmail({
    idempotencyKey: `followup:${idempotencyKey}`,
    to: lead.email,
    subject,
    bodyText: body,
    templateKey: templateKey || undefined,
    related: { type: "lead", id: lead.id },
    createdBy: user.id,
  });
  const result = queued.alreadyQueued ? { status: queued.status } : await deliverEmail(queued.id);

  if (!queued.alreadyQueued) {
    await supabase.from("activities").insert({
      subject_type: "lead",
      subject_id: lead.id,
      kind: result.status === "sent" ? "email_sent" : "email_not_sent",
      summary:
        result.status === "sent"
          ? `Email sent: “${subject}”`
          : result.status === "suppressed"
            ? `Email recorded but not sent (development safety): “${subject}”`
            : `Email failed to send: “${subject}”`,
      data: { email_message_id: queued.id },
      actor_id: user.id,
    });
    const advance = result.status === "sent" && lead.stage_key === "new";
    await supabase
      .from("leads")
      .update({
        last_activity_at: new Date().toISOString(),
        ...(advance ? { stage_key: "contacted" } : {}),
      })
      .eq("id", lead.id);
  }
  redirect(`/admin/leads/${lead.id}?email=${result.status}`);
}

export async function convertLeadAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await assertAdmin();
  const parsed = z
    .object({
      leadId: z.uuid(),
      title: z.string().trim().min(1, "Give the project a title.").max(200),
      status: z.string().regex(/^[a-z0-9_]{1,40}$/),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return {
      status: "error",
      errors: toFieldErrors(parsed.error),
      values: submittedValues(formData),
    };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("convert_lead_to_project", {
    p_lead_id: parsed.data.leadId,
    p_title: parsed.data.title,
    p_status_key: parsed.data.status,
  });
  if (error || !data?.[0]) {
    return {
      status: "error",
      message: error?.message.includes("incomplete")
        ? "Incomplete enquiries can't be converted."
        : "The project could not be created.",
    };
  }
  redirect(`/admin/leads/${parsed.data.leadId}?converted=${data[0].created ? "new" : "existing"}`);
}

export async function retryEmailAction(formData: FormData) {
  await assertAdmin();
  const id = z.uuid().parse(formData.get("emailId"));
  const supabase = await createSupabaseServerClient();
  // RLS: only an admin can read the message; delivery itself uses the outbox.
  const { data } = await supabase.from("email_messages").select("id, status").eq("id", id).single();
  if (data?.status === "failed") await deliverEmail(id);
  refresh();
}
