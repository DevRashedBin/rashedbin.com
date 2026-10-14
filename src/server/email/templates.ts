import "server-only";
import { firstName, renderTemplate, type TemplateValues } from "@/domain/email/template";
import { createSupabaseServiceClient } from "@/server/supabase/admin";
import { appOrigin } from "./config";

export type RenderedEmail = { subject: string; body: string; missing: string[] };

/** Values available to every template, from business settings. */
export async function baseTemplateValues(): Promise<TemplateValues> {
  const db = createSupabaseServiceClient();
  const { data } = await db
    .from("business_settings")
    .select("business_name, consultation_url")
    .eq("id", true)
    .single();
  return {
    business_name: data?.business_name ?? "Rashed",
    consultation_link: data?.consultation_url ?? "",
  };
}

export function leadTemplateValues(lead: {
  name: string;
  ref: string;
  service_label: string | null;
}): TemplateValues {
  return {
    name: lead.name,
    first_name: firstName(lead.name),
    reference: lead.ref,
    service: lead.service_label ?? "your project",
  };
}

export async function renderStoredTemplate(
  key: string,
  values: TemplateValues,
): Promise<RenderedEmail> {
  const db = createSupabaseServiceClient();
  const { data: tpl } = await db
    .from("email_templates")
    .select("subject, body")
    .eq("key", key)
    .single();
  if (!tpl) throw new Error(`Email template "${key}" not found`);
  const subject = renderTemplate(tpl.subject, values);
  const body = renderTemplate(tpl.body, values);
  return {
    subject: subject.text,
    body: body.text,
    missing: [...new Set([...subject.missing, ...body.missing])],
  };
}

export function adminLeadLink(leadId: string): string {
  return `${appOrigin()}/admin/leads/${leadId}`;
}
