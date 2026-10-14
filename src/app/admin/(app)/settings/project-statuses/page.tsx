import Link from "next/link";
import { PageHeader, Panel } from "@/components/admin/shell";
import { requireAdmin } from "@/server/auth";
import { createSupabaseServerClient } from "@/server/supabase/server";
import { StatusesForm } from "./statuses-form";

export const metadata = { title: "Project statuses" };

export default async function ProjectStatusesPage() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("project_statuses")
    .select("key, label, client_label, position, notify_client_by_default")
    .order("position");
  return (
    <>
      <Link href="/admin/settings" className="text-sm text-stone hover:underline">
        ← Settings
      </Link>
      <div className="mt-3">
        <PageHeader
          title="Project statuses"
          description="Your internal name, what the client sees, and whether changing to this status emails the client by default."
        />
      </div>
      <Panel className="max-w-4xl">
        <StatusesForm statuses={data ?? []} />
      </Panel>
    </>
  );
}
