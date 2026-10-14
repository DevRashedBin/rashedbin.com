import { execSync } from "node:child_process";

/** Reads connection details from the running local Supabase stack. */
export default function setup() {
  let status: Record<string, string>;
  try {
    status = JSON.parse(
      execSync("npx supabase status -o json", { stdio: ["ignore", "pipe", "ignore"] }).toString(),
    );
  } catch {
    throw new Error("Local Supabase is not running. Start it with `pnpm db:start`.");
  }
  process.env.NEXT_PUBLIC_SUPABASE_URL = status.API_URL;
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = status.PUBLISHABLE_KEY;
  process.env.SUPABASE_SECRET_KEY = status.SECRET_KEY;
}
