import { randomUUID } from "node:crypto";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { PageHeader, Panel } from "@/components/admin/shell";
import { firstName, renderTemplate } from "@/domain/email/template";
import { cn } from "@/lib/cn";
import { requireAdmin } from "@/server/auth";
import { createSupabaseServerClient } from "@/server/supabase/server";
import { ComposeForm } from "./compose-form";

export const metadata = { title: "Follow up" };

export default async function FollowUpPage({
  params,
  searchParams,
}: PageProps<"/admin/leads/[id]/follow-up">) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  if (!z.uuid().safeParse(id).success) notFound();

  const supabase = await createSupabaseServerClient();
  const [{ data: lead }, { data: templates }, { data: settings }] = await Promise.all([
    supabase
      .from("leads")
      .select("id, ref, name, email, service_label, anonymised_at")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("email_templates")
      .select("key, name, description, subject, body")
      .eq("category", "lead")
      .order("name"),
    supabase
      .from("business_settings")
      .select("business_name, consultation_url")
      .eq("id", true)
      .single(),
  ]);
  if (!lead || lead.anonymised_at) notFound();

  const selectedKey =
    typeof sp.template === "string" && templates?.some((t) => t.key === sp.template)
      ? sp.template
      : (templates?.find((t) => t.key === "initial_response")?.key ?? templates?.[0]?.key);
  const template = templates?.find((t) => t.key === selectedKey);

  const values = {
    name: lead.name,
    first_name: firstName(lead.name),
    service: lead.service_label ?? "your project",
    reference: lead.ref,
    business_name: settings?.business_name ?? "Rashed",
    consultation_link: settings?.consultation_url ?? "",
  };
  // Missing values stay as visible {{placeholders}} so they can't be sent by accident.
  const fill = (text: string) => {
    const r = renderTemplate(text, values);
    let out = text;
    for (const [k, v] of Object.entries(values))
      if (v) out = out.replace(new RegExp(`\\{\\{\\s*${k}\\s*\\}\\}`, "g"), v);
    return { text: out, missing: r.missing };
  };
  const subject = template ? fill(template.subject) : { text: "", missing: [] };
  const body = template ? fill(template.body) : { text: "", missing: [] };
  const missing = [...new Set([...subject.missing, ...body.missing])];

  return (
    <>
      <Link href={`/admin/leads/${lead.id}`} className="text-sm text-stone hover:underline">
        ← {lead.name}
      </Link>
      <div className="mt-3">
        <PageHeader
          title="Follow up"
          description={`To ${lead.name} <${lead.email}> · ${lead.ref}`}
        />
      </div>
      <div className="grid gap-6 xl:grid-cols-[260px_1fr]">
        <nav aria-label="Templates">
          <p className="mb-2 text-xs text-stone">Template</p>
          <ul className="flex gap-1.5 overflow-x-auto xl:flex-col">
            {templates?.map((t) => (
              <li key={t.key} className="shrink-0">
                <Link
                  href={`?template=${t.key}`}
                  aria-current={t.key === selectedKey ? "true" : undefined}
                  className={cn(
                    "block rounded-xl border px-3 py-2 text-sm",
                    t.key === selectedKey
                      ? "border-ink bg-ink text-paper"
                      : "border-ink/10 bg-white hover:border-ink/40",
                  )}
                >
                  {t.name}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/admin/templates"
            className="mt-3 inline-block text-xs text-stone underline underline-offset-2"
          >
            Edit templates
          </Link>
        </nav>
        <Panel>
          {missing.includes("consultation_link") && (
            <p className="mb-4 rounded-xl border border-ink/15 bg-paper px-3.5 py-2.5 text-sm">
              Your booking link isn&rsquo;t set, so <code>{"{{consultation_link}}"}</code> is left
              in the message.{" "}
              <Link href="/admin/settings" className="underline underline-offset-2">
                Add it in Settings
              </Link>{" "}
              or edit the text below.
            </p>
          )}
          <ComposeForm
            key={selectedKey}
            leadId={lead.id}
            to={`${lead.name} <${lead.email}>`}
            templateKey={selectedKey ?? ""}
            idempotencyKey={randomUUID()}
            subject={subject.text}
            body={body.text}
          />
        </Panel>
      </div>
    </>
  );
}
