import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { faqSchema, serviceFromRow, type Faq, type Service } from "@/domain/content/service";
import { createPublicSupabaseClient } from "./supabase/public";

/** Cache tag invalidated whenever an admin saves website content. */
export const CONTENT_TAG = "content";

const serviceColumns =
  "slug, position, published, name, short_name, summary, meta_title, meta_description, eyebrow, headline, intro, problems, deliverables, approach, ideal_for, faqs, related, demo, cta";

/** Published services in display order. */
export async function getServices(): Promise<Service[]> {
  "use cache";
  cacheTag(CONTENT_TAG);
  cacheLife("hours");
  const { data, error } = await createPublicSupabaseClient()
    .from("services")
    .select(serviceColumns)
    .eq("published", true)
    .order("position");
  if (error) throw new Error(`Failed to load services: ${error.message}`);
  return data.map(serviceFromRow);
}

export async function getService(slug: string): Promise<Service | undefined> {
  return (await getServices()).find((s) => s.slug === slug);
}

export async function getRelatedServices(service: Service): Promise<Service[]> {
  const all = await getServices();
  return service.related
    .map((slug) => all.find((s) => s.slug === slug))
    .filter((s): s is Service => Boolean(s));
}

export async function getGeneralFaqs(): Promise<Faq[]> {
  "use cache";
  cacheTag(CONTENT_TAG);
  cacheLife("hours");
  const { data, error } = await createPublicSupabaseClient()
    .from("faqs")
    .select("question, answer")
    .eq("scope", "general")
    .eq("published", true)
    .order("position");
  if (error) throw new Error(`Failed to load FAQs: ${error.message}`);
  return data.map((f) => faqSchema.parse(f));
}
