import Link from "next/link";
import { PageHeader, Panel } from "@/components/admin/shell";
import { requireAdmin } from "@/server/auth";
import { createSupabaseServerClient } from "@/server/supabase/server";

export const metadata = { title: "Email templates" };

export default async function TemplatesPage() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("email_templates")
    .select("key, name, description, category, updated_at")
    .order("name");
  const groups = [
    {
      title: "Follow-up templates",
      body: "Used when you follow up with a lead.",
      items: data?.filter((t) => t.category === "lead") ?? [],
    },
    {
      title: "Automatic emails",
      body: "Sent by the system. Edit the wording, not the purpose.",
      items: data?.filter((t) => t.category === "system") ?? [],
    },
  ];
  return (
    <>
      <PageHeader
        title="Email templates"
        description="Wording for follow-ups and automatic emails. Use {{variables}} to personalise."
      />
      <div className="grid gap-6 xl:grid-cols-2">
        {groups.map((g) => (
          <Panel key={g.title} title={g.title}>
            <p className="-mt-2 mb-4 text-xs text-stone">{g.body}</p>
            <ul className="divide-y divide-ink/10">
              {g.items.map((t) => (
                <li key={t.key}>
                  <Link href={`/admin/templates/${t.key}`} className="block py-3 hover:underline">
                    <span className="block text-sm font-medium">{t.name}</span>
                    {t.description && (
                      <span className="block text-xs text-stone">{t.description}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        ))}
      </div>
    </>
  );
}
