import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/auth";
import { PortalLoginForm } from "./login-form";

export default async function PortalLoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/portal");
  return (
    <>
      <h1 className="text-2xl font-medium tracking-tight">Client sign in</h1>
      <p className="mt-1.5 text-sm text-graphite">
        Track your projects, invoices and payments. We&rsquo;ll email you a one-time code — no
        password needed.
      </p>
      <PortalLoginForm />
    </>
  );
}
