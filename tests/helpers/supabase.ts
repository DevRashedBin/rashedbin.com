import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/server/db/types";
import { totp } from "./totp";

export const env = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  secretKey: process.env.SUPABASE_SECRET_KEY!,
};

const noPersist = { auth: { persistSession: false, autoRefreshToken: false } };

export type Db = SupabaseClient<Database>;

export function anonClient(): Db {
  return createClient<Database>(env.url, env.publishableKey, noPersist);
}

/** Privileged client: bypasses RLS. Used only to arrange test fixtures. */
export function serviceClient(): Db {
  return createClient<Database>(env.url, env.secretKey, noPersist);
}

export const TEST_PASSWORD = "Test-Password-123";

export async function createUser(prefix: string) {
  const email = `${prefix}-${randomUUID().slice(0, 8)}@example.test`;
  const { data, error } = await serviceClient().auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error("createUser failed");
  return { id: data.user.id, email };
}

export async function signIn(email: string): Promise<Db> {
  const client = anonClient();
  const { error } = await client.auth.signInWithPassword({ email, password: TEST_PASSWORD });
  if (error) throw error;
  return client;
}

/** Sign in and complete TOTP enrolment so the session reaches aal2. */
export async function signInWithMfa(email: string): Promise<{ client: Db; secret: string }> {
  const client = await signIn(email);
  const { data: enrolled, error } = await client.auth.mfa.enroll({ factorType: "totp" });
  if (error) throw error;
  const secret = enrolled.totp.secret;
  const { error: verifyError } = await client.auth.mfa.challengeAndVerify({
    factorId: enrolled.id,
    code: totp(secret),
  });
  if (verifyError) throw verifyError;
  return { client, secret };
}

export async function makeAdmin(userId: string) {
  const { error } = await serviceClient()
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", userId);
  if (error) throw error;
}
