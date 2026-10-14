"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export type AdminNavItem = { href: string; label: string; phase?: number };

export function AdminNavLinks({ items }: { items: AdminNavItem[] }) {
  const pathname = usePathname();
  return (
    <ul className="flex [scrollbar-width:none] gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
      {items.map((item) => {
        const active =
          item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        if (item.phase) {
          return (
            <li key={item.href} className="hidden shrink-0 lg:block">
              <span
                aria-disabled
                className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm text-paper/35"
              >
                {item.label}
                <span className="rounded-full border border-paper/15 px-1.5 py-0.5 font-mono text-[0.6rem]">
                  Phase {item.phase}
                </span>
              </span>
            </li>
          );
        }
        return (
          <li key={item.href} className="shrink-0">
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "block rounded-xl px-3 py-2 text-sm transition-colors",
                active ? "bg-paper text-ink" : "text-paper/75 hover:bg-paper/10 hover:text-paper",
              )}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
