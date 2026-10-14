import Link from "next/link";
import { PageHeader, Panel } from "@/components/admin/shell";
import { requireAdmin } from "@/server/auth";
import { createSupabaseServerClient } from "@/server/supabase/server";
import { StagesForm } from "./stages-form";

export const metadata = { title: "Pipeline stages" };

export default async function PipelinePage() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const [{ data: stages }, { data: leads }] = await Promise.all([
    supabase
      .from("pipeline_stages")
      .select("key, label, position, kind, is_system")
      .order("position"),
    supabase.from("leads").select("stage_key"),
  ]);
  const inUse = new Set((leads ?? []).map((l) => l.stage_key));
  return (
    <>
      <Link href="/admin/settings" className="text-sm text-stone hover:underline">
        ← Settings
      </Link>
      <div className="mt-3">
        <PageHeader
          title="Pipeline stages"
          description="Rename and reorder stages, or add your own. Core stages (new, incomplete, won, lost) drive automation and can't be removed."
        />
      </div>
      <Panel className="max-w-2xl">
        <StagesForm stages={(stages ?? []).map((s) => ({ ...s, inUse: inUse.has(s.key) }))} />
      </Panel>
    </>
  );
}
