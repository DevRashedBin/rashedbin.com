"use server";

import { refresh, revalidateTag } from "next/cache";
import { headers } from "next/headers";
import { after } from "next/server";
import { z } from "zod";
import { submittedValues, type ActionState } from "@/components/admin/action-state";
import { faqSchema, serviceSchema, serviceToRow } from "@/domain/content/service";
import { toFieldErrors } from "@/domain/inquiry/schema";
import { assertAdmin } from "@/server/auth";
import { CONTENT_TAG } from "@/server/content";
import { createSupabaseServerClient } from "@/server/supabase/server";

/**
 * Marks public content stale and regenerates the affected pages straight away.
 *
 * Why not updateTag? In Next.js 16.4, expiring a prerendered page outright
 * (updateTag, or revalidateTag with an expire of 0) intermittently makes the
 * first client-side navigation to it fail with "Connection closed" while it
 * regenerates (full page loads are fine). Stale-while-revalidate avoids that
 * path, and warming the pages here means visitors see new content within
 * moments. Covered by e2e/admin.spec.ts; revisit on Next.js upgrades.
 */
async function publishContentChange(paths: string[]) {
  revalidateTag(CONTENT_TAG, "max");
  const h = await headers();
  const host = h.get("host");
  if (!host) return;
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${host}`;
  after(async () => {
    await Promise.allSettled([...new Set(paths)].map((path) => fetch(`${origin}${path}`)));
  });
}

const PUBLIC_CONTENT_PATHS = ["/", "/services", "/about"];

function parseJson(value: FormDataEntryValue | null): unknown {
  try {
    return JSON.parse(String(value ?? "null"));
  } catch {
    return null;
  }
}

/** Removes empty rows the editor may submit. */
function compact<T>(list: unknown): T[] {
  if (!Array.isArray(list)) return [];
  return list.filter((item) =>
    typeof item === "string"
      ? item.trim() !== ""
      : Object.values(item ?? {}).some((v) => String(v).trim() !== ""),
  ) as T[];
}

export async function saveServiceAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await assertAdmin();
  const originalSlug = String(formData.get("originalSlug") ?? "");

  const parsed = serviceSchema.safeParse({
    slug: formData.get("slug"),
    position: formData.get("position"),
    published: formData.get("published") === "on",
    name: formData.get("name"),
    shortName: formData.get("shortName"),
    summary: formData.get("summary"),
    metaTitle: formData.get("metaTitle"),
    metaDescription: formData.get("metaDescription"),
    eyebrow: formData.get("eyebrow"),
    headline: formData.get("headline"),
    intro: formData.get("intro"),
    problems: compact(parseJson(formData.get("problems"))),
    deliverables: compact(parseJson(formData.get("deliverables"))),
    approach: compact(parseJson(formData.get("approach"))),
    idealFor: compact(parseJson(formData.get("idealFor"))),
    faqs: compact(parseJson(formData.get("faqs"))),
    related: formData.getAll("related").map(String),
    demo: formData.get("demo"),
    cta: {
      title: formData.get("ctaTitle"),
      body: formData.get("ctaBody"),
      label: formData.get("ctaLabel"),
    },
  });

  if (!parsed.success) {
    const errors = toFieldErrors(parsed.error);
    // Surface nested CTA errors on the right inputs.
    for (const issue of parsed.error.issues) {
      if (issue.path[0] === "cta" && issue.path[1]) {
        const key = `cta${String(issue.path[1]).charAt(0).toUpperCase()}${String(issue.path[1]).slice(1)}`;
        errors[key] ??= issue.message;
      }
    }
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      errors,
      values: submittedValues(formData),
    };
  }
  if (parsed.data.related.includes(parsed.data.slug)) {
    return {
      status: "error",
      errors: { related: "A service can't be related to itself." },
      values: submittedValues(formData),
    };
  }

  const supabase = await createSupabaseServerClient();
  const row = { ...serviceToRow(parsed.data), updated_by: user.id };
  const { error } = originalSlug
    ? await supabase.from("services").update(row).eq("slug", originalSlug).select("id").single()
    : await supabase.from("services").insert(row).select("id").single();

  if (error?.code === "23505") {
    return {
      status: "error",
      errors: { slug: "Another service already uses this URL." },
      values: submittedValues(formData),
    };
  }
  if (error) {
    return {
      status: "error",
      message: "The service could not be saved. Please try again.",
      values: submittedValues(formData),
    };
  }
  await publishContentChange([
    ...PUBLIC_CONTENT_PATHS,
    `/services/${parsed.data.slug}`,
    ...(originalSlug && originalSlug !== parsed.data.slug ? [`/services/${originalSlug}`] : []),
  ]);
  return {
    status: "success",
    message: parsed.data.published
      ? "Saved and published."
      : "Saved as a draft (not visible on the website).",
    values: { slug: parsed.data.slug },
  };
}

const faqListSchema = z.array(faqSchema).max(20);

export async function saveGeneralFaqsAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await assertAdmin();
  const parsed = faqListSchema.safeParse(compact(parseJson(formData.get("faqs"))));
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Please check the questions and answers.",
    };
  }
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("replace_general_faqs", { items: parsed.data });
  if (error) return { status: "error", message: "The FAQs could not be saved. Please try again." };
  await publishContentChange(PUBLIC_CONTENT_PATHS);
  refresh();
  return { status: "success", message: "FAQs saved." };
}

export async function setServicePublishedAction(formData: FormData) {
  const user = await assertAdmin();
  const slug = z.string().min(1).parse(formData.get("slug"));
  const published = formData.get("published") === "true";
  const supabase = await createSupabaseServerClient();
  await supabase.from("services").update({ published, updated_by: user.id }).eq("slug", slug);
  await publishContentChange([...PUBLIC_CONTENT_PATHS, `/services/${slug}`]);
  refresh();
}
