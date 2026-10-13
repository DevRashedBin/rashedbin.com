"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { buttonClasses } from "@/components/ui/button";
import type { NavLink } from "./nav-data";

export function MobileMenu({ primary, services }: { primary: NavLink[]; services: NavLink[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close whenever the route changes.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="relative z-50 grid size-11 place-items-center rounded-full border border-current/20"
      >
        <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
        <span aria-hidden className="relative block h-3 w-4">
          <span
            className={`absolute left-0 h-[1.5px] w-4 bg-current transition-transform duration-300 ${open ? "top-1.5 rotate-45" : "top-0"}`}
          />
          <span
            className={`absolute left-0 h-[1.5px] w-4 bg-current transition-transform duration-300 ${open ? "top-1.5 -rotate-45" : "top-3"}`}
          />
        </span>
      </button>

      <div
        id={panelId}
        hidden={!open}
        className="fixed inset-0 z-40 overflow-y-auto bg-paper px-4 pt-24 pb-10 sm:px-6"
      >
        <nav aria-label="Mobile" className="flex flex-col gap-8">
          <ul className="flex flex-col">
            {primary.map((item) => (
              <li key={item.href} className="border-b border-ink/10">
                <Link href={item.href} className="block py-4 text-3xl font-medium tracking-tight">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div>
            <p className="mb-3 font-mono text-xs tracking-[0.14em] uppercase opacity-60">
              Services
            </p>
            <ul className="grid grid-cols-2 gap-2">
              {services.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="block rounded-2xl border border-ink/10 bg-white px-3 py-3 text-sm"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <Link
            href="/start-a-project"
            className={buttonClasses({ size: "lg", className: "w-full" })}
          >
            Start a project
          </Link>
        </nav>
      </div>
    </div>
  );
}
