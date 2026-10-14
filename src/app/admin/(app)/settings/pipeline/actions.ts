"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import type { ActionState } from "@/components/admin/action-state";
import { assertAdmin } from "@/server/auth";
import { createSupabaseServerClient } from "@/server/supabase/server";

const stageRow = z.object({
  key: z.string().regex(/^[a-z0-9_]{1,40}$/),
  label: z.string().trim().min(1, "Every stage needs a name.").max(60),
  position: z.coerce.number().int().min(0).max(10000),
});

export async function saveStagesAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await assertAdmin();
  const keys = formData.getAll("key").map(String);
  const rows = keys.map((key, i) => ({
    key,
    label: String(formData.getAll("label")[i] ?? ""),
    position: String(formData.getAll("position")[i] ?? ""),
  }));
  const parsed = z.array(stageRow).safeParse(rows);
  if (!parsed.success)
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the stages." };

  const supabase = await createSupabaseServerClient();
  for (const r of parsed.data) {
    const { error } = await supabase
      .from("pipeline_stages")
      .update({ label: r.label, position: r.position })
      .eq("key", r.key);
    if (error) return { status: "error", message: "The stages could not be saved." };
  }

  const newLabel = String(formData.get("newLabel") ?? "").trim();
  if (newLabel) {
    const key = newLabel
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 40);
    if (!key) return { status: "error", message: "Use letters or numbers in the new stage name." };
    const maxPos = Math.max(
      0,
      ...parsed.data.filter((r) => r.key !== "won" && r.key !== "lost").map((r) => r.position),
    );
    const { error } = await supabase
      .from("pipeline_stages")
      .insert({ key, label: newLabel.slice(0, 60), position: maxPos + 5, kind: "open" });
    if (error)
      return {
        status: "error",
        message:
          error.code === "23505"
            ? "A stage with that name already exists."
            : "The stage could not be added.",
      };
  }
  refresh();
  return { status: "success", message: "Pipeline saved." };
}

export async function deleteStageAction(formData: FormData) {
  await assertAdmin();
  const key = z
    .string()
    .regex(/^[a-z0-9_]{1,40}$/)
    .parse(formData.get("key"));
  const supabase = await createSupabaseServerClient();
  // System stages are protected in the database; stages in use keep their leads (FK restricts delete).
  await supabase.from("pipeline_stages").delete().eq("key", key).eq("is_system", false);
  refresh();
}
