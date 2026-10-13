import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { ArrowUpRight } from "@/components/ui/icons";
import { getServices } from "@/content/services";
import { Logo } from "./logo";
import { MobileMenu } from "./mobile-menu";
import { getPrimaryNav, getServiceNav } from "./nav-data";

export function SiteHeader() {
  const primary = getPrimaryNav();
  const services = getServices();

  return (
    <header className="sticky top-0 z-50 border-b border-ink/[0.07] bg-paper/85 backdrop-blur-md">
      <a
        href="#main"
        className="sr-only z-[60] rounded-full bg-ink px-4 py-2 text-paper focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <Container className="flex h-18 items-center justify-between gap-6">
        <Logo />

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {primary.map((item) =>
              item.href === "/services" ? (
                <li key={item.href} className="group relative">
                  <Link
                    href={item.href}
                    className="rounded-full px-4 py-2 text-sm transition-colors hover:bg-ink/[0.05]"
                  >
                    {item.label}
                  </Link>
                  {/* Hover/focus mega panel; the Services link itself remains the accessible path. */}
                  <div className="invisible absolute top-full left-1/2 w-[560px] -translate-x-1/2 pt-3 opacity-0 transition-[opacity,visibility] duration-200 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                    <ul className="grid grid-cols-2 gap-1 rounded-[1.5rem] border border-ink/10 bg-white p-2 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.35)]">
                      {services.map((s) => (
                        <li key={s.slug}>
                          <Link
                            href={`/services/${s.slug}`}
                            className="group/item flex h-full flex-col gap-1 rounded-2xl p-3 transition-colors hover:bg-paper"
                          >
                            <span className="flex items-center justify-between text-sm font-medium">
                              {s.shortName}
                              <ArrowUpRight className="size-3.5 opacity-0 transition-opacity group-hover/item:opacity-100" />
                            </span>
                            <span className="line-clamp-2 text-xs leading-snug text-stone">
                              {s.summary}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              ) : (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="rounded-full px-4 py-2 text-sm transition-colors hover:bg-ink/[0.05]"
                  >
                    {item.label}
                  </Link>
                </li>
              ),
            )}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <span className="hidden sm:block">
            <ButtonLink href="/start-a-project" arrow>
              Start a project
            </ButtonLink>
          </span>
          <MobileMenu primary={primary} services={getServiceNav()} />
        </div>
      </Container>
    </header>
  );
}
