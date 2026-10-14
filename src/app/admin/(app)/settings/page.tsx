import Link from "next/link";
import { PageHeader, Panel } from "@/components/admin/shell";
import { requireAdmin } from "@/server/auth";
import { createSupabaseServerClient } from "@/server/supabase/server";
import { SettingsForm } from "./settings-form";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("business_settings").select("*").eq("id", true).single();
  if (!data) throw new Error("Business settings row is missing");
  return (
    <>
      <PageHeader
        title="Settings"
        description="Business details used on invoices, emails and the client portal."
        actions={
          <Link
            href="/admin/settings/pipeline"
            className="rounded-full border border-ink/20 px-4 py-2 text-sm hover:border-ink"
          >
            Pipeline stages
          </Link>
        }
      />
      <Panel className="max-w-3xl">
        <SettingsForm
          values={{
            businessName: data.business_name,
            legalName: data.legal_name ?? "",
            contactEmail: data.contact_email ?? "",
            notificationEmail: data.notification_email ?? "",
            consultationUrl: data.consultation_url ?? "",
            phone: data.phone ?? "",
            address: data.address ?? "",
            website: data.website ?? "",
            taxId: data.tax_id ?? "",
            defaultCurrency: data.default_currency,
            invoicePrefix: data.invoice_prefix,
            projectPrefix: data.project_prefix,
            numberPadding: String(data.number_padding),
            defaultPaymentTermsDays: String(data.default_payment_terms_days),
            invoiceFooter: data.invoice_footer ?? "",
            defaultTerms: data.default_terms ?? "",
          }}
        />
      </Panel>
    </>
  );
}
