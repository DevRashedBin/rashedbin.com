"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import type { ActionState } from "@/components/admin/action-state";
import { requireAdminPasswordStep } from "@/server/auth";
import { createSupabaseServerClient } from "@/server/supabase/server";

const GENERIC_LOGIN_ERROR = "Email or password is incorrect.";

const credentials = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1).max(200),
});

export async function signInAdmin(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = credentials.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { status: "error", message: GENERIC_LOGIN_ERROR };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) return { status: "error", message: GENERIC_LOGIN_ERROR };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();
  if (profile?.role !== "admin") {
    // Same message as a wrong password: don't reveal which accounts exist.
    await supabase.auth.signOut();
    return { status: "error", message: GENERIC_LOGIN_ERROR };
  }
  redirect("/admin/mfa");
}

export type EnrolState =
  | { status: "idle" }
  | { status: "ready"; factorId: string; qrCode: string; secret: string }
  | { status: "error"; message: string };

/** Starts TOTP enrolment, discarding any earlier unfinished attempt. */
export async function startTotpEnrolment(): Promise<EnrolState> {
  await requireAdminPasswordStep();
  const supabase = await createSupabaseServerClient();
  const { data: factors } = await supabase.auth.mfa.listFactors();
  if (factors?.all.some((f) => f.factor_type === "totp" && f.status === "verified")) {
    return { status: "error", message: "An authenticator is already set up. Reload the page." };
  }
  for (const f of factors?.all ?? []) {
    if (f.status !== "verified") await supabase.auth.mfa.unenroll({ factorId: f.id });
  }
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: "Authenticator",
  });
  if (error || !data)
    return { status: "error", message: "Could not start set-up. Please try again." };
  return {
    status: "ready",
    factorId: data.id,
    qrCode: data.totp.qr_code,
    secret: data.totp.secret,
  };
}

const verifyInput = z.object({
  factorId: z.uuid(),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit code from your authenticator app."),
});

export async function verifyTotp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdminPasswordStep();
  const parsed = verifyInput.safeParse({
    factorId: formData.get("factorId"),
    code: formData.get("code"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      errors: { code: "Enter the 6-digit code from your authenticator app." },
    };
  }
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.mfa.challengeAndVerify(parsed.data);
  if (error)
    return {
      status: "error",
      errors: { code: "That code didn't work. Check the time on your device and try again." },
    };
  redirect("/admin");
}
