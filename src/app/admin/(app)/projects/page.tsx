import Link from "next/link";
import { EmptyState, PageHeader } from "@/components/admin/shell";
import { ButtonLink } from "@/components/ui/button";
import { formatDate, isOverdue, milestoneProgress, todayIso } from "@/domain/projects/schema";
import { cn } from "@/lib/cn";
import { requireAdmin } from "@/server/auth";
import { createSupabaseServerClient } from "@/server/supabase/server";

export const metadata = { title: "Projects" };

const PAGE_SIZE = 25;

export default async function ProjectsPage({ searchParams }: PageProps<"/admin/projects">) {
  await requireAdmin();
  const sp = await searchParams;
  const filter = typeof sp.status === "string" ? sp.status : "active";
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";
  const page = Math.max(1, Number(sp.page) || 1);
  const supabase = await createSupabaseServerClient();
  const { data: statuses } = await supabase
    .from("project_statuses")
    .select("key, label, is_terminal")
    .order("position");
  const terminal = (statuses ?? []).filter((s) => s.is_terminal).map((s) => s.key);

  let query = supabase
    .from("projects")
    .select(
      "id, ref, title, status_key, target_date, client:clients(display_name), milestones(completed_at)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (filter === "active") {
    if (terminal.length) query = query.not("status_key", "in", `(${terminal.join(",")})`);
  } else if (filter !== "all") query = query.eq("status_key", filter);
  if (q) {
    const term = q.replace(/[%,()*\\]/g, " ");
    query = query.or(`title.ilike.%${term}%,ref.ilike.%${term}%`);
  }
  const { data: projects, count } = await query;
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const today = todayIso();
  const statusLabel = (k: string) => statuses?.find((s) => s.key === k)?.label ?? k;
  const href = (o: Record<string, string | number>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ status: filter, q, page: 1, ...o }))
      if (v !== "") p.set(k, String(v));
    return `?${p}`;
  };

  return (
    <>
      <PageHeader
        title="Projects"
        description="Active work, deadlines and progress."
        actions={<ButtonLink href="/admin/projects/new">New project</ButtonLink>}
      />
      <nav
        aria-label="Filter by status"
        className="-mx-4 mb-4 [scrollbar-width:none] overflow-x-auto px-4 sm:mx-0 sm:px-0"
      >
        <ul className="flex gap-1.5">
          {[
            { key: "active", label: "Active" },
            ...(statuses ?? []),
            { key: "all", label: "All" },
          ].map((s) => (
            <li key={s.key} className="shrink-0">
              <Link
                href={href({ status: s.key })}
                aria-current={s.key === filter ? "true" : undefined}
                className={cn(
                  "block rounded-full border px-3 py-1.5 text-sm",
                  s.key === filter
                    ? "border-ink bg-ink text-paper"
                    : "border-ink/15 bg-white hover:border-ink",
                )}
              >
                {s.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <form role="search" action="/admin/projects" className="mb-5 flex gap-2">
        <input type="hidden" name="status" value={filter} />
        <label htmlFor="project-search" className="sr-only">
          Search projects
        </label>
        <input
          id="project-search"
          name="q"
          defaultValue={q}
          placeholder="Search title or reference"
          className="w-full rounded-full border border-ink/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-ink sm:max-w-sm"
        />
        <button className="rounded-full border border-ink/20 px-4 py-2.5 text-sm hover:border-ink">
          Search
        </button>
      </form>

      {!projects?.length ? (
        <EmptyState
          title={q ? "No projects match your search" : "No projects here"}
          body="Create a project manually, or convert a lead."
          action={<ButtonLink href="/admin/projects/new">New project</ButtonLink>}
        />
      ) : (
        <>
          <ul className="divide-y divide-ink/[0.07] overflow-hidden rounded-[1.25rem] border border-ink/10 bg-white">
            {projects.map((p) => {
              const progress = milestoneProgress(p.milestones ?? []);
              const overdue = isOverdue(p.target_date, terminal.includes(p.status_key), today);
              const client = Array.isArray(p.client) ? p.client[0] : p.client;
              return (
                <li key={p.id}>
                  <Link
                    href={`/admin/projects/${p.id}`}
                    className="grid gap-1 px-4 py-3.5 hover:bg-paper/60 sm:grid-cols-[1.5fr_1fr_auto] sm:items-center sm:gap-4 sm:px-5"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{p.title}</span>
                      <span className="block truncate text-xs text-stone">
                        <span className="font-mono">{p.ref}</span> · {client?.display_name}
                      </span>
                    </span>
                    <span className="flex items-center gap-2 text-sm">
                      <span className="rounded-full border border-ink/15 px-2.5 py-0.5 text-xs">
                        {statusLabel(p.status_key)}
                      </span>
                      {progress !== null && <span className="text-xs text-stone">{progress}%</span>}
                    </span>
                    <span
                      className={cn(
                        "text-xs whitespace-nowrap",
                        overdue ? "font-medium text-danger" : "text-stone",
                      )}
                    >
                      {p.target_date
                        ? `${overdue ? "Overdue · " : "Due "}${formatDate(p.target_date)}`
                        : "No target date"}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          {pages > 1 && (
            <nav aria-label="Pagination" className="mt-4 flex justify-end gap-2 text-sm">
              {page > 1 && (
                <Link
                  className="rounded-full border border-ink/15 px-3 py-1.5"
                  href={href({ page: page - 1 })}
                >
                  Previous
                </Link>
              )}
              {page < pages && (
                <Link
                  className="rounded-full border border-ink/15 px-3 py-1.5"
                  href={href({ page: page + 1 })}
                >
                  Next
                </Link>
              )}
            </nav>
          )}
        </>
      )}
    </>
  );
}
