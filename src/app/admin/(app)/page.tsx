import Link from "next/link";
import { PageHeader, Panel } from "@/components/admin/shell";
import { ButtonLink } from "@/components/ui/button";
import { requireAdmin } from "@/server/auth";
import { formatDate, upcomingDeadlines } from "@/domain/projects/schema";
import { createSupabaseServerClient } from "@/server/supabase/server";

export const metadata = { title: "Overview" };

const upcoming = [
  {
    phase: 6,
    title: "Invoices & payments",
    body: "Invoices, PDFs, partial payments, receipts and balances.",
  },
];

export default async function AdminOverviewPage() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const [
    clients,
    services,
    audit,
    newLeads,
    incompleteLeads,
    recentLeads,
    failedEmails,
    projects,
    openMilestones,
    statuses,
  ] = await Promise.all([
    supabase.from("clients").select("id", { count: "exact", head: true }).is("archived_at", null),
    supabase.from("services").select("published"),
    supabase
      .from("audit_log")
      .select("id, occurred_at, action, table_name")
      .order("occurred_at", { ascending: false })
      .limit(8),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("stage_key", "new"),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("stage_key", "incomplete"),
    supabase
      .from("leads")
      .select("id, ref, name, service_label, created_at")
      .not("submitted_at", "is", null)
      .is("anonymised_at", null)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("email_messages")
      .select("id", { count: "exact", head: true })
      .eq("status", "failed"),
    supabase.from("projects").select("id, ref, title, target_date, status_key"),
    supabase
      .from("milestones")
      .select("id, title, due_date, project:projects(id, ref, title)")
      .is("completed_at", null)
      .not("due_date", "is", null)
      .order("due_date")
      .limit(100),
    supabase.from("project_statuses").select("key, is_terminal"),
  ]);
  const published = services.data?.filter((s) => s.published).length ?? 0;
  const drafts = (services.data?.length ?? 0) - published;
  const terminal = new Set((statuses.data ?? []).filter((s) => s.is_terminal).map((s) => s.key));
  const activeProjects = (projects.data ?? []).filter((p) => !terminal.has(p.status_key));
  const deadlines = upcomingDeadlines(
    (projects.data ?? []).map((p) => ({ ...p, active: !terminal.has(p.status_key) })),
    (openMilestones.data ?? []).map((m) => ({
      id: m.id,
      title: m.title,
      due_date: m.due_date!,
      project: Array.isArray(m.project) ? (m.project[0] ?? null) : m.project,
    })),
  );
  const overdueCount = deadlines.filter((d) => d.overdue).length;

  return (
    <>
      <PageHeader
        title="Overview"
        description="Everyday tasks first. More modules appear here as each phase is completed."
        actions={
          <>
            <ButtonLink href="/admin/leads" variant="outline">
              View leads
            </ButtonLink>
            <ButtonLink href="/admin/clients/new">New client</ButtonLink>
          </>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label="New enquiries" value={newLeads.count ?? 0} href="/admin/leads?stage=new" />
        <Stat
          label="Incomplete enquiries"
          value={incompleteLeads.count ?? 0}
          href="/admin/leads?stage=incomplete"
        />
        <Stat label="Active projects" value={activeProjects.length} href="/admin/projects" />
        <Stat label="Overdue deadlines" value={overdueCount} href="/admin/projects" />
        <Stat
          label="Failed emails"
          value={failedEmails.count ?? 0}
          href="/admin/emails?status=failed"
        />
      </div>
      <p className="mt-3 text-xs text-stone">
        {clients.count ?? 0} active client{clients.count === 1 ? "" : "s"} · {published} published
        service{published === 1 ? "" : "s"}
        {drafts ? `, ${drafts} draft${drafts === 1 ? "" : "s"}` : ""}.
      </p>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Panel title="Deadlines (next 14 days)">
          {deadlines.length ? (
            <ul className="divide-y divide-ink/10 text-sm">
              {deadlines.slice(0, 10).map((d) => (
                <li key={d.key}>
                  <Link href={d.href} className="flex justify-between gap-4 py-2.5 hover:underline">
                    <span className="min-w-0 truncate">{d.label}</span>
                    <span
                      className={`shrink-0 text-xs ${d.overdue ? "font-medium text-danger" : "text-stone"}`}
                    >
                      {d.overdue ? "Overdue · " : ""}
                      {formatDate(d.date)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-stone">Nothing due in the next two weeks.</p>
          )}
        </Panel>
        <Panel title="Latest enquiries">
          {recentLeads.data?.length ? (
            <ul className="divide-y divide-ink/10 text-sm">
              {recentLeads.data.map((l) => (
                <li key={l.id}>
                  <Link
                    href={`/admin/leads/${l.id}`}
                    className="flex justify-between gap-4 py-2.5 hover:underline"
                  >
                    <span className="min-w-0 truncate">
                      {l.name}{" "}
                      <span className="text-stone">· {l.service_label ?? "Not sure yet"}</span>
                    </span>
                    <span className="shrink-0 font-mono text-xs text-stone">{l.ref}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-stone">No enquiries yet.</p>
          )}
        </Panel>
        <Panel title="Recent activity">
          {audit.data?.length ? (
            <ul className="divide-y divide-ink/10 text-sm">
              {audit.data.map((a) => (
                <li key={a.id} className="flex justify-between gap-4 py-2.5">
                  <span>
                    <span className="font-mono text-xs text-stone">{a.action}</span>{" "}
                    {a.table_name.replace("_", " ")}
                  </span>
                  <time className="shrink-0 text-xs text-stone" dateTime={a.occurred_at}>
                    {new Date(a.occurred_at).toLocaleString("en-GB", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </time>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-stone">No activity yet.</p>
          )}
          <Link
            href="/admin/audit"
            className="mt-4 inline-block text-sm underline underline-offset-4"
          >
            View audit log
          </Link>
        </Panel>
        <Panel title="Coming next">
          <ul className="flex flex-col gap-4">
            {upcoming.map((u) => (
              <li key={u.phase} className="flex gap-3">
                <span className="h-fit shrink-0 rounded-full border border-ink/15 px-2 py-0.5 font-mono text-[0.65rem]">
                  Phase {u.phase}
                </span>
                <span>
                  <span className="block text-sm font-medium">{u.title}</span>
                  <span className="block text-xs text-stone">{u.body}</span>
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}

function Stat({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link
      href={href}
      className="rounded-[1.25rem] border border-ink/10 bg-white p-5 transition-colors hover:border-ink/40"
    >
      <span className="block text-sm text-stone">{label}</span>
      <span className="mt-2 block text-3xl font-medium tracking-tight">{value}</span>
    </Link>
  );
}
