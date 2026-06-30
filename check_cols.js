const { Client } = require('pg');
const client = new Client('postgresql://postgres:curepath%40123@db.nnbrtehoxthxcvjaksuw.supabase.co:5432/postgres');
client.connect().then(async () => {
  try {
    const res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'patients'");
    console.log("Patients columns:");
    console.log(res.rows);

    const docRes = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'doctors'");
    console.log("Doctors columns:");
    console.log(docRes.rows);
  } catch (err) {
    console.error(err);
  } finally {
    client.end();
  }
});
