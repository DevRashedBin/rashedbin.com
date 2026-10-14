import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, Panel } from "@/components/admin/shell";
import { serviceFromRow } from "@/domain/content/service";
import { requireAdmin } from "@/server/auth";
import { createSupabaseServerClient } from "@/server/supabase/server";
import { ServiceForm } from "../service-form";

export const metadata = { title: "Edit service" };

export default async function EditServicePage({
  params,
}: PageProps<"/admin/content/services/[slug]">) {
  await requireAdmin();
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();
  const [{ data: row }, { data: all }] = await Promise.all([
    supabase.from("services").select("*").eq("slug", slug).maybeSingle(),
    supabase.from("services").select("slug, name").order("position"),
  ]);
  if (!row) notFound();

  return (
    <>
      <Link href="/admin/content" className="text-sm text-stone hover:underline">
        ← Website content
      </Link>
      <div className="mt-3">
        <PageHeader title={row.name} description={`/services/${row.slug}`} />
      </div>
      <Panel className="max-w-4xl">
        <ServiceForm
          service={serviceFromRow(row)}
          otherServices={(all ?? []).filter((s) => s.slug !== row.slug)}
        />
      </Panel>
    </>
  );
}
