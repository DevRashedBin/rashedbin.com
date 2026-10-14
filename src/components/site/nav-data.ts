import { getServices } from "@/server/content";
import { getCaseStudies } from "@/content/work";

export type NavLink = { href: string; label: string };

export function getPrimaryNav(): NavLink[] {
  return [
    { href: "/services", label: "Services" },
    ...(getCaseStudies().length ? [{ href: "/work", label: "Work" }] : []),
    { href: "/#process", label: "Process" },
    { href: "/about", label: "About" },
  ];
}

export async function getServiceNav(): Promise<NavLink[]> {
  return (await getServices()).map((s) => ({ href: `/services/${s.slug}`, label: s.shortName }));
}
