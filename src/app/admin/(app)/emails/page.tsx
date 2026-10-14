import Link from "next/link";
import { EmailStatus } from "@/components/admin/email-status";
import { EmptyState, PageHeader } from "@/components/admin/shell";
import { cn } from "@/lib/cn";
import { requireAdmin } from "@/server/auth";
import { createSupabaseServerClient } from "@/server/supabase/server";

export const metadata = { title: "Email activity" };

const PAGE_SIZE = 30;
const FILTERS = [
  { key: "", label: "All" },
  { key: "sent", label: "Sent" },
  { key: "failed", label: "Failed" },
  { key: "suppressed", label: "Not sent" },
  { key: "queued", label: "Queued" },
];

export default async function EmailsPage({ searchParams }: PageProps<"/admin/emails">) {
  await requireAdmin();
  const sp = await searchParams;
  const status =
    typeof sp.status === "string" && FILTERS.some((f) => f.key === sp.status) ? sp.status : "";
  const page = Math.max(1, Number(sp.page) || 1);
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("email_messages")
    .select(
      "id, to_email, subject, status, delivery_status, created_at, related_type, related_id",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (status) query = query.eq("status", status);
  const { data, count } = await query;
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const href = (o: { status?: string; page?: number }) =>
    `?${new URLSearchParams({ ...((o.status ?? status) && { status: o.status ?? status }), page: String(o.page ?? 1) })}`;

  return (
    <>
      <PageHeader
        title="Email activity"
        description="Every email the system has sent or tried to send. “Sent” means the provider accepted it; delivery is confirmed separately."
      />
      <nav aria-label="Filter by status" className="mb-4 flex flex-wrap gap-1.5 text-sm">
        {FILTERS.map((f) => (
          <Link
            key={f.key || "all"}
            href={href({ status: f.key, page: 1 })}
            aria-current={f.key === status ? "true" : undefined}
            className={cn(
              "rounded-full border px-3 py-1.5",
              f.key === status
                ? "border-ink bg-ink text-paper"
                : "border-ink/15 bg-white hover:border-ink",
            )}
          >
            {f.label}
          </Link>
        ))}
      </nav>
      {!data?.length ? (
        <EmptyState
          title="No emails"
          body="Emails appear here as enquiries arrive and you send follow-ups."
        />
      ) : (
        <ul className="divide-y divide-ink/[0.07] overflow-hidden rounded-[1.25rem] border border-ink/10 bg-white">
          {data.map((m) => (
            <li key={m.id}>
              <Link
                href={`/admin/emails/${m.id}`}
                className="grid gap-1 px-4 py-3 hover:bg-paper/60 sm:grid-cols-[1.5fr_1fr_auto] sm:items-center sm:gap-4 sm:px-5"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{m.subject}</span>
                  <span className="block truncate text-xs text-stone">{m.to_email}</span>
                </span>
                <EmailStatus status={m.status} delivery={m.delivery_status} />
                <time className="text-xs whitespace-nowrap text-stone" dateTime={m.created_at}>
                  {new Date(m.created_at).toLocaleString("en-GB", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </time>
              </Link>
            </li>
          ))}
        </ul>
      )}
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
  );
}
