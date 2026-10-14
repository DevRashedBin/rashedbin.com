import { randomUUID } from "node:crypto";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { EmailStatus } from "@/components/admin/email-status";
import { NoteForm } from "@/components/admin/note-form";
import { PageHeader, Panel } from "@/components/admin/shell";
import { formatMoney, minorToInput } from "@/domain/money/money";
import { formatDate, isOverdue, milestoneProgress, todayIso } from "@/domain/projects/schema";
import { requireAdmin } from "@/server/auth";
import { createSupabaseServerClient } from "@/server/supabase/server";
import {
  addProjectNoteAction,
  unpublishUpdateAction,
  updateProjectDetailsAction,
} from "../actions";
import { ProjectForm } from "../project-form";
import { AddMilestoneForm, MilestoneRow, StatusForm, UpdateComposer } from "./project-forms";

export const metadata = { title: "Project" };

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

export default async function ProjectPage({
  params,
  searchParams,
}: PageProps<"/admin/projects/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  if (!z.uuid().safeParse(id).success) notFound();

  const supabase = await createSupabaseServerClient();
  const [
    { data: project },
    { data: statuses },
    { data: milestones },
    { data: updates },
    { data: notes },
    { data: activities },
    { data: emails },
    { data: services },
    { data: settings },
  ] = await Promise.all([
    supabase
      .from("projects")
      .select("*, client:clients(id, display_name, billing_email)")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("project_statuses")
      .select("key, label, client_label, notify_client_by_default, is_terminal")
      .order("position"),
    supabase.from("milestones").select("*").eq("project_id", id).order("position"),
    supabase
      .from("project_updates")
      .select("*")
      .eq("project_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("internal_notes")
      .select("id, body, created_at")
      .eq("subject_type", "project")
      .eq("subject_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("activities")
      .select("id, summary, created_at")
      .eq("subject_type", "project")
      .eq("subject_id", id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("email_messages")
      .select("id, subject, to_email, status, delivery_status, created_at")
      .eq("related_type", "project")
      .eq("related_id", id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("services").select("slug, name").order("position"),
    supabase
      .from("business_settings")
      .select("notify_client_updates, notify_client_milestones")
      .eq("id", true)
      .single(),
  ]);
  if (!project) notFound();
  const client = Array.isArray(project.client) ? project.client[0] : project.client;
  const status = statuses?.find((s) => s.key === project.status_key);
  const today = todayIso();
  const progress = milestoneProgress(milestones ?? []);
  const overdue = isOverdue(project.target_date, Boolean(status?.is_terminal), today);
  const timeline = [
    ...(activities ?? []).map((a) => ({ at: a.created_at, key: `a-${a.id}`, a, e: null })),
    ...(emails ?? []).map((e) => ({ at: e.created_at, key: `e-${e.id}`, a: null, e })),
  ].sort((x, y) => y.at.localeCompare(x.at));

  return (
    <>
      <Link href="/admin/projects" className="text-sm text-stone hover:underline">
        ← Projects
      </Link>
      <div className="mt-3">
        <PageHeader
          title={project.title}
          description={`${project.ref} · ${client?.display_name ?? ""} · ${status?.label ?? project.status_key}`}
          actions={
            client ? (
              <Link
                href={`/admin/clients/${client.id}`}
                className="rounded-full border border-ink/20 px-4 py-2 text-sm hover:border-ink"
              >
                Client
              </Link>
            ) : undefined
          }
        />
      </div>
      {sp.created === "1" && (
        <p
          role="status"
          className="mb-5 rounded-xl border border-success/25 bg-success/5 px-3.5 py-2.5 text-sm text-success"
        >
          Project {project.ref} created.
        </p>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Fact
          label="Value"
          value={
            project.value_minor !== null
              ? formatMoney(project.value_minor, project.currency)
              : "Not set"
          }
        />
        <Fact label="Start" value={formatDate(project.start_date)} />
        <Fact
          label="Target"
          value={
            project.target_date
              ? `${formatDate(project.target_date)}${overdue ? " · overdue" : ""}`
              : "—"
          }
          danger={overdue}
        />
        <Fact label="Progress" value={progress === null ? "No milestones" : `${progress}%`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="flex flex-col gap-6">
          <Panel title="Milestones">
            {milestones?.length ? (
              <ol className="mb-4 flex flex-col gap-2">
                {milestones.map((m, i) => (
                  <MilestoneRow
                    key={m.id}
                    first={i === 0}
                    last={i === milestones.length - 1}
                    notifyByDefault={settings?.notify_client_milestones ?? true}
                    m={{
                      id: m.id,
                      title: m.title,
                      due_date: m.due_date,
                      completed_at: m.completed_at,
                      client_visible: m.client_visible,
                      dueLabel: m.due_date ? `Due ${formatDate(m.due_date)}` : "No due date",
                      overdue: isOverdue(m.due_date, Boolean(m.completed_at), today),
                    }}
                  />
                ))}
              </ol>
            ) : (
              <p className="mb-4 text-sm text-stone">No milestones yet.</p>
            )}
            <AddMilestoneForm projectId={project.id} />
          </Panel>

          <Panel title="Client updates">
            <UpdateComposer
              projectId={project.id}
              idempotencyKey={randomUUID()}
              notifyByDefault={settings?.notify_client_updates ?? true}
            />
            <ul className="mt-6 flex flex-col gap-3">
              {updates?.map((u) => (
                <li key={u.id} className="rounded-xl border border-ink/10 p-3 text-sm">
                  {u.title && <p className="font-medium">{u.title}</p>}
                  <p className="whitespace-pre-wrap">{u.body}</p>
                  <p className="mt-2 text-xs text-stone">
                    {u.published_at ? `Published ${fmt(u.published_at)}` : "Unpublished"}
                    {u.notified_at ? " · client emailed" : ""}
                  </p>
                  {u.published_at && (
                    <div className="mt-2">
                      <ConfirmAction
                        action={unpublishUpdateAction}
                        hidden={{ updateId: u.id }}
                        label="Unpublish"
                        title="Unpublish this update?"
                        body="It will be removed from the client area. Emails already sent can't be recalled."
                        confirmLabel="Unpublish"
                      />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Timeline">
            {timeline.length ? (
              <ol className="flex flex-col gap-3 text-sm">
                {timeline.map((t) => (
                  <li key={t.key} className="grid grid-cols-[auto_1fr] gap-3">
                    <span aria-hidden className="mt-1.5 size-2 rounded-full bg-ink/30" />
                    <div>
                      {t.a ? (
                        <p>{t.a.summary}</p>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <p>
                            Email to {t.e!.to_email}:{" "}
                            <Link
                              href={`/admin/emails/${t.e!.id}`}
                              className="underline underline-offset-2"
                            >
                              {t.e!.subject}
                            </Link>
                          </p>
                          <EmailStatus status={t.e!.status} delivery={t.e!.delivery_status} />
                        </div>
                      )}
                      <time className="text-xs text-stone" dateTime={t.at}>
                        {fmt(t.at)}
                      </time>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-stone">No activity yet.</p>
            )}
          </Panel>
        </div>

        <div className="flex flex-col gap-6">
          <Panel title="Status">
            <StatusForm
              projectId={project.id}
              current={project.status_key}
              statuses={statuses ?? []}
              idempotencyKey={randomUUID()}
            />
          </Panel>
          <Panel title="Details">
            <ProjectForm
              action={updateProjectDetailsAction}
              submitLabel="Save details"
              services={(services ?? []).map((s) => ({ value: s.slug, label: s.name }))}
              values={{
                projectId: project.id,
                title: project.title,
                description: project.description ?? "",
                serviceSlug: project.service_slug ?? "",
                currency: project.currency,
                value: minorToInput(project.value_minor),
                startDate: project.start_date ?? "",
                targetDate: project.target_date ?? "",
              }}
            />
          </Panel>
          <Panel title="Private notes">
            <p className="-mt-2 mb-4 text-xs text-stone">
              Only visible to you — never shown or emailed to the client.
            </p>
            <NoteForm subjectId={project.id} action={addProjectNoteAction} />
            <ul className="mt-5 flex flex-col gap-3">
              {notes?.map((n) => (
                <li key={n.id} className="rounded-xl bg-paper p-3 text-sm">
                  <p className="whitespace-pre-wrap">{n.body}</p>
                  <time className="mt-1.5 block text-xs text-stone" dateTime={n.created_at}>
                    {fmt(n.created_at)}
                  </time>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </>
  );
}

function Fact({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="rounded-[1.25rem] border border-ink/10 bg-white p-4">
      <p className="text-xs text-stone">{label}</p>
      <p className={`mt-1 text-sm font-medium ${danger ? "text-danger" : ""}`}>{value}</p>
    </div>
  );
}
