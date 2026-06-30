import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes("your-supabase") || supabaseKey.includes("your-supabase")) {
  console.warn("⚠️  [Supabase Config]: Warning! Supabase URL or Anon Key is not configured correctly in .env.local");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
