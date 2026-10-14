import Link from "next/link";
import { formatDate, milestoneProgress } from "@/domain/projects/schema";
import { requirePortalUser } from "@/server/auth";
import { createSupabaseServerClient } from "@/server/supabase/server";
import { ProgressBar } from "./progress-bar";

export const metadata = { title: "Your projects" };

export default async function PortalHomePage() {
  await requirePortalUser();
  const supabase = await createSupabaseServerClient();
  // Row Level Security returns only records this user is a member of.
  const [{ data: clients }, { data: projects }, { data: statuses }] = await Promise.all([
    supabase
      .from("clients")
      .select("id, display_name")
      .is("archived_at", null)
      .order("display_name"),
    supabase
      .from("projects")
      .select("id, ref, title, status_key, target_date, client_id, milestones(completed_at)")
      .order("created_at", { ascending: false }),
    supabase.from("project_statuses").select("key, client_label"),
  ]);
  const statusLabel = (k: string) => statuses?.find((s) => s.key === k)?.client_label ?? k;

  if (!clients?.length) {
    return (
      <>
        <h1 className="text-3xl font-medium tracking-tight">Welcome</h1>
        <p className="mt-3 max-w-lg text-graphite">
          Your account isn&rsquo;t linked to a client record yet. If you think this is a mistake,
          reply to your invitation email and I&rsquo;ll sort it out.
        </p>
      </>
    );
  }

  return (
    <>
      <h1 className="text-3xl font-medium tracking-tight">Your projects</h1>
      {clients.map((c) => {
        const own = (projects ?? []).filter((p) => p.client_id === c.id);
        return (
          <section key={c.id} className="mt-8" aria-labelledby={`client-${c.id}`}>
            <h2 id={`client-${c.id}`} className="mb-3 text-sm font-medium text-stone">
              {c.display_name}
            </h2>
            {own.length ? (
              <ul className="grid gap-3 sm:grid-cols-2">
                {own.map((p) => {
                  const progress = milestoneProgress(p.milestones ?? []);
                  return (
                    <li key={p.id}>
                      <Link
                        href={`/portal/projects/${p.ref}`}
                        className="flex h-full flex-col gap-4 rounded-[1.25rem] border border-ink/10 bg-white p-5 transition-colors hover:border-ink/40"
                      >
                        <span>
                          <span className="block font-mono text-xs text-stone">{p.ref}</span>
                          <span className="mt-1 block text-lg font-medium tracking-tight">
                            {p.title}
                          </span>
                        </span>
                        <span className="flex flex-wrap items-center gap-2 text-sm">
                          <span className="rounded-full bg-ink px-2.5 py-0.5 text-xs text-paper">
                            {statusLabel(p.status_key)}
                          </span>
                          {p.target_date && (
                            <span className="text-xs text-stone">
                              Target {formatDate(p.target_date)}
                            </span>
                          )}
                        </span>
                        {progress !== null && (
                          <ProgressBar value={progress} label="Milestones complete" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-graphite">
                Your projects will appear here once they&rsquo;re set up.
              </p>
            )}
          </section>
        );
      })}
    </>
  );
}
