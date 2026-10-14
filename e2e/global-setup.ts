import { execSync } from "node:child_process";

/** Makes local Supabase connection details available to e2e fixtures. */
export default function globalSetup() {
  try {
    const status = JSON.parse(
      execSync("npx supabase status -o json", { stdio: ["ignore", "pipe", "ignore"] }).toString(),
    ) as Record<string, string>;
    process.env.NEXT_PUBLIC_SUPABASE_URL = status.API_URL;
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = status.PUBLISHABLE_KEY;
    process.env.SUPABASE_SECRET_KEY = status.SECRET_KEY;
    process.env.MAILPIT_URL = status.MAILPIT_URL ?? status.INBUCKET_URL;
  } catch {
    throw new Error("Local Supabase is not running. Start it with `pnpm db:start`.");
  }
}
