import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createSupabaseServerClient } from "./supabase/server";

export type SessionUser = {
  id: string;
  email: string;
  role: "admin" | "client";
  aal: "aal1" | "aal2";
};

/**
 * Data Access Layer: the single place that reads the session. Every protected
 * page, Server Action and Route Handler calls one of the guards below — UI
 * visibility is never treated as authorisation, and the database enforces the
 * same rules again through RLS.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  // Session reads are request-specific: never let them run during prerendering.
  // Layouts and pages render in parallel, so this must live here, not only in layouts.
  await connection();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  const claims = data.claims;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", claims.sub)
    .maybeSingle();
  if (!profile) return null;

  return {
    id: claims.sub,
    email: String(claims.email ?? ""),
    role: profile.role === "admin" ? "admin" : "client",
    aal: claims.aal === "aal2" ? "aal2" : "aal1",
  };
}

/** Admin with a completed MFA challenge. Redirects otherwise. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") redirect("/admin/login");
  if (user.aal !== "aal2") redirect("/admin/mfa");
  return user;
}

/** Admin who has signed in with a password but may not have passed MFA yet. */
export async function requireAdminPasswordStep(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") redirect("/admin/login");
  return user;
}

/** Any signed-in portal user. Data access is still limited by RLS membership. */
export async function requirePortalUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/portal/login");
  return user;
}

/** For Server Actions: throws instead of redirecting so the action fails closed. */
export async function assertAdmin(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user || user.role !== "admin" || user.aal !== "aal2") {
    throw new Error("Not authorised");
  }
  return user;
}
