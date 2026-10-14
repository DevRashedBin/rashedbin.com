import Link from "next/link";
import { PageHeader, Panel } from "@/components/admin/shell";
import { requireAdmin } from "@/server/auth";
import { createSupabaseServerClient } from "@/server/supabase/server";
import { FaqEditor } from "./faq-editor";

export const metadata = { title: "General FAQs" };

export default async function FaqsPage() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("faqs")
    .select("question, answer")
    .eq("scope", "general")
    .order("position");
  return (
    <>
      <Link href="/admin/content" className="text-sm text-stone hover:underline">
        ← Website content
      </Link>
      <div className="mt-3">
        <PageHeader
          title="General FAQs"
          description="Shown on the homepage and services page, in this order."
        />
      </div>
      <Panel className="max-w-3xl">
        <FaqEditor initial={data ?? []} />
      </Panel>
    </>
  );
}
