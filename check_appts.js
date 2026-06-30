const { Client } = require('pg');
const client = new Client('postgresql://postgres:curepath%40123@db.nnbrtehoxthxcvjaksuw.supabase.co:5432/postgres');
client.connect().then(async () => {
  try {
    const res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'appointments'");
    console.log("Appointments columns:");
    console.log(res.rows);

    const emerRes = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'emergency_cases'");
    console.log("Emergency columns:");
    console.log(emerRes.rows);
  } catch (err) {
    console.error(err);
  } finally {
    client.end();
  }
});
