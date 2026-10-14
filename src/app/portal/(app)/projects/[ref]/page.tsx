import Link from "next/link";
import { notFound } from "next/navigation";
import { formatMoney } from "@/domain/money/money";
import { formatDate, milestoneProgress } from "@/domain/projects/schema";
import { cn } from "@/lib/cn";
import { requirePortalUser } from "@/server/auth";
import { createSupabaseServerClient } from "@/server/supabase/server";
import { ProgressBar } from "../../progress-bar";

export const metadata = { title: "Project" };

export default async function PortalProjectPage({ params }: PageProps<"/portal/projects/[ref]">) {
  await requirePortalUser();
  const { ref } = await params;
  if (!/^[A-Z0-9]{1,10}-\d{4}-\d{3,}$/.test(ref)) notFound();

  const supabase = await createSupabaseServerClient();
  // RLS: only returns the project if this user belongs to its client. A
  // reference on its own grants nothing.
  const { data: project } = await supabase
    .from("projects")
    .select(
      "id, ref, title, description, status_key, start_date, target_date, value_minor, currency",
    )
    .eq("ref", ref)
    .maybeSingle();
  if (!project) notFound();

  const [{ data: status }, { data: milestones }, { data: updates }] = await Promise.all([
    supabase.from("project_statuses").select("client_label").eq("key", project.status_key).single(),
    supabase
      .from("milestones")
      .select("id, title, description, due_date, completed_at")
      .eq("project_id", project.id)
      .order("position"),
    supabase
      .from("project_updates")
      .select("id, title, body, published_at")
      .eq("project_id", project.id)
      .order("published_at", { ascending: false }),
  ]);
  const progress = milestoneProgress(milestones ?? []);

  return (
    <>
      <Link href="/portal" className="text-sm text-stone hover:underline">
        ← Your projects
      </Link>
      <p className="mt-4 font-mono text-xs text-stone">{project.ref}</p>
      <h1 className="mt-1 text-3xl font-medium tracking-tight">{project.title}</h1>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-ink px-3 py-1 text-sm text-paper">
          {status?.client_label}
        </span>
      </div>

      <dl className="mt-8 grid gap-3 sm:grid-cols-3">
        <Fact label="Start">{formatDate(project.start_date)}</Fact>
        <Fact label="Target completion">{formatDate(project.target_date)}</Fact>
        <Fact label="Agreed value">
          {project.value_minor !== null
            ? formatMoney(project.value_minor, project.currency)
            : "To be confirmed"}
        </Fact>
      </dl>

      {project.description && (
        <p className="mt-6 max-w-2xl leading-relaxed whitespace-pre-wrap text-graphite">
          {project.description}
        </p>
      )}

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <section aria-labelledby="milestones-title">
          <h2 id="milestones-title" className="text-lg font-medium">
            Milestones
          </h2>
          {progress !== null && (
            <div className="mt-4">
              <ProgressBar value={progress} label="Milestones complete" />
            </div>
          )}
          {milestones?.length ? (
            <ol className="mt-5 flex flex-col gap-2">
              {milestones.map((m) => (
                <li key={m.id} className="flex gap-3 rounded-xl border border-ink/10 bg-white p-3">
                  <span
                    aria-hidden
                    className={cn(
                      "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border text-[0.65rem]",
                      m.completed_at ? "border-ink bg-ink text-paper" : "border-ink/30",
                    )}
                  >
                    {m.completed_at ? "✓" : ""}
                  </span>
                  <span>
                    <span className="block text-sm font-medium">
                      {m.title}
                      <span className="sr-only">
                        {m.completed_at ? " (complete)" : " (not complete yet)"}
                      </span>
                    </span>
                    {m.description && (
                      <span className="block text-xs text-graphite">{m.description}</span>
                    )}
                    <span className="block text-xs text-stone">
                      {m.completed_at
                        ? `Completed ${formatDate(m.completed_at)}`
                        : m.due_date
                          ? `Due ${formatDate(m.due_date)}`
                          : ""}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-3 text-sm text-stone">Milestones will appear here.</p>
          )}
        </section>

        <section aria-labelledby="updates-title">
          <h2 id="updates-title" className="text-lg font-medium">
            Updates
          </h2>
          {updates?.length ? (
            <ol className="mt-4 flex flex-col gap-3">
              {updates.map((u) => (
                <li key={u.id} className="rounded-[1.25rem] border border-ink/10 bg-white p-5">
                  <time className="text-xs text-stone" dateTime={u.published_at ?? undefined}>
                    {formatDate(u.published_at)}
                  </time>
                  {u.title && <p className="mt-1 font-medium">{u.title}</p>}
                  <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap">{u.body}</p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-3 text-sm text-stone">No updates yet.</p>
          )}
        </section>
      </div>
    </>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[1.25rem] border border-ink/10 bg-white p-4">
      <dt className="text-xs text-stone">{label}</dt>
      <dd className="mt-1 text-sm font-medium">{children}</dd>
    </div>
  );
}
