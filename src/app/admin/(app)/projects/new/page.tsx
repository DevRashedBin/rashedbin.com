import Link from "next/link";
import { EmptyState, PageHeader, Panel } from "@/components/admin/shell";
import { ButtonLink } from "@/components/ui/button";
import { requireAdmin } from "@/server/auth";
import { createSupabaseServerClient } from "@/server/supabase/server";
import { createProjectAction } from "../actions";
import { ProjectForm } from "../project-form";

export const metadata = { title: "New project" };

export default async function NewProjectPage({ searchParams }: PageProps<"/admin/projects/new">) {
  await requireAdmin();
  const sp = await searchParams;
  const supabase = await createSupabaseServerClient();
  const [{ data: clients }, { data: statuses }, { data: services }, { data: settings }] =
    await Promise.all([
      supabase
        .from("clients")
        .select("id, display_name, default_currency")
        .is("archived_at", null)
        .order("display_name"),
      supabase.from("project_statuses").select("key, label").order("position"),
      supabase.from("services").select("slug, name").order("position"),
      supabase.from("business_settings").select("default_currency").eq("id", true).single(),
    ]);
  const preselected =
    typeof sp.clientId === "string" ? clients?.find((c) => c.id === sp.clientId) : undefined;

  return (
    <>
      <Link href="/admin/projects" className="text-sm text-stone hover:underline">
        ← Projects
      </Link>
      <div className="mt-3">
        <PageHeader
          title="New project"
          description="A reference number is assigned automatically."
        />
      </div>
      {!clients?.length ? (
        <EmptyState
          title="Add a client first"
          body="Projects belong to a client."
          action={<ButtonLink href="/admin/clients/new">New client</ButtonLink>}
        />
      ) : (
        <Panel className="max-w-3xl">
          <ProjectForm
            action={createProjectAction}
            submitLabel="Create project"
            clients={clients.map((c) => ({ value: c.id, label: c.display_name }))}
            statuses={(statuses ?? []).map((s) => ({ value: s.key, label: s.label }))}
            services={(services ?? []).map((s) => ({ value: s.slug, label: s.name }))}
            values={{
              clientId: preselected?.id,
              statusKey: "confirmed",
              title: "",
              description: "",
              serviceSlug: "",
              currency: preselected?.default_currency ?? settings?.default_currency ?? "USD",
              value: "",
              startDate: "",
              targetDate: "",
            }}
          />
        </Panel>
      )}
    </>
  );
}
