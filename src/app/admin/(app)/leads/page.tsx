import Link from "next/link";
import { EmptyState, PageHeader } from "@/components/admin/shell";
import { PRIORITY_LABELS, type Priority } from "@/domain/leads/format";
import { cn } from "@/lib/cn";
import { requireAdmin } from "@/server/auth";
import { createSupabaseServerClient } from "@/server/supabase/server";

export const metadata = { title: "Leads" };

const PAGE_SIZE = 25;
const SORTS = {
  activity: { column: "last_activity_at", label: "Last activity" },
  newest: { column: "created_at", label: "Newest" },
} as const;

export default async function LeadsPage({ searchParams }: PageProps<"/admin/leads">) {
  await requireAdmin();
  const sp = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: stages } = await supabase
    .from("pipeline_stages")
    .select("key, label, kind, position")
    .order("position");

  const stageParam = typeof sp.stage === "string" ? sp.stage : "open";
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";
  const sort = sp.sort === "newest" ? "newest" : "activity";
  const page = Math.max(1, Number(sp.page) || 1);

  // Counts per stage for the tabs.
  const { data: allStages } = await supabase
    .from("leads")
    .select("stage_key")
    .is("anonymised_at", null);
  const counts = new Map<string, number>();
  for (const l of allStages ?? []) counts.set(l.stage_key, (counts.get(l.stage_key) ?? 0) + 1);
  const openKeys = (stages ?? []).filter((s) => s.kind === "open").map((s) => s.key);
  const openCount = openKeys.reduce((n, k) => n + (counts.get(k) ?? 0), 0);

  let query = supabase
    .from("leads")
    .select(
      "id, ref, name, company, email, service_label, stage_key, priority, last_activity_at, created_at, submitted_at",
      {
        count: "exact",
      },
    )
    .is("anonymised_at", null)
    .order(SORTS[sort].column, { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (stageParam === "open") query = query.in("stage_key", openKeys);
  else if (stageParam !== "all") query = query.eq("stage_key", stageParam);
  if (q) {
    const term = q.replace(/[%,()*\\]/g, " ");
    query = query.or(
      `name.ilike.%${term}%,email.ilike.%${term}%,company.ilike.%${term}%,ref.ilike.%${term}%`,
    );
  }
  const { data: leads, count } = await query;
  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const stageLabel = (k: string) => stages?.find((s) => s.key === k)?.label ?? k;
  const href = (o: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    const merged = { stage: stageParam, q, sort, page: 1, ...o };
    for (const [k, v] of Object.entries(merged))
      if (v !== "" && v !== undefined) p.set(k, String(v));
    return `?${p}`;
  };

  const tabs = [
    { key: "open", label: "Open", count: openCount },
    ...(stages ?? []).map((s) => ({ key: s.key, label: s.label, count: counts.get(s.key) ?? 0 })),
    { key: "all", label: "All", count: allStages?.length ?? 0 },
  ];

  return (
    <>
      <PageHeader title="Leads" description="Website enquiries and saved, unfinished enquiries." />
      <nav
        aria-label="Pipeline stages"
        className="-mx-4 mb-4 [scrollbar-width:none] overflow-x-auto px-4 sm:mx-0 sm:px-0"
      >
        <ul className="flex gap-1.5">
          {tabs.map((t) => (
            <li key={t.key} className="shrink-0">
              <Link
                href={href({ stage: t.key })}
                aria-current={t.key === stageParam ? "true" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm",
                  t.key === stageParam
                    ? "border-ink bg-ink text-paper"
                    : "border-ink/15 bg-white hover:border-ink",
                )}
              >
                {t.label}
                <span
                  className={cn(
                    "font-mono text-xs",
                    t.key === stageParam ? "text-paper/60" : "text-stone",
                  )}
                >
                  {t.count}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <form
        role="search"
        action="/admin/leads"
        className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center"
      >
        <input type="hidden" name="stage" value={stageParam} />
        <label htmlFor="lead-search" className="sr-only">
          Search leads
        </label>
        <input
          id="lead-search"
          name="q"
          defaultValue={q}
          placeholder="Search name, email, company or reference"
          className="w-full rounded-full border border-ink/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-ink sm:max-w-sm"
        />
        <label htmlFor="lead-sort" className="sr-only">
          Sort
        </label>
        <select
          id="lead-sort"
          name="sort"
          defaultValue={sort}
          className="rounded-full border border-ink/15 bg-white px-4 py-2.5 text-sm"
        >
          {Object.entries(SORTS).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
        <button className="rounded-full border border-ink/20 px-4 py-2.5 text-sm hover:border-ink">
          Apply
        </button>
      </form>

      {!leads?.length ? (
        <EmptyState
          title={q ? "No leads match your search" : "No leads here yet"}
          body={
            q
              ? "Try a different name, email or reference."
              : "New enquiries from the website appear here automatically."
          }
        />
      ) : (
        <>
          <ul className="divide-y divide-ink/[0.07] overflow-hidden rounded-[1.25rem] border border-ink/10 bg-white">
            {leads.map((l) => (
              <li key={l.id}>
                <Link
                  href={`/admin/leads/${l.id}`}
                  className="grid gap-1 px-4 py-3.5 hover:bg-paper/60 sm:grid-cols-[1.4fr_1fr_auto] sm:items-center sm:gap-4 sm:px-5"
                >
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="truncate font-medium">{l.name}</span>
                      {(l.priority === "high" || l.priority === "urgent") && (
                        <span className="rounded-full bg-ink px-2 py-0.5 text-[0.65rem] text-paper">
                          {PRIORITY_LABELS[l.priority as Priority]}
                        </span>
                      )}
                    </span>
                    <span className="block truncate text-xs text-stone">
                      <span className="font-mono">{l.ref}</span> · {l.company || l.email}
                    </span>
                  </span>
                  <span className="truncate text-sm text-graphite">
                    {l.service_label ?? "Not sure yet"}
                  </span>
                  <span className="flex items-center gap-3 sm:justify-end">
                    <span className="rounded-full border border-ink/15 px-2.5 py-0.5 text-xs">
                      {stageLabel(l.stage_key)}
                    </span>
                    <time
                      className="text-xs whitespace-nowrap text-stone"
                      dateTime={l.last_activity_at}
                    >
                      {new Date(l.last_activity_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })}
                    </time>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <nav
            aria-label="Pagination"
            className="mt-4 flex items-center justify-between text-sm text-stone"
          >
            <span>
              {total} lead{total === 1 ? "" : "s"} · page {page} of {pages}
            </span>
            <span className="flex gap-2">
              {page > 1 && (
                <Link
                  className="rounded-full border border-ink/15 px-3 py-1.5 hover:border-ink"
                  href={href({ page: page - 1 })}
                >
                  Previous
                </Link>
              )}
              {page < pages && (
                <Link
                  className="rounded-full border border-ink/15 px-3 py-1.5 hover:border-ink"
                  href={href({ page: page + 1 })}
                >
                  Next
                </Link>
              )}
            </span>
          </nav>
        </>
      )}
    </>
  );
}
