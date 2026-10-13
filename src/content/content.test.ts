import { describe, expect, it } from "vitest";
import { SERVICE_OPTIONS } from "@/domain/inquiry/schema";
import { generalFaqs } from "./faqs";
import { getRelatedServices, getServices } from "./services";

const services = getServices();

describe("service content", () => {
  it("has unique, URL-safe slugs", () => {
    const slugs = services.map((s) => s.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("has unique meta titles and descriptions within search-result limits", () => {
    const titles = services.map((s) => s.metaTitle);
    const descriptions = services.map((s) => s.metaDescription);
    expect(new Set(titles).size).toBe(titles.length);
    expect(new Set(descriptions).size).toBe(descriptions.length);
    for (const s of services) {
      // Title is rendered with the " | Rashed" suffix.
      expect(`${s.metaTitle} | Rashed`.length, s.slug).toBeLessThanOrEqual(60);
      expect(s.metaDescription.length, s.slug).toBeGreaterThanOrEqual(110);
      expect(s.metaDescription.length, s.slug).toBeLessThanOrEqual(165);
    }
  });

  it("only links to related services that exist, never to itself", () => {
    for (const s of services) {
      expect(getRelatedServices(s)).toHaveLength(s.related.length);
      expect(s.related).not.toContain(s.slug);
    }
  });

  it("has enough substance on every page", () => {
    for (const s of services) {
      expect(s.problems.length, s.slug).toBeGreaterThanOrEqual(3);
      expect(s.deliverables.length, s.slug).toBeGreaterThanOrEqual(4);
      expect(s.faqs.length, s.slug).toBeGreaterThanOrEqual(3);
      expect(s.approach.length, s.slug).toBeGreaterThanOrEqual(3);
    }
  });

  it("is selectable in the enquiry form", () => {
    const formValues = SERVICE_OPTIONS.map((o) => o.value as string);
    for (const s of services) expect(formValues).toContain(s.slug);
  });

  it("makes no ranking or result guarantees", () => {
    const text = JSON.stringify([services, generalFaqs]).toLowerCase();
    expect(text).not.toMatch(/guaranteed (rankings?|results?|#1|first page)/);
    expect(text).not.toMatch(/we guarantee|i guarantee/);
  });
});
