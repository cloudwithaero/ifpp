import { createClient } from "@supabase/supabase-js";

// V25: deployment-safe Supabase configuration.
// The publishable key is intended for browser-side use; RLS remains the security boundary.
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://fpctlbhtsgatfdunqerj.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_iKrOhwh03Imlf_t13_aCvQ_MLFSZb16";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
