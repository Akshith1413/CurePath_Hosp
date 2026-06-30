const { Client } = require('pg');
const client = new Client('postgresql://postgres:curepath%40123@db.nnbrtehoxthxcvjaksuw.supabase.co:5432/postgres');

client.connect().then(async () => {
  try {
    await client.query(`
      ALTER TABLE public.doctors 
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    `);
    console.log("Successfully added created_at to doctors schema.");
  } catch (err) {
    console.error(err);
  } finally {
    client.end();
  }
});
