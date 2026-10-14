"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import type { ActionState } from "@/components/admin/action-state";
import { assertAdmin } from "@/server/auth";
import { createSupabaseServerClient } from "@/server/supabase/server";

const row = z.object({
  key: z.string().regex(/^[a-z0-9_]{1,40}$/),
  label: z.string().trim().min(1, "Every status needs a name.").max(60),
  clientLabel: z.string().trim().min(1, "Every status needs a client-facing name.").max(60),
  position: z.coerce.number().int().min(0).max(10000),
  notify: z.boolean(),
});

export async function saveProjectStatusesAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await assertAdmin();
  const keys = formData.getAll("key").map(String);
  const notifyKeys = new Set(formData.getAll("notify").map(String));
  const parsed = z.array(row).safeParse(
    keys.map((key, i) => ({
      key,
      label: String(formData.getAll("label")[i] ?? ""),
      clientLabel: String(formData.getAll("clientLabel")[i] ?? ""),
      position: String(formData.getAll("position")[i] ?? ""),
      notify: notifyKeys.has(key),
    })),
  );
  if (!parsed.success)
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the statuses." };
  const supabase = await createSupabaseServerClient();
  for (const r of parsed.data) {
    const { error } = await supabase
      .from("project_statuses")
      .update({
        label: r.label,
        client_label: r.clientLabel,
        position: r.position,
        notify_client_by_default: r.notify,
      })
      .eq("key", r.key);
    if (error) return { status: "error", message: "The statuses could not be saved." };
  }
  refresh();
  return { status: "success", message: "Project statuses saved." };
}
