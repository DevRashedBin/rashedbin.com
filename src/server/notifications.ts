import "server-only";
import { firstName, type TemplateValues } from "@/domain/email/template";
import { appOrigin } from "./email/config";
import { deliverEmail, queueEmail, type DeliveryResult } from "./email/outbox";
import { baseTemplateValues, renderStoredTemplate } from "./email/templates";
import { createSupabaseServiceClient } from "./supabase/admin";

export type ProjectEmailKey =
  "project_status_changed" | "project_update_posted" | "milestone_completed";

export type NotifySummary = {
  recipients: number;
  sent: number;
  failed: number;
  suppressed: number;
};

/** Who receives client emails for a project: its portal users, or the billing email if none. */
async function projectRecipients(clientId: string): Promise<{ email: string; name: string }[]> {
  const db = createSupabaseServiceClient();
  const [{ data: client }, { data: members }] = await Promise.all([
    db
      .from("clients")
      .select("billing_email, contact_name, display_name")
      .eq("id", clientId)
      .single(),
    db.from("client_members").select("user_id").eq("client_id", clientId),
  ]);
  const fallbackName = client?.contact_name || client?.display_name || "";
  const recipients: { email: string; name: string }[] = [];
  for (const m of members ?? []) {
    const [{ data: u }, { data: profile }] = await Promise.all([
      db.auth.admin.getUserById(m.user_id),
      db.from("profiles").select("full_name").eq("id", m.user_id).maybeSingle(),
    ]);
    if (u.user?.email)
      recipients.push({ email: u.user.email, name: profile?.full_name || fallbackName });
  }
  if (!recipients.length && client?.billing_email)
    recipients.push({ email: client.billing_email, name: fallbackName });
  return recipients;
}

/**
 * Emails the client about a client-visible change. Values come only from
 * client-facing fields (project title, client status label, published update
 * text) — never from internal notes. Each recipient gets one message keyed by
 * `idempotencyBase`, so retries never duplicate it. The outcome is recorded on
 * the project timeline.
 */
export async function notifyProjectClients(input: {
  projectId: string;
  templateKey: ProjectEmailKey;
  values: TemplateValues;
  idempotencyBase: string;
  actorId: string;
}): Promise<NotifySummary> {
  const db = createSupabaseServiceClient();
  const { data: project } = await db
    .from("projects")
    .select("id, ref, title, client_id, status_key")
    .eq("id", input.projectId)
    .single();
  if (!project) throw new Error("Project not found");
  const { data: status } = await db
    .from("project_statuses")
    .select("client_label")
    .eq("key", project.status_key)
    .single();

  const base = await baseTemplateValues();
  const recipients = await projectRecipients(project.client_id);
  const results: DeliveryResult[] = [];
  let subject = "";
  for (const r of recipients) {
    const rendered = await renderStoredTemplate(input.templateKey, {
      ...base,
      name: r.name,
      first_name: firstName(r.name) || "there",
      project_title: project.title,
      project_reference: project.ref,
      project_status: status?.client_label ?? "",
      portal_link: `${appOrigin()}/portal/projects/${project.ref}`,
      ...input.values,
    });
    subject = rendered.subject;
    const queued = await queueEmail({
      idempotencyKey: `${input.idempotencyBase}:${r.email.toLowerCase()}`,
      to: r.email,
      subject: rendered.subject,
      bodyText: rendered.body,
      templateKey: input.templateKey,
      related: { type: "project", id: project.id },
      createdBy: input.actorId,
    });
    results.push(
      queued.alreadyQueued ? { id: queued.id, status: "skipped" } : await deliverEmail(queued.id),
    );
  }

  const summary: NotifySummary = {
    recipients: recipients.length,
    sent: results.filter((r) => r.status === "sent").length,
    failed: results.filter((r) => r.status === "failed").length,
    suppressed: results.filter((r) => r.status === "suppressed").length,
  };
  await db.from("activities").insert({
    subject_type: "project",
    subject_id: project.id,
    kind: "client_notified",
    summary: recipients.length
      ? `Client email “${subject}”: ${summary.sent} sent, ${summary.failed} failed, ${summary.suppressed} not sent (safety mode)`
      : "No client email address to notify",
    data: summary,
    actor_id: input.actorId,
  });
  return summary;
}
