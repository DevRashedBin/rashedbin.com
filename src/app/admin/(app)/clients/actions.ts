"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { submittedValues, type ActionState } from "@/components/admin/action-state";
import { clientFormData, clientSchema, clientToRow } from "@/domain/clients/schema";
import { toFieldErrors } from "@/domain/inquiry/schema";
import { assertAdmin } from "@/server/auth";
import { createSupabaseServerClient } from "@/server/supabase/server";

const DUPLICATE_EMAIL = "An active client already uses this billing email.";

export async function createClientAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await assertAdmin();
  const parsed = clientSchema.safeParse(clientFormData(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      errors: toFieldErrors(parsed.error),
      values: submittedValues(formData),
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("clients")
    .insert({ ...clientToRow(parsed.data), created_by: user.id })
    .select("id")
    .single();
  if (error?.code === "23505") {
    return {
      status: "error",
      errors: { billingEmail: DUPLICATE_EMAIL },
      values: submittedValues(formData),
    };
  }
  if (error || !data) {
    return {
      status: "error",
      message: "The client could not be saved. Please try again.",
      values: submittedValues(formData),
    };
  }
  redirect(`/admin/clients/${data.id}?created=1`);
}

export async function updateClientAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await assertAdmin();
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return { status: "error", message: "Unknown client." };
  const parsed = clientSchema.safeParse(clientFormData(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      errors: toFieldErrors(parsed.error),
      values: submittedValues(formData),
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("clients")
    .update(clientToRow(parsed.data))
    .eq("id", id.data)
    .select("id");
  if (error?.code === "23505") {
    return {
      status: "error",
      errors: { billingEmail: DUPLICATE_EMAIL },
      values: submittedValues(formData),
    };
  }
  if (error || !data?.length) {
    return {
      status: "error",
      message: "The client could not be saved. Please try again.",
      values: submittedValues(formData),
    };
  }
  refresh();
  return { status: "success", message: "Client saved." };
}

export async function setClientArchivedAction(formData: FormData) {
  await assertAdmin();
  const id = z.uuid().parse(formData.get("id"));
  const archive = formData.get("archive") === "true";
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("clients")
    .update({ archived_at: archive ? new Date().toISOString() : null })
    .eq("id", id);
  // Unarchiving can collide with a newer active client using the same email.
  if (error)
    redirect(`/admin/clients/${id}?error=${error.code === "23505" ? "duplicate" : "failed"}`);
  refresh();
}

const noteInput = z.object({
  clientId: z.uuid(),
  body: z.string().trim().min(1, "Write a note first.").max(10000),
});

export async function addClientNoteAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await assertAdmin();
  const parsed = noteInput.safeParse({
    clientId: formData.get("clientId"),
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
    subject_type: "client",
    subject_id: parsed.data.clientId,
    body: parsed.data.body,
    author_id: user.id,
  });
  if (error) return { status: "error", message: "The note could not be saved." };
  refresh();
  return { status: "success", message: "Note added." };
}
