import Link from "next/link";
import { EmptyState, PageHeader } from "@/components/admin/shell";
import { ButtonLink } from "@/components/ui/button";
import { requireAdmin } from "@/server/auth";
import { createSupabaseServerClient } from "@/server/supabase/server";

export const metadata = { title: "Clients" };

const PAGE_SIZE = 20;

export default async function ClientsPage({ searchParams }: PageProps<"/admin/clients">) {
  await requireAdmin();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";
  const archived = sp.archived === "1";
  const page = Math.max(1, Number(sp.page) || 1);

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("clients")
    .select(
      "id, display_name, company_name, billing_email, default_currency, created_at, archived_at",
      { count: "exact" },
    )
    .order("display_name")
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  query = archived ? query.not("archived_at", "is", null) : query.is("archived_at", null);
  if (q) {
    // Escape PostgREST filter syntax characters in user input.
    const term = q.replace(/[%,()*\\]/g, " ");
    query = query.or(
      `display_name.ilike.%${term}%,company_name.ilike.%${term}%,billing_email.ilike.%${term}%`,
    );
  }
  const { data: clients, count } = await query;
  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const qs = (p: number) =>
    `?${new URLSearchParams({ ...(q && { q }), ...(archived && { archived: "1" }), page: String(p) })}`;

  return (
    <>
      <PageHeader
        title="Clients"
        description="Billing details for the businesses you work with."
        actions={<ButtonLink href="/admin/clients/new">New client</ButtonLink>}
      />
      <form role="search" className="mb-5 flex flex-col gap-2 sm:flex-row" action="/admin/clients">
        <label htmlFor="client-search" className="sr-only">
          Search clients
        </label>
        <input
          id="client-search"
          name="q"
          defaultValue={q}
          placeholder="Search name, company or email"
          className="w-full rounded-full border border-ink/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-ink sm:max-w-sm"
        />
        {archived && <input type="hidden" name="archived" value="1" />}
        <button className="rounded-full border border-ink/20 px-4 py-2.5 text-sm hover:border-ink">
          Search
        </button>
        <Link
          href={archived ? "/admin/clients" : "/admin/clients?archived=1"}
          className="self-center px-2 text-sm text-stone underline-offset-4 hover:underline"
        >
          {archived ? "Show active" : "Show archived"}
        </Link>
      </form>

      {!clients?.length ? (
        <EmptyState
          title={
            q ? "No clients match your search" : archived ? "No archived clients" : "No clients yet"
          }
          body={
            q
              ? "Try a different name or email."
              : "Add a client to start tracking projects and invoices for them."
          }
          action={
            !q && !archived ? (
              <ButtonLink href="/admin/clients/new">New client</ButtonLink>
            ) : undefined
          }
        />
      ) : (
        <>
          <ul className="divide-y divide-ink/[0.07] rounded-[1.25rem] border border-ink/10 bg-white sm:hidden">
            {clients.map((c) => (
              <li key={c.id}>
                <Link href={`/admin/clients/${c.id}`} className="block px-4 py-3.5">
                  <span className="block font-medium">{c.display_name}</span>
                  <span className="block truncate text-sm text-stone">{c.billing_email}</span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto rounded-[1.25rem] border border-ink/10 bg-white sm:block">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-ink/10 font-mono text-[0.68rem] tracking-wide text-stone uppercase">
                <tr>
                  <th scope="col" className="px-5 py-3 font-normal">
                    Client
                  </th>
                  <th scope="col" className="px-5 py-3 font-normal">
                    Billing email
                  </th>
                  <th scope="col" className="px-5 py-3 font-normal">
                    Currency
                  </th>
                  <th scope="col" className="px-5 py-3 font-normal">
                    Added
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/[0.07]">
                {clients.map((c) => (
                  <tr key={c.id} className="hover:bg-paper/60">
                    <td className="px-5 py-3.5">
                      <Link href={`/admin/clients/${c.id}`} className="font-medium hover:underline">
                        {c.display_name}
                      </Link>
                      {c.company_name && (
                        <span className="block text-xs text-stone">{c.company_name}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-graphite">{c.billing_email}</td>
                    <td className="px-5 py-3.5 font-mono text-xs">{c.default_currency}</td>
                    <td className="px-5 py-3.5 text-stone">
                      {new Date(c.created_at).toLocaleDateString("en-GB", { dateStyle: "medium" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <nav
            aria-label="Pagination"
            className="mt-4 flex items-center justify-between text-sm text-stone"
          >
            <span>
              {total} client{total === 1 ? "" : "s"} · page {page} of {pages}
            </span>
            <span className="flex gap-2">
              {page > 1 && (
                <Link
                  className="rounded-full border border-ink/15 px-3 py-1.5 hover:border-ink"
                  href={qs(page - 1)}
                >
                  Previous
                </Link>
              )}
              {page < pages && (
                <Link
                  className="rounded-full border border-ink/15 px-3 py-1.5 hover:border-ink"
                  href={qs(page + 1)}
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
