import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";

export const instant = false;

export const metadata: Metadata = {
  title: "Client sign in",
  robots: { index: false, follow: false },
};

export default async function PortalAuthLayout({ children }: { children: React.ReactNode }) {
  await connection();
  return (
    <main id="main" className="grid min-h-dvh place-items-center bg-paper px-4 py-10">
      <div className="w-full max-w-[420px]">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2.5">
          <span
            aria-hidden
            className="grid size-8 place-items-center rounded-full bg-ink text-paper"
          >
            <span className="accent">R</span>
          </span>
          <span className="text-lg font-semibold tracking-tight">Rashed</span>
        </Link>
        <div className="rounded-[1.75rem] border border-ink/10 bg-white p-7 sm:p-9">{children}</div>
      </div>
    </main>
  );
}
