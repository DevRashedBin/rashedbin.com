import Link from "next/link";
import { PageHeader, Panel } from "@/components/admin/shell";
import { ButtonLink } from "@/components/ui/button";
import { requireAdmin } from "@/server/auth";
import { createSupabaseServerClient } from "@/server/supabase/server";

export const metadata = { title: "Overview" };

const upcoming = [
  {
    phase: 4,
    title: "Leads & enquiries",
    body: "Website enquiries saved to the CRM, follow-up emails and templates.",
  },
  {
    phase: 5,
    title: "Projects & client portal",
    body: "Projects, milestones, client updates and notifications.",
  },
  {
    phase: 6,
    title: "Invoices & payments",
    body: "Invoices, PDFs, partial payments, receipts and balances.",
  },
];

export default async function AdminOverviewPage() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const [clients, services, audit] = await Promise.all([
    supabase.from("clients").select("id", { count: "exact", head: true }).is("archived_at", null),
    supabase.from("services").select("published"),
    supabase
      .from("audit_log")
      .select("id, occurred_at, action, table_name")
      .order("occurred_at", { ascending: false })
      .limit(8),
  ]);
  const published = services.data?.filter((s) => s.published).length ?? 0;
  const drafts = (services.data?.length ?? 0) - published;

  return (
    <>
      <PageHeader
        title="Overview"
        description="Everyday tasks first. More modules appear here as each phase is completed."
        actions={<ButtonLink href="/admin/clients/new">New client</ButtonLink>}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Active clients" value={clients.count ?? 0} href="/admin/clients" />
        <Stat label="Published services" value={published} href="/admin/content" />
        <Stat label="Draft services" value={drafts} href="/admin/content" />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
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
