import Link from "next/link";
import { EmptyState, PageHeader } from "@/components/admin/shell";
import { requireAdmin } from "@/server/auth";
import { createSupabaseServerClient } from "@/server/supabase/server";

export const metadata = { title: "Audit log" };

const PAGE_SIZE = 50;
const TABLES = [
  "clients",
  "client_members",
  "internal_notes",
  "profiles",
  "business_settings",
  "services",
  "faqs",
];

export default async function AuditPage({ searchParams }: PageProps<"/admin/audit">) {
  await requireAdmin();
  const sp = await searchParams;
  const table = typeof sp.table === "string" && TABLES.includes(sp.table) ? sp.table : "";
  const page = Math.max(1, Number(sp.page) || 1);

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("audit_log")
    .select("id, occurred_at, actor_id, actor_role, action, table_name, record_id", {
      count: "exact",
    })
    .order("occurred_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (table) query = query.eq("table_name", table);
  const { data, count } = await query;
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const href = (p: number, t = table) =>
    `?${new URLSearchParams({ ...(t && { table: t }), page: String(p) })}`;

  return (
    <>
      <PageHeader
        title="Audit log"
        description="Every change to clients, settings, content and roles. Entries cannot be edited or deleted."
      />
      <nav aria-label="Filter by record type" className="mb-4 flex flex-wrap gap-2 text-sm">
        {["", ...TABLES].map((t) => (
          <Link
            key={t || "all"}
            href={href(1, t)}
            aria-current={t === table ? "true" : undefined}
            className={`rounded-full border px-3 py-1.5 ${t === table ? "border-ink bg-ink text-paper" : "border-ink/15 hover:border-ink"}`}
          >
            {t ? t.replace("_", " ") : "All"}
          </Link>
        ))}
      </nav>
      {!data?.length ? (
        <EmptyState title="No entries" body="Changes will appear here as they happen." />
      ) : (
        <div className="overflow-x-auto rounded-[1.25rem] border border-ink/10 bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-ink/10 font-mono text-[0.68rem] tracking-wide text-stone uppercase">
              <tr>
                <th scope="col" className="px-5 py-3 font-normal">
                  When
                </th>
                <th scope="col" className="px-5 py-3 font-normal">
                  Action
                </th>
                <th scope="col" className="px-5 py-3 font-normal">
                  Record
                </th>
                <th scope="col" className="px-5 py-3 font-normal">
                  By
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/[0.07]">
              {data.map((a) => (
                <tr key={a.id}>
                  <td className="px-5 py-3 whitespace-nowrap text-stone">
                    {new Date(a.occurred_at).toLocaleString("en-GB", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className="px-5 py-3 font-mono text-xs">{a.action}</td>
                  <td className="px-5 py-3">
                    {a.table_name.replace("_", " ")}
                    {a.record_id && (
                      <span className="ml-2 font-mono text-xs text-stone">
                        {a.record_id.slice(0, 8)}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-xs text-stone">
                    {a.actor_id ? `${a.actor_role} · ${a.actor_id.slice(0, 8)}` : a.actor_role}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {pages > 1 && (
        <nav aria-label="Pagination" className="mt-4 flex justify-end gap-2 text-sm">
          {page > 1 && (
            <Link className="rounded-full border border-ink/15 px-3 py-1.5" href={href(page - 1)}>
              Previous
            </Link>
          )}
          {page < pages && (
            <Link className="rounded-full border border-ink/15 px-3 py-1.5" href={href(page + 1)}>
              Next
            </Link>
          )}
        </nav>
      )}
    </>
  );
}
