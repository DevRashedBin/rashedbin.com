import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/server/db/types";
import { supabaseUrl } from "./env";

/**
 * Privileged client that BYPASSES Row Level Security. Only for narrowly scoped
 * server tasks (public inquiry intake, verified webhooks). Never use it to
 * serve data to a signed-in user; use createSupabaseServerClient instead.
 */
export function createSupabaseServiceClient() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error("SUPABASE_SECRET_KEY is not set");
  return createClient<Database>(supabaseUrl(), key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
