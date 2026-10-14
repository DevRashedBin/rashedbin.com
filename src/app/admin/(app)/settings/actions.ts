"use server";

import { refresh } from "next/cache";
import { submittedValues, type ActionState } from "@/components/admin/action-state";
import { toFieldErrors } from "@/domain/inquiry/schema";
import { businessSettingsSchema } from "@/domain/settings/schema";
import { assertAdmin } from "@/server/auth";
import { createSupabaseServerClient } from "@/server/supabase/server";

export async function saveSettingsAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await assertAdmin();
  const parsed = businessSettingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      errors: toFieldErrors(parsed.error),
      values: submittedValues(formData),
    };
  }
  const d = parsed.data;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("business_settings")
    .update({
      business_name: d.businessName,
      legal_name: d.legalName,
      contact_email: d.contactEmail,
      phone: d.phone,
      address: d.address,
      website: d.website,
      tax_id: d.taxId,
      default_currency: d.defaultCurrency,
      invoice_prefix: d.invoicePrefix,
      project_prefix: d.projectPrefix,
      number_padding: d.numberPadding,
      default_payment_terms_days: d.defaultPaymentTermsDays,
      invoice_footer: d.invoiceFooter,
      default_terms: d.defaultTerms,
      updated_by: user.id,
    })
    .eq("id", true)
    .select("id");
  if (error || !data?.length) {
    return {
      status: "error",
      message: "Settings could not be saved. Please try again.",
      values: submittedValues(formData),
    };
  }
  refresh();
  return { status: "success", message: "Settings saved." };
}
