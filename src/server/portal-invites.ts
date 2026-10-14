import "server-only";
import { firstName } from "@/domain/email/template";
import { appOrigin } from "./email/config";
import { deliverEmail, queueEmail } from "./email/outbox";
import { baseTemplateValues, renderStoredTemplate } from "./email/templates";
import { createSupabaseServiceClient } from "./supabase/admin";

export type InviteResult =
  | { status: "invited" | "already_member"; emailStatus: string }
  | { status: "refused"; reason: string };

/**
 * Gives a person access to a client's portal. Callers must have checked the
 * admin first. Creates a passwordless account if needed (sign-in is by emailed
 * code), links it to the client, and sends an invitation through the outbox.
 * Admin accounts are never linked to clients.
 */
export async function inviteClientUser(input: {
  clientId: string;
  email: string;
  name: string;
  actorId: string;
}): Promise<InviteResult> {
  const db = createSupabaseServiceClient();
  const email = input.email.trim().toLowerCase();

  const { data: existingId } = await db.rpc("find_user_id_by_email", { p_email: email });
  let userId = existingId as string | null;
  if (userId) {
    const { data: profile } = await db.from("profiles").select("role").eq("id", userId).single();
    if (profile?.role === "admin")
      return { status: "refused", reason: "That email belongs to an admin account." };
  } else {
    const { data, error } = await db.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name: input.name },
    });
    if (error || !data.user)
      return { status: "refused", reason: "The account could not be created." };
    userId = data.user.id;
  }

  const { data: existing } = await db
    .from("client_members")
    .select("user_id")
    .eq("client_id", input.clientId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!existing) {
    const { error } = await db
      .from("client_members")
      .insert({ client_id: input.clientId, user_id: userId });
    if (error) return { status: "refused", reason: "Access could not be granted." };
  }

  const rendered = await renderStoredTemplate("portal_invitation", {
    ...(await baseTemplateValues()),
    name: input.name,
    first_name: firstName(input.name) || "there",
    portal_link: `${appOrigin()}/portal/login`,
  });
  const queued = await queueEmail({
    idempotencyKey: `invite:${input.clientId}:${userId}:${Date.now()}`,
    to: email,
    subject: rendered.subject,
    bodyText: rendered.body,
    templateKey: "portal_invitation",
    related: { type: "client", id: input.clientId },
    createdBy: input.actorId,
  });
  const delivery = await deliverEmail(queued.id);

  await db.from("activities").insert({
    subject_type: "client",
    subject_id: input.clientId,
    kind: existing ? "portal_reinvited" : "portal_invited",
    summary: `${existing ? "Re-sent client area invitation to" : "Gave client area access to"} ${email}`,
    actor_id: input.actorId,
  });
  return { status: existing ? "already_member" : "invited", emailStatus: delivery.status };
}

/** Email addresses of a client's portal users (for the admin client page). */
export async function clientMemberEmails(
  clientId: string,
): Promise<{ userId: string; email: string }[]> {
  const db = createSupabaseServiceClient();
  const { data: members } = await db
    .from("client_members")
    .select("user_id")
    .eq("client_id", clientId);
  const out: { userId: string; email: string }[] = [];
  for (const m of members ?? []) {
    const { data } = await db.auth.admin.getUserById(m.user_id);
    if (data.user?.email) out.push({ userId: m.user_id, email: data.user.email });
  }
  return out;
}
