import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/server/db/types";
import { supabasePublishableKey, supabaseUrl } from "./env";

/**
 * Anonymous, cookie-free client for public content. Safe inside "use cache"
 * because it never touches request data; RLS limits it to published rows.
 */
export function createPublicSupabaseClient() {
  return createClient<Database>(supabaseUrl(), supabasePublishableKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
