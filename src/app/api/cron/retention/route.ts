import { connection } from "next/server";
import { isAuthorisedCron } from "@/server/cron";
import { createSupabaseServiceClient } from "@/server/supabase/admin";

/** Applies the retention policy (see the privacy notice). Scheduled daily in vercel.json. */
export async function GET(request: Request) {
  await connection();
  if (!isAuthorisedCron(request)) return new Response("Unauthorized", { status: 401 });
  const { data, error } = await createSupabaseServiceClient().rpc("purge_expired_data");
  if (error) {
    console.error("retention_failed", error.message);
    return Response.json({ ok: false }, { status: 500 });
  }
  return Response.json({ ok: true, ...(data as object) });
}
