import Link from "next/link";
import { PageHeader, Panel } from "@/components/admin/shell";
import { requireAdmin } from "@/server/auth";
import { createSupabaseServerClient } from "@/server/supabase/server";
import { ServiceForm } from "../service-form";

export const metadata = { title: "New service" };

export default async function NewServicePage() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { data: all } = await supabase.from("services").select("slug, name").order("position");
  return (
    <>
      <Link href="/admin/content" className="text-sm text-stone hover:underline">
        ← Website content
      </Link>
      <div className="mt-3">
        <PageHeader title="New service" description="Saved as a draft until you publish it." />
      </div>
      <Panel className="max-w-4xl">
        <ServiceForm service={null} otherServices={all ?? []} />
      </Panel>
    </>
  );
}
