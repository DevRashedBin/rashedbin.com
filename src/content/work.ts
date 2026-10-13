/**
 * Case studies.
 *
 * Only genuine projects, published with the client's permission, belong here.
 * While this list is empty the Work section is hidden from navigation, the
 * homepage and the sitemap — it is never shown with placeholder content.
 */
export type CaseStudy = {
  slug: string;
  published: boolean;
  title: string;
  client: string;
  /** Country or region, only if the client agrees to it being shown. */
  location?: string;
  services: string[]; // service slugs
  summary: string;
  challenge: string;
  approach: string[];
  outcome: string; // verifiable outcomes only; no invented metrics
  url?: string;
  year: number;
};

const caseStudies: CaseStudy[] = [];

export function getCaseStudies(): CaseStudy[] {
  return caseStudies.filter((c) => c.published);
}
