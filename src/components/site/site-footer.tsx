import { cacheLife } from "next/cache";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { site } from "@/content/site";
import { Logo } from "./logo";
import { getPrimaryNav, getServiceNav } from "./nav-data";

export async function SiteFooter() {
  return (
    <footer className="bg-ink text-paper">
      <Container className="pt-6 pb-8 sm:pt-8">
        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="flex flex-col gap-4">
            <Logo inverse />
            <p className="max-w-xs text-sm leading-relaxed text-paper/60">
              Independent website design, development and optimisation for businesses in the UK, US,
              Europe and Bangladesh.
            </p>
          </div>
          <FooterColumn title="Services" links={await getServiceNav()} />
          <FooterColumn
            title="Company"
            links={[
              ...getPrimaryNav().filter((l) => l.href !== "/services"),
              { href: "/start-a-project", label: "Start a project" },
            ]}
          />
          <FooterColumn
            title="Legal"
            links={[
              { href: "/privacy", label: "Privacy policy" },
              { href: "/terms", label: "Terms of service" },
            ]}
          />
        </div>

        <div className="flex flex-col gap-3 border-t border-paper/10 pt-6 font-mono text-xs text-paper/50 sm:flex-row sm:justify-between">
          <p>
            © <CopyrightYear /> {site.personName}. All rights reserved.
          </p>
          <p>{site.domain}</p>
        </div>
      </Container>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <p className="mb-4 font-mono text-xs tracking-[0.14em] text-paper/50 uppercase">{title}</p>
      <ul className="flex flex-col gap-2.5 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-paper/80 transition-colors hover:text-paper">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

async function CopyrightYear() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}
