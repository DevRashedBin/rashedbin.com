import Link from "next/link";
import { PageHeader, Panel } from "@/components/admin/shell";
import { requireAdmin } from "@/server/auth";
import { createClientAction } from "../actions";
import { ClientForm } from "../client-form";

export const metadata = { title: "New client" };

export default async function NewClientPage() {
  await requireAdmin();
  return (
    <>
      <Link href="/admin/clients" className="text-sm text-stone hover:underline">
        ← Clients
      </Link>
      <div className="mt-3">
        <PageHeader
          title="New client"
          description="Projects and invoices are linked to a client."
        />
      </div>
      <Panel className="max-w-3xl">
        <ClientForm
          action={createClientAction}
          submitLabel="Create client"
          values={{
            displayName: "",
            companyName: "",
            contactName: "",
            billingEmail: "",
            phone: "",
            websiteUrl: "",
            billingAddress: "",
            countryCode: "",
            taxId: "",
            defaultCurrency: "USD",
          }}
        />
      </Panel>
    </>
  );
}
