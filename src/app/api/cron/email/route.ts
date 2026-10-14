import { connection } from "next/server";
import { isAuthorisedCron } from "@/server/cron";
import { processDueEmails } from "@/server/email/outbox";

/** Retries queued and failed emails. Scheduled in vercel.json. */
export async function GET(request: Request) {
  await connection();
  if (!isAuthorisedCron(request)) return new Response("Unauthorized", { status: 401 });
  const results = await processDueEmails();
  const summary = results.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});
  return Response.json({ processed: results.length, ...summary });
}
