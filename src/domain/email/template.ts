/**
 * Email template rendering. Templates are plain text with {{variable}}
 * placeholders; HTML is generated from the rendered text so the two versions
 * always say the same thing. Pure module.
 */

export const TEMPLATE_VARIABLES = {
  first_name: "Recipient's first name",
  name: "Recipient's full name",
  service: "Service they enquired about",
  reference: "Enquiry or project reference",
  consultation_link: "Your booking link (Settings)",
  business_name: "Your business name (Settings)",
  resume_link: "Link to finish a saved enquiry (system emails only)",
  lead_summary: "Summary of the enquiry (admin alert only)",
  admin_lead_link: "Dashboard link to the enquiry (admin alert only)",
  project_title: "Project title (project emails)",
  project_reference: "Project reference, e.g. RB-2026-0001 (project emails)",
  project_status: "Status as the client sees it (project emails)",
  update_body: "Text of the project update (update emails)",
  milestone_title: "Milestone name (milestone emails)",
  portal_link: "Link to the client area",
} as const;

export type TemplateVariable = keyof typeof TEMPLATE_VARIABLES;
export type TemplateValues = Partial<Record<TemplateVariable, string>>;

const PLACEHOLDER = /\{\{\s*([a-z_]+)\s*\}\}/g;

/** Variables referenced by a template. */
export function variablesIn(text: string): string[] {
  return [...new Set([...text.matchAll(PLACEHOLDER)].map((m) => m[1]))];
}

/**
 * Replaces placeholders. Unknown or empty variables are reported in `missing`
 * and rendered as an empty string, so a send can be blocked before it goes out.
 */
export function renderTemplate(
  text: string,
  values: TemplateValues,
): { text: string; missing: string[] } {
  const missing = new Set<string>();
  const out = text.replace(PLACEHOLDER, (_, key: string) => {
    const v = (values as Record<string, string | undefined>)[key];
    if (v === undefined || v.trim() === "") {
      missing.add(key);
      return "";
    }
    return v;
  });
  return { text: out, missing: [...missing] };
}

export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? "";
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Plain text → minimal, safe HTML email body with branded wrapper. */
export function textToHtml(text: string, businessName: string): string {
  const paragraphs = text
    .trim()
    .split(/\n{2,}/)
    .map((p) => {
      const html = escapeHtml(p)
        .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:#0b0b0b">$1</a>')
        .replace(/\n/g, "<br>");
      return `<p style="margin:0 0 16px;line-height:1.6">${html}</p>`;
    })
    .join("");
  return `<!doctype html><html><body style="margin:0;padding:24px 12px;background:#f6f5f1;font-family:Helvetica,Arial,sans-serif;color:#0b0b0b;font-size:15px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center"><table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;padding:28px" cellpadding="0" cellspacing="0"><tr><td>${paragraphs}</td></tr></table><p style="margin:16px 0 0;font-size:12px;color:#6f6e69">${escapeHtml(businessName)}</p></td></tr></table></body></html>`;
}
