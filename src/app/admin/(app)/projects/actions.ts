"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { submittedValues, type ActionState } from "@/components/admin/action-state";
import { toFieldErrors } from "@/domain/inquiry/schema";
import {
  milestoneSchema,
  newProjectSchema,
  projectDetailsSchema,
  projectUpdateSchema,
} from "@/domain/projects/schema";
import { assertAdmin } from "@/server/auth";
import type { Json } from "@/server/db/types";
import { notifyProjectClients, type NotifySummary } from "@/server/notifications";
import { createSupabaseServerClient } from "@/server/supabase/server";

const fields = (formData: FormData) =>
  Object.fromEntries([...formData.entries()].filter(([, v]) => typeof v === "string"));
const fail = (
  formData: FormData,
  error: z.ZodError,
  message = "Please fix the highlighted fields.",
): ActionState => ({
  status: "error",
  message,
  errors: toFieldErrors(error),
  values: submittedValues(formData),
});

function describeNotify(s: NotifySummary): string {
  if (!s.recipients) return " No client email address on file, so no email was sent.";
  if (s.failed)
    return ` ${s.failed} client email${s.failed > 1 ? "s" : ""} failed and will be retried.`;
  if (s.suppressed) return " The client email was recorded but not sent (development safety mode).";
  return ` Client emailed (${s.sent}).`;
}

async function logActivity(
  projectId: string,
  kind: string,
  summary: string,
  actorId: string,
  data: NonNullable<Json> = {},
) {
  const supabase = await createSupabaseServerClient();
  await supabase.from("activities").insert({
    subject_type: "project",
    subject_id: projectId,
    kind,
    summary,
    actor_id: actorId,
    data,
  });
}

// ── Create and edit ─────────────────────────────────────────────────────────

export async function createProjectAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await assertAdmin();
  const parsed = newProjectSchema.safeParse(fields(formData));
  if (!parsed.success) return fail(formData, parsed.error);
  const d = parsed.data;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("create_project", {
    p_client_id: d.clientId,
    p_title: d.title,
    p_status_key: d.statusKey,
    p_currency: d.currency,
    p_description: d.description ?? undefined,
    p_service_slug: d.serviceSlug ?? undefined,
    p_value_minor: d.value ?? undefined,
    p_start_date: d.startDate ?? undefined,
    p_target_date: d.targetDate ?? undefined,
  });
  if (error || !data?.[0]) {
    return {
      status: "error",
      message: "The project could not be created.",
      values: submittedValues(formData),
    };
  }
  redirect(`/admin/projects/${data[0].project_id}?created=1`);
}

export async function updateProjectDetailsAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await assertAdmin();
  const id = z.uuid().safeParse(formData.get("projectId"));
  if (!id.success) return { status: "error", message: "Unknown project." };
  const parsed = projectDetailsSchema.safeParse(fields(formData));
  if (!parsed.success) return fail(formData, parsed.error);
  const d = parsed.data;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("projects")
    .update({
      title: d.title,
      description: d.description,
      service_slug: d.serviceSlug,
      currency: d.currency,
      value_minor: d.value,
      start_date: d.startDate,
      target_date: d.targetDate,
    })
    .eq("id", id.data)
    .select("id");
  if (error || !data?.length)
    return {
      status: "error",
      message: "The project could not be saved.",
      values: submittedValues(formData),
    };
  await logActivity(id.data, "details_updated", "Project details updated", user.id);
  refresh();
  return { status: "success", message: "Project saved." };
}

// ── Status ──────────────────────────────────────────────────────────────────

const statusInput = z.object({
  projectId: z.uuid(),
  status: z.string().regex(/^[a-z0-9_]{1,40}$/),
  notify: z.literal("on").optional(),
  idempotencyKey: z.uuid(),
});

export async function changeProjectStatusAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await assertAdmin();
  const parsed = statusInput.safeParse(fields(formData));
  if (!parsed.success) return { status: "error", message: "Choose a valid status." };
  const { projectId, status, notify, idempotencyKey } = parsed.data;

  const supabase = await createSupabaseServerClient();
  const [{ data: project }, { data: statuses }] = await Promise.all([
    supabase.from("projects").select("status_key").eq("id", projectId).single(),
    supabase.from("project_statuses").select("key, label"),
  ]);
  if (!project) return { status: "error", message: "Unknown project." };
  if (project.status_key === status)
    return { status: "success", message: "The status hasn't changed." };
  const label = (k: string) => statuses?.find((s) => s.key === k)?.label ?? k;

  const { error } = await supabase
    .from("projects")
    .update({ status_key: status })
    .eq("id", projectId);
  if (error) return { status: "error", message: "The status could not be changed." };
  await logActivity(
    projectId,
    "status_changed",
    `Status ${label(project.status_key)} → ${label(status)}`,
    user.id,
  );

  let note = "";
  if (notify) {
    const summary = await notifyProjectClients({
      projectId,
      templateKey: "project_status_changed",
      values: {},
      idempotencyBase: `status:${idempotencyKey}`,
      actorId: user.id,
    });
    note = describeNotify(summary);
  }
  refresh();
  return { status: "success", message: `Status changed to ${label(status)}.${note}` };
}

// ── Milestones ──────────────────────────────────────────────────────────────

export async function addMilestoneAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await assertAdmin();
  const projectId = z.uuid().safeParse(formData.get("projectId"));
  if (!projectId.success) return { status: "error", message: "Unknown project." };
  const parsed = milestoneSchema.safeParse({
    ...fields(formData),
    clientVisible: formData.get("clientVisible") === "on",
  });
  if (!parsed.success) return fail(formData, parsed.error);

  const supabase = await createSupabaseServerClient();
  const { data: last } = await supabase
    .from("milestones")
    .select("position")
    .eq("project_id", projectId.data)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { error } = await supabase.from("milestones").insert({
    project_id: projectId.data,
    title: parsed.data.title,
    description: parsed.data.description,
    due_date: parsed.data.dueDate,
    client_visible: parsed.data.clientVisible,
    position: (last?.position ?? 0) + 10,
  });
  if (error)
    return {
      status: "error",
      message: "The milestone could not be added.",
      values: submittedValues(formData),
    };
  await logActivity(
    projectId.data,
    "milestone_added",
    `Milestone added: ${parsed.data.title}`,
    user.id,
  );
  refresh();
  return { status: "success", message: "Milestone added." };
}

const milestoneAction = z.object({
  milestoneId: z.uuid(),
  op: z.enum(["complete", "reopen", "show", "hide", "delete", "up", "down"]),
  notify: z.literal("on").optional(),
});

export async function milestoneOpAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await assertAdmin();
  const parsed = milestoneAction.safeParse(fields(formData));
  if (!parsed.success) return { status: "error", message: "Unknown action." };
  const { milestoneId, op, notify } = parsed.data;
  const supabase = await createSupabaseServerClient();
  const { data: m } = await supabase.from("milestones").select("*").eq("id", milestoneId).single();
  if (!m) return { status: "error", message: "Milestone not found." };

  let message = "Milestone updated.";
  if (op === "complete") {
    if (m.completed_at) return { status: "success", message: "Already complete." };
    await supabase
      .from("milestones")
      .update({ completed_at: new Date().toISOString() })
      .eq("id", m.id);
    await logActivity(
      m.project_id,
      "milestone_completed",
      `Milestone completed: ${m.title}`,
      user.id,
    );
    message = "Milestone completed.";
    if (notify && m.client_visible) {
      const summary = await notifyProjectClients({
        projectId: m.project_id,
        templateKey: "milestone_completed",
        values: { milestone_title: m.title },
        // Completing the same milestone again (after reopening) is a new event.
        idempotencyBase: `milestone:${m.id}:${Date.now()}`,
        actorId: user.id,
      });
      message += describeNotify(summary);
    }
  } else if (op === "reopen") {
    await supabase.from("milestones").update({ completed_at: null }).eq("id", m.id);
    await logActivity(
      m.project_id,
      "milestone_reopened",
      `Milestone reopened: ${m.title}`,
      user.id,
    );
  } else if (op === "show" || op === "hide") {
    await supabase
      .from("milestones")
      .update({ client_visible: op === "show" })
      .eq("id", m.id);
    message =
      op === "show"
        ? "Milestone is now visible to the client."
        : "Milestone is now hidden from the client.";
  } else if (op === "delete") {
    await supabase.from("milestones").delete().eq("id", m.id);
    await logActivity(m.project_id, "milestone_deleted", `Milestone removed: ${m.title}`, user.id);
    message = "Milestone removed.";
  } else {
    const { data: siblings } = await supabase
      .from("milestones")
      .select("id, position")
      .eq("project_id", m.project_id)
      .order("position");
    const list = siblings ?? [];
    const i = list.findIndex((s) => s.id === m.id);
    const j = op === "up" ? i - 1 : i + 1;
    if (i >= 0 && j >= 0 && j < list.length) {
      await supabase.from("milestones").update({ position: list[j].position }).eq("id", list[i].id);
      await supabase.from("milestones").update({ position: list[i].position }).eq("id", list[j].id);
    }
  }
  refresh();
  return { status: "success", message };
}

// ── Client-visible updates ──────────────────────────────────────────────────

export async function postUpdateAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await assertAdmin();
  const projectId = z.uuid().safeParse(formData.get("projectId"));
  if (!projectId.success) return { status: "error", message: "Unknown project." };
  const parsed = projectUpdateSchema.safeParse({
    ...fields(formData),
    notify: formData.get("notify") === "on",
  });
  if (!parsed.success) return fail(formData, parsed.error);

  const supabase = await createSupabaseServerClient();
  const { data: update, error } = await supabase
    .from("project_updates")
    .insert({
      project_id: projectId.data,
      title: parsed.data.title,
      body: parsed.data.body,
      published_at: new Date().toISOString(),
      author_id: user.id,
    })
    .select("id")
    .single();
  if (error || !update)
    return {
      status: "error",
      message: "The update could not be posted.",
      values: submittedValues(formData),
    };
  await logActivity(
    projectId.data,
    "update_posted",
    `Client update posted${parsed.data.title ? `: ${parsed.data.title}` : ""}`,
    user.id,
  );

  let note = "";
  if (parsed.data.notify) {
    const summary = await notifyProjectClients({
      projectId: projectId.data,
      templateKey: "project_update_posted",
      values: { update_body: parsed.data.body },
      idempotencyBase: `update:${parsed.data.idempotencyKey}`,
      actorId: user.id,
    });
    if (summary.sent)
      await supabase
        .from("project_updates")
        .update({ notified_at: new Date().toISOString() })
        .eq("id", update.id);
    note = describeNotify(summary);
  }
  refresh();
  return { status: "success", message: `Update published to the client area.${note}` };
}

export async function unpublishUpdateAction(formData: FormData) {
  const user = await assertAdmin();
  const id = z.uuid().parse(formData.get("updateId"));
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("project_updates")
    .update({ published_at: null })
    .eq("id", id)
    .select("project_id")
    .single();
  if (data)
    await logActivity(
      data.project_id,
      "update_unpublished",
      "A client update was unpublished",
      user.id,
    );
  refresh();
}

// ── Notes ───────────────────────────────────────────────────────────────────

export async function addProjectNoteAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await assertAdmin();
  const parsed = z
    .object({
      subjectId: z.uuid(),
      body: z.string().trim().min(1, "Write a note first.").max(10000),
    })
    .safeParse(fields(formData));
  if (!parsed.success) return fail(formData, parsed.error, "Write a note first.");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("internal_notes").insert({
    subject_type: "project",
    subject_id: parsed.data.subjectId,
    body: parsed.data.body,
    author_id: user.id,
  });
  if (error)
    return {
      status: "error",
      message: "The note could not be saved.",
      values: submittedValues(formData),
    };
  refresh();
  return { status: "success", message: "Note added." };
}
