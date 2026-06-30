const { Client } = require('pg');
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
const client = new Client('postgresql://postgres:curepath%40123@db.nnbrtehoxthxcvjaksuw.supabase.co:5432/postgres');

client.connect().then(async () => {
  console.log("Connected to Supabase Postgres.");

  const tables = ['doctors', 'patients', 'medical_records', 'profiles', 'doctor_verifications', 'hospitals'];
  
  for (const table of tables) {
    try {
      await client.query(`ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY;`);
      console.log(`Disabled RLS on ${table}`);
    } catch (e) {
      console.log(`Error disabling RLS on ${table}:`, e.message);
    }
  }

  await client.end();
  console.log("Finished executing RLS disable script.");
}).catch(e => {
  console.error("Connection error:", e);
});
