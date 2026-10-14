import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { requirePortalUser } from "@/server/auth";
import { signOutPortal } from "../(auth)/actions";

export const instant = false;

export const metadata: Metadata = {
  title: { default: "Client area", template: "%s · Client area" },
  robots: { index: false, follow: false },
};

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  await connection();
  const user = await requirePortalUser();
  return (
    <div className="min-h-dvh bg-paper">
      <header className="border-b border-ink/10 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/portal" className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="grid size-8 place-items-center rounded-full bg-ink text-paper"
            >
              <span className="accent">R</span>
            </span>
            <span className="font-semibold tracking-tight">Client area</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden max-w-[220px] truncate text-sm text-stone sm:block">
              {user.email}
            </span>
            <form action={signOutPortal}>
              <button
                type="submit"
                className="rounded-full border border-ink/15 px-3.5 py-1.5 text-sm hover:border-ink"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        {children}
      </main>
    </div>
  );
}
