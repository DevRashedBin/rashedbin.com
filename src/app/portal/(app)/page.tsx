import { requirePortalUser } from "@/server/auth";
import { createSupabaseServerClient } from "@/server/supabase/server";

export const metadata = { title: "Overview" };

export default async function PortalHomePage() {
  await requirePortalUser();
  const supabase = await createSupabaseServerClient();
  // RLS returns only the client records this user is a member of.
  const { data: clients } = await supabase
    .from("clients")
    .select("id, display_name, company_name")
    .is("archived_at", null)
    .order("display_name");

  return (
    <>
      <h1 className="text-3xl font-medium tracking-tight">Welcome</h1>
      {clients?.length ? (
        <>
          <p className="mt-2 text-graphite">
            You have access to {clients.length === 1 ? "this account" : "these accounts"}:
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {clients.map((c) => (
              <li key={c.id} className="rounded-[1.25rem] border border-ink/10 bg-white p-5">
                <p className="font-medium">{c.display_name}</p>
                {c.company_name && <p className="text-sm text-stone">{c.company_name}</p>}
                <p className="mt-4 text-sm text-graphite">
                  Projects, updates and invoices will appear here once your project is set up.
                </p>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="mt-3 max-w-lg text-graphite">
          Your account isn&rsquo;t linked to a client record yet. If you think this is a mistake,
          reply to your invitation email and I&rsquo;ll sort it out.
        </p>
      )}
    </>
  );
}
