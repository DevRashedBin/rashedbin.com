import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { EmailStatus } from "@/components/admin/email-status";
import { NoteForm } from "@/components/admin/note-form";
import { PageHeader, Panel } from "@/components/admin/shell";
import { ButtonLink } from "@/components/ui/button";
import { describeDetails } from "@/domain/leads/format";
import { requireAdmin } from "@/server/auth";
import { createSupabaseServerClient } from "@/server/supabase/server";
import { addLeadNoteAction, retryEmailAction } from "../actions";
import { ConvertLeadDialog, LeadStatusForm } from "./lead-forms";

export const metadata = { title: "Lead" };

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

const EMAIL_FLASH: Record<string, { ok: boolean; text: string }> = {
  sent: {
    ok: true,
    text: "Email sent to the provider. Delivery is confirmed in the timeline once the provider reports it.",
  },
  suppressed: {
    ok: false,
    text: "The email was recorded but not sent, because the development safety mode (EMAIL_MODE) is on.",
  },
  failed: {
    ok: false,
    text: "The email could not be sent. It's saved in the timeline and will be retried automatically.",
  },
  queued: { ok: true, text: "This email was already sent — it wasn't sent twice." },
  sending: { ok: true, text: "This email is already being sent — it wasn't sent twice." },
  skipped: { ok: true, text: "This email was already handled — it wasn't sent twice." },
};

export default async function LeadPage({ params, searchParams }: PageProps<"/admin/leads/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  if (!z.uuid().safeParse(id).success) notFound();

  const supabase = await createSupabaseServerClient();
  const [
    { data: lead },
    { data: stages },
    { data: statuses },
    { data: notes },
    { data: activities },
    { data: emails },
    { data: consents },
    { data: project },
  ] = await Promise.all([
    supabase.from("leads").select("*").eq("id", id).maybeSingle(),
    supabase.from("pipeline_stages").select("key, label").order("position"),
    supabase.from("project_statuses").select("key, label").order("position"),
    supabase
      .from("internal_notes")
      .select("id, body, created_at")
      .eq("subject_type", "lead")
      .eq("subject_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("activities")
      .select("id, kind, summary, created_at")
      .eq("subject_type", "lead")
      .eq("subject_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("email_messages")
      .select(
        "id, subject, to_email, status, status_reason, delivery_status, created_at, template_key",
      )
      .eq("related_type", "lead")
      .eq("related_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("consent_records")
      .select("purpose, notice_version, granted_at")
      .eq("lead_id", id)
      .order("granted_at"),
    supabase.from("projects").select("id, ref, client_id").eq("lead_id", id).maybeSingle(),
  ]);
  if (!lead) notFound();

  const stageLabel = stages?.find((s) => s.key === lead.stage_key)?.label ?? lead.stage_key;
  const incomplete = !lead.submitted_at;
  const timeline = [
    ...(activities ?? []).map((a) => ({
      at: a.created_at,
      key: `a-${a.id}`,
      kind: "activity" as const,
      a,
    })),
    ...(emails ?? []).map((e) => ({
      at: e.created_at,
      key: `e-${e.id}`,
      kind: "email" as const,
      e,
    })),
  ].sort((x, y) => y.at.localeCompare(x.at));
  const flash = typeof sp.email === "string" ? EMAIL_FLASH[sp.email] : undefined;

  return (
    <>
      <Link href="/admin/leads" className="text-sm text-stone hover:underline">
        ← Leads
      </Link>
      <div className="mt-3">
        <PageHeader
          title={lead.name}
          description={`${lead.ref} · ${stageLabel}${lead.company ? ` · ${lead.company}` : ""}`}
          actions={
            lead.anonymised_at ? undefined : (
              <>
                <ButtonLink href={`/admin/leads/${lead.id}/follow-up`} variant="outline">
                  Follow up
                </ButtonLink>
                {project ? (
                  <ButtonLink href={`/admin/clients/${project.client_id}`}>
                    Project {project.ref}
                  </ButtonLink>
                ) : (
                  !incomplete && (
                    <ConvertLeadDialog
                      leadId={lead.id}
                      defaultTitle={`${lead.service_label ?? "Website project"} — ${lead.company || lead.name}`}
                      statuses={statuses ?? []}
                    />
                  )
                )}
              </>
            )
          }
        />
      </div>

      {flash && (
        <p
          role={flash.ok ? "status" : "alert"}
          className={`mb-5 rounded-xl border px-3.5 py-2.5 text-sm ${flash.ok ? "border-success/25 bg-success/5 text-success" : "border-ink/20 bg-white text-graphite"}`}
        >
          {flash.text}
        </p>
      )}
      {sp.converted && project && (
        <p
          role="status"
          className="mb-5 rounded-xl border border-success/25 bg-success/5 px-3.5 py-2.5 text-sm text-success"
        >
          {sp.converted === "new"
            ? `Project ${project.ref} created and linked to the client.`
            : `This lead was already converted to ${project.ref}.`}
        </p>
      )}
      {incomplete && (
        <p className="mb-5 rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-sm text-graphite">
          Incomplete enquiry: the visitor saved their answers and asked for a link to finish.
          It&rsquo;s deleted automatically after 90 days if not completed.
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="flex flex-col gap-6">
          <Panel title="Enquiry">
            <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              <Row label="Email">
                <a href={`mailto:${lead.email}`} className="underline underline-offset-2">
                  {lead.email}
                </a>
              </Row>
              <Row label="Service">{lead.service_label ?? "Not sure yet"}</Row>
              {lead.website_url && (
                <Row label="Website">
                  <a
                    href={lead.website_url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="underline underline-offset-2"
                  >
                    {lead.website_url}
                  </a>
                </Row>
              )}
              {describeDetails(lead.details).map((d) => (
                <Row key={d.label} label={d.label}>
                  {d.value}
                </Row>
              ))}
              <Row label={incomplete ? "Saved" : "Submitted"}>
                {fmt(lead.submitted_at ?? lead.created_at)}
              </Row>
            </dl>
            {lead.description && (
              <p className="mt-5 rounded-xl bg-paper p-4 text-sm leading-relaxed whitespace-pre-wrap">
                {lead.description}
              </p>
            )}
            {consents?.length ? (
              <p className="mt-4 text-xs text-stone">
                Consent:{" "}
                {Object.values(
                  consents.reduce<
                    Record<string, { label: string; version: string; first: string; n: number }>
                  >((acc, c) => {
                    const k = `${c.purpose}:${c.notice_version}`;
                    acc[k] ??= {
                      label:
                        c.purpose === "save_and_resume" ? "save & resume" : "contact about enquiry",
                      version: c.notice_version,
                      first: c.granted_at,
                      n: 0,
                    };
                    acc[k].n += 1;
                    return acc;
                  }, {}),
                )
                  .map(
                    (g) =>
                      `${g.label} (notice ${g.version}, ${fmt(g.first)}${g.n > 1 ? `, ${g.n}×` : ""})`,
                  )
                  .join("; ")}
              </p>
            ) : null}
          </Panel>

          <Panel title="Timeline">
            {timeline.length === 0 ? (
              <p className="text-sm text-stone">No activity yet.</p>
            ) : (
              <ol className="flex flex-col gap-4">
                {timeline.map((t) => (
                  <li key={t.key} className="grid grid-cols-[auto_1fr] gap-3 text-sm">
                    <span aria-hidden className="mt-1.5 size-2 rounded-full bg-ink/30" />
                    <div>
                      {t.kind === "activity" ? (
                        <p>{t.a.summary}</p>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <p>
                            Email to {t.e.to_email}:{" "}
                            <Link
                              href={`/admin/emails/${t.e.id}`}
                              className="underline underline-offset-2"
                            >
                              {t.e.subject}
                            </Link>
                          </p>
                          <EmailStatus status={t.e.status} delivery={t.e.delivery_status} />
                          {t.e.status_reason && (
                            <p className="text-xs text-stone">{t.e.status_reason}</p>
                          )}
                          {t.e.status === "failed" && (
                            <form action={retryEmailAction}>
                              <input type="hidden" name="emailId" value={t.e.id} />
                              <button className="text-xs underline underline-offset-2">
                                Retry now
                              </button>
                            </form>
                          )}
                        </div>
                      )}
                      <time className="mt-0.5 block text-xs text-stone" dateTime={t.at}>
                        {fmt(t.at)}
                      </time>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </div>

        <div className="flex flex-col gap-6">
          {!lead.anonymised_at && (
            <Panel title="Status">
              <LeadStatusForm
                leadId={lead.id}
                stage={lead.stage_key}
                priority={lead.priority}
                stages={stages ?? []}
              />
            </Panel>
          )}
          <Panel title="Private notes">
            <p className="-mt-2 mb-4 text-xs text-stone">Only visible to you.</p>
            <NoteForm subjectId={lead.id} action={addLeadNoteAction} />
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

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-stone">{label}</dt>
      <dd className="mt-0.5 break-words">{children}</dd>
    </div>
  );
}
