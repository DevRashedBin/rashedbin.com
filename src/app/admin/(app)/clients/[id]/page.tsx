import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { PageHeader, Panel } from "@/components/admin/shell";
import { requireAdmin } from "@/server/auth";
import { createSupabaseServerClient } from "@/server/supabase/server";
import { setClientArchivedAction, updateClientAction } from "../actions";
import { ClientForm } from "../client-form";
import { NoteForm } from "./note-form";

export const metadata = { title: "Client" };

export default async function ClientDetailPage({
  params,
  searchParams,
}: PageProps<"/admin/clients/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  if (!z.uuid().safeParse(id).success) notFound();

  const supabase = await createSupabaseServerClient();
  const [{ data: client }, { data: notes }, { data: members }] = await Promise.all([
    supabase.from("clients").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("internal_notes")
      .select("id, body, created_at")
      .eq("subject_type", "client")
      .eq("subject_id", id)
      .order("created_at", { ascending: false }),
    supabase.from("client_members").select("user_id, created_at").eq("client_id", id),
  ]);
  if (!client) notFound();
  const archived = Boolean(client.archived_at);

  return (
    <>
      <Link href="/admin/clients" className="text-sm text-stone hover:underline">
        ← Clients
      </Link>
      <div className="mt-3">
        <PageHeader
          title={client.display_name}
          description={
            archived
              ? "Archived — hidden from active lists. Records are kept."
              : client.billing_email
          }
          actions={
            <ConfirmAction
              action={setClientArchivedAction}
              hidden={{ id: client.id, archive: String(!archived) }}
              label={archived ? "Restore client" : "Archive client"}
              title={archived ? "Restore this client?" : "Archive this client?"}
              body={
                archived
                  ? "The client will appear in active lists again."
                  : "Archived clients are hidden from active lists. Nothing is deleted, and you can restore them at any time."
              }
              confirmLabel={archived ? "Restore" : "Archive"}
            />
          }
        />
      </div>
      {sp.created === "1" && (
        <p
          role="status"
          className="mb-5 rounded-xl border border-success/25 bg-success/5 px-3.5 py-2.5 text-sm text-success"
        >
          Client created.
        </p>
      )}
      {sp.error && (
        <p
          role="alert"
          className="mb-5 rounded-xl border border-danger/25 bg-danger/5 px-3.5 py-2.5 text-sm text-danger"
        >
          {sp.error === "duplicate"
            ? "This client can't be restored because another active client uses the same billing email."
            : "That change could not be saved. Please try again."}
        </p>
      )}
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Panel title="Details">
          <ClientForm
            action={updateClientAction}
            submitLabel="Save changes"
            values={{
              id: client.id,
              displayName: client.display_name,
              companyName: client.company_name ?? "",
              contactName: client.contact_name ?? "",
              billingEmail: client.billing_email,
              phone: client.phone ?? "",
              websiteUrl: client.website_url ?? "",
              billingAddress: client.billing_address ?? "",
              countryCode: client.country_code ?? "",
              taxId: client.tax_id ?? "",
              defaultCurrency: client.default_currency,
            }}
          />
        </Panel>
        <div className="flex flex-col gap-6">
          <Panel title="Private notes">
            <p className="-mt-2 mb-4 text-xs text-stone">
              Only visible to you. Never shown in the client portal.
            </p>
            <NoteForm clientId={client.id} />
            <ul className="mt-5 flex flex-col gap-3">
              {notes?.map((n) => (
                <li key={n.id} className="rounded-xl bg-paper p-3 text-sm">
                  <p className="whitespace-pre-wrap">{n.body}</p>
                  <time className="mt-1.5 block text-xs text-stone" dateTime={n.created_at}>
                    {new Date(n.created_at).toLocaleString("en-GB", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </time>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Portal access">
            <p className="text-sm text-graphite">
              {members?.length
                ? `${members.length} portal user${members.length === 1 ? "" : "s"} linked.`
                : "No portal users yet."}{" "}
              Inviting clients to the portal arrives with projects in Phase 5.
            </p>
          </Panel>
        </div>
      </div>
    </>
  );
}
