const supabase = require("../backend/config/supabaseClient");

async function check() {
  try {
    const { data, error } = await supabase
      .from("insurance_policies")
      .select("*")
      .limit(1);
    console.log("Result:", { data, error });
  } catch (err) {
    console.error("Check error:", err);
  }
}

check();
