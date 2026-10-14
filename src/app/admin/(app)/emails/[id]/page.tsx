import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { EmailStatus } from "@/components/admin/email-status";
import { PageHeader, Panel } from "@/components/admin/shell";
import { requireAdmin } from "@/server/auth";
import { createSupabaseServerClient } from "@/server/supabase/server";
import { retryEmailAction } from "../../leads/actions";

export const metadata = { title: "Email" };

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "—";

export default async function EmailPage({ params }: PageProps<"/admin/emails/[id]">) {
  await requireAdmin();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const supabase = await createSupabaseServerClient();
  const { data: m } = await supabase.from("email_messages").select("*").eq("id", id).maybeSingle();
  if (!m) notFound();

  return (
    <>
      <Link href="/admin/emails" className="text-sm text-stone hover:underline">
        ← Email activity
      </Link>
      <div className="mt-3">
        <PageHeader title={m.subject} description={`To ${m.to_email}`} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Panel title="Message">
          <pre className="font-sans text-sm leading-relaxed whitespace-pre-wrap">{m.body_text}</pre>
        </Panel>
        <Panel title="Status">
          <EmailStatus status={m.status} delivery={m.delivery_status} />
          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm">
            <dt className="text-stone">From</dt>
            <dd className="break-all">{m.from_email}</dd>
            <dt className="text-stone">Reply-to</dt>
            <dd className="break-all">{m.reply_to ?? "—"}</dd>
            <dt className="text-stone">Created</dt>
            <dd>{fmt(m.created_at)}</dd>
            <dt className="text-stone">Sent</dt>
            <dd>{fmt(m.sent_at)}</dd>
            <dt className="text-stone">Attempts</dt>
            <dd>{m.attempts}</dd>
            <dt className="text-stone">Provider</dt>
            <dd>{m.provider ?? "—"}</dd>
            {m.status_reason && (
              <>
                <dt className="text-stone">Detail</dt>
                <dd>{m.status_reason}</dd>
              </>
            )}
            {m.next_attempt_at && (
              <>
                <dt className="text-stone">Next retry</dt>
                <dd>{fmt(m.next_attempt_at)}</dd>
              </>
            )}
          </dl>
          {m.related_type === "lead" && m.related_id && (
            <Link
              href={`/admin/leads/${m.related_id}`}
              className="mt-4 inline-block text-sm underline underline-offset-2"
            >
              Open lead
            </Link>
          )}
          {m.status === "failed" && (
            <form action={retryEmailAction} className="mt-4">
              <input type="hidden" name="emailId" value={m.id} />
              <button className="rounded-full border border-ink/20 px-4 py-2 text-sm hover:border-ink">
                Retry now
              </button>
            </form>
          )}
        </Panel>
      </div>
    </>
  );
}
