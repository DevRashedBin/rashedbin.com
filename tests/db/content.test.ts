import { describe, expect, it } from "vitest";
import { faqSchema, serviceFromRow, type Service } from "@/domain/content/service";
import { SERVICE_OPTIONS } from "@/domain/inquiry/schema";
import { anonClient } from "../helpers/supabase";

/** Integrity rules for the published website content stored in the database. */
async function publishedServices(): Promise<Service[]> {
  const { data, error } = await anonClient()
    .from("services")
    .select("*")
    .eq("published", true)
    .order("position");
  if (error) throw error;
  return data.map(serviceFromRow);
}

describe("published service content", () => {
  it("every row passes the content schema", async () => {
    const services = await publishedServices();
    expect(services.length).toBeGreaterThanOrEqual(8);
  });

  it("has unique meta titles and descriptions within search-result limits", async () => {
    const services = await publishedServices();
    expect(new Set(services.map((s) => s.metaTitle)).size).toBe(services.length);
    expect(new Set(services.map((s) => s.metaDescription)).size).toBe(services.length);
    for (const s of services) {
      expect(`${s.metaTitle} | Rashed`.length, s.slug).toBeLessThanOrEqual(60);
      expect(s.metaDescription.length, s.slug).toBeGreaterThanOrEqual(110);
    }
  });

  it("links only to related services that are published, never to itself", async () => {
    const services = await publishedServices();
    const slugs = new Set(services.map((s) => s.slug));
    for (const s of services) {
      expect(s.related).not.toContain(s.slug);
      for (const r of s.related) expect(slugs.has(r), `${s.slug} → ${r}`).toBe(true);
    }
  });

  it("is selectable in the enquiry form", async () => {
    const formValues = SERVICE_OPTIONS.map((o) => o.value as string);
    for (const s of await publishedServices()) expect(formValues).toContain(s.slug);
  });

  it("makes no ranking or result guarantees", async () => {
    const { data: faqs } = await anonClient().from("faqs").select("question, answer");
    const text = JSON.stringify([await publishedServices(), faqs]).toLowerCase();
    expect(text).not.toMatch(/guaranteed (rankings?|results?|#1|first page)/);
    expect(text).not.toMatch(/we guarantee|i guarantee/);
  });

  it("general FAQs are valid", async () => {
    const { data } = await anonClient()
      .from("faqs")
      .select("question, answer")
      .eq("scope", "general");
    expect(data!.length).toBeGreaterThan(0);
    for (const f of data!) expect(faqSchema.safeParse(f).success).toBe(true);
  });
});
