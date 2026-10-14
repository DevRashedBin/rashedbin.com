"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/server/supabase/server";

export type PortalLoginState =
  { step: "email"; error?: string } | { step: "code"; email: string; error?: string };

const emailSchema = z.string().trim().toLowerCase().max(254).pipe(z.email());

/**
 * Step 1: send a one-time code. The response is identical whether or not an
 * account exists, so the form can't be used to discover client emails.
 * Accounts are never created here (shouldCreateUser: false).
 */
export async function requestPortalCode(
  _prev: PortalLoginState,
  formData: FormData,
): Promise<PortalLoginState> {
  const email = emailSchema.safeParse(formData.get("email"));
  if (!email.success) return { step: "email", error: "Enter a valid email address." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: email.data,
    options: { shouldCreateUser: false },
  });
  // Only surface rate limiting; every other outcome looks the same.
  if (error?.status === 429)
    return { step: "email", error: "Too many attempts. Please wait a minute and try again." };
  return { step: "code", email: email.data };
}

const codeSchema = z.object({
  email: emailSchema,
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/),
});

/** Step 2: verify the code and sign in. */
export async function verifyPortalCode(
  _prev: PortalLoginState,
  formData: FormData,
): Promise<PortalLoginState> {
  const parsed = codeSchema.safeParse({ email: formData.get("email"), code: formData.get("code") });
  const email = String(formData.get("email") ?? "");
  if (!parsed.success)
    return { step: "code", email, error: "Enter the 6-digit code from the email." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({
    email: parsed.data.email,
    token: parsed.data.code,
    type: "email",
  });
  if (error) return { step: "code", email, error: "That code is incorrect or has expired." };
  redirect("/portal");
}

export async function signOutPortal() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/portal/login");
}
