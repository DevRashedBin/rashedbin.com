import { redirect } from "next/navigation";
import { requireAdminPasswordStep } from "@/server/auth";
import { createSupabaseServerClient } from "@/server/supabase/server";
import { MfaEnrol, MfaVerify } from "./mfa-forms";

export default async function AdminMfaPage() {
  const user = await requireAdminPasswordStep();
  if (user.aal === "aal2") redirect("/admin");

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.mfa.listFactors();
  const verified = data?.all.find((f) => f.factor_type === "totp" && f.status === "verified");

  return (
    <>
      <p className="font-mono text-xs tracking-[0.14em] text-stone uppercase">Step 2 of 2</p>
      <h1 className="mt-3 text-2xl font-medium tracking-tight">
        {verified ? "Enter your code" : "Set up two-step verification"}
      </h1>
      {verified ? <MfaVerify factorId={verified.id} /> : <MfaEnrol />}
    </>
  );
}
