import type { Metadata } from "next";
import { connection } from "next/server";
import { AdminShell } from "@/components/admin/shell";
import { requireAdmin } from "@/server/auth";

// Private, per-request pages: no prerendered shell (required for the nonce CSP).
export const instant = false;

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await connection();
  const user = await requireAdmin();
  return <AdminShell user={user}>{children}</AdminShell>;
}
