const { Client } = require('pg');
const client = new Client('postgresql://postgres:curepath%40123@db.nnbrtehoxthxcvjaksuw.supabase.co:5432/postgres');
client.connect().then(async () => {
  try {
    // 1. Drop foreign key from doctors to profiles
    await client.query(`
      ALTER TABLE public.doctors 
      DROP CONSTRAINT IF EXISTS doctors_id_fkey;
    `);

    // 2. Add default UUID for id
    await client.query(`
      ALTER TABLE public.doctors 
      ALTER COLUMN id SET DEFAULT uuid_generate_v4();
    `);

    // 3. Add missing columns
    const cols = [
      "doctor_name TEXT",
      "medical_license_number TEXT",
      "aadhaar_number TEXT",
      "years_of_experience INTEGER",
      "contact_number TEXT",
      "verification_status TEXT DEFAULT 'Pending'",
      "specialization TEXT",
      "qualification TEXT"
    ];

    for (const col of cols) {
      const colName = col.split(' ')[0];
      await client.query(`ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS ${colName} ${col.substring(colName.length + 1)};`);
    }

    console.log("Successfully updated doctors schema.");
  } catch (err) {
    console.error(err);
  } finally {
    client.end();
  }
});
