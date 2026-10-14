import type { Metadata } from "next";
import { connection } from "next/server";

export const instant = false;

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminAuthLayout({ children }: { children: React.ReactNode }) {
  // Render per request so the nonce-based CSP applies.
  await connection();
  return (
    <main id="main" className="grid min-h-dvh place-items-center bg-ink px-4 py-10 text-ink">
      <div className="w-full max-w-[420px] rounded-[1.75rem] bg-paper p-7 sm:p-9">{children}</div>
    </main>
  );
}
