import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, Panel } from "@/components/admin/shell";
import { TEMPLATE_VARIABLES } from "@/domain/email/template";
import { requireAdmin } from "@/server/auth";
import { createSupabaseServerClient } from "@/server/supabase/server";
import { TemplateForm } from "./template-form";

export const metadata = { title: "Edit template" };

export default async function TemplatePage({ params }: PageProps<"/admin/templates/[key]">) {
  await requireAdmin();
  const { key } = await params;
  const supabase = await createSupabaseServerClient();
  const [{ data: t }, { data: settings }] = await Promise.all([
    supabase.from("email_templates").select("*").eq("key", key).maybeSingle(),
    supabase
      .from("business_settings")
      .select("business_name, consultation_url")
      .eq("id", true)
      .single(),
  ]);
  if (!t) notFound();
  const sample = {
    first_name: "Alex",
    name: "Alex Morgan",
    service: "Website Redesign and Modernisation",
    reference: "L-2026-0042",
    consultation_link: settings?.consultation_url || "{{consultation_link}}",
    business_name: settings?.business_name ?? "Rashed",
    resume_link: "https://rashedbin.com/start-a-project/resume/…",
    lead_summary: "Reference: L-2026-0042\nName: Alex Morgan\n…",
    admin_lead_link: "https://rashedbin.com/admin/leads/…",
  };
  return (
    <>
      <Link href="/admin/templates" className="text-sm text-stone hover:underline">
        ← Email templates
      </Link>
      <div className="mt-3">
        <PageHeader title={t.name} description={t.description ?? undefined} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Panel>
          <TemplateForm
            template={{ key: t.key, name: t.name, subject: t.subject, body: t.body }}
            sample={sample}
          />
        </Panel>
        <Panel title="Variables">
          <ul className="flex flex-col gap-2 text-sm">
            {Object.entries(TEMPLATE_VARIABLES).map(([k, v]) => (
              <li key={k}>
                <code className="rounded bg-paper px-1.5 py-0.5 text-xs">{`{{${k}}}`}</code>
                <span className="ml-2 text-stone">{v}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
