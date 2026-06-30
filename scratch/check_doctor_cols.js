const supabase = require("../backend/config/supabaseClient");

async function check() {
  try {
    const { data, error } = await supabase
      .from("doctors")
      .select("*")
      .limit(1);
    console.log("Doctor row:", data[0]);
  } catch (err) {
    console.error("Check error:", err);
  }
}

check();
