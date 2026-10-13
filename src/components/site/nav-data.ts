import { getServices } from "@/content/services";
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

export function getServiceNav(): NavLink[] {
  return getServices().map((s) => ({ href: `/services/${s.slug}`, label: s.shortName }));
}
