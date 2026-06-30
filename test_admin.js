const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function test() {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error("Admin error:", error.message);
  } else {
    console.log("Admin success, users count:", data.users.length);
  }
}
test();
