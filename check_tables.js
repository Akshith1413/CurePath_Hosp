const { Client } = require('pg');
const client = new Client('postgresql://postgres:curepath%40123@db.nnbrtehoxthxcvjaksuw.supabase.co:5432/postgres');
client.connect().then(async () => {
  try {
    const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    client.end();
  }
});
