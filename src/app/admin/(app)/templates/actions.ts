"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { submittedValues, type ActionState } from "@/components/admin/action-state";
import { TEMPLATE_VARIABLES, variablesIn } from "@/domain/email/template";
import { toFieldErrors } from "@/domain/inquiry/schema";
import { assertAdmin } from "@/server/auth";
import { createSupabaseServerClient } from "@/server/supabase/server";

const input = z.object({
  key: z.string().regex(/^[a-z0-9_]{1,60}$/),
  name: z.string().trim().min(1, "Give the template a name.").max(100),
  subject: z.string().trim().min(1, "Add a subject.").max(200),
  body: z.string().trim().min(1, "Write the message.").max(10000),
});

export async function saveTemplateAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await assertAdmin();
  const parsed = input.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      errors: toFieldErrors(parsed.error),
      values: submittedValues(formData),
    };
  }
  const unknown = variablesIn(`${parsed.data.subject}\n${parsed.data.body}`).filter(
    (v) => !(v in TEMPLATE_VARIABLES),
  );
  if (unknown.length) {
    return {
      status: "error",
      message: `Unknown variable${unknown.length > 1 ? "s" : ""}: ${unknown.map((v) => `{{${v}}}`).join(", ")}.`,
      values: submittedValues(formData),
    };
  }
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("email_templates")
    .update({
      name: parsed.data.name,
      subject: parsed.data.subject,
      body: parsed.data.body,
      updated_by: user.id,
    })
    .eq("key", parsed.data.key)
    .select("key");
  if (error || !data?.length)
    return {
      status: "error",
      message: "The template could not be saved.",
      values: submittedValues(formData),
    };
  refresh();
  return { status: "success", message: "Template saved." };
}
