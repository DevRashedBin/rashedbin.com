import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/auth";
import { AdminLoginForm } from "./login-form";

export default async function AdminLoginPage() {
  const user = await getSessionUser();
  if (user?.role === "admin") redirect(user.aal === "aal2" ? "/admin" : "/admin/mfa");
  return (
    <>
      <p className="font-mono text-xs tracking-[0.14em] text-stone uppercase">Rashed · Admin</p>
      <h1 className="mt-3 text-2xl font-medium tracking-tight">Sign in</h1>
      <p className="mt-1.5 text-sm text-graphite">
        Two-step verification is required after your password.
      </p>
      <AdminLoginForm />
    </>
  );
}
