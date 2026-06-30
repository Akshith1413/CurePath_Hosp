const { Client } = require('pg');
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
const client = new Client('postgresql://postgres:curepath%40123@db.nnbrtehoxthxcvjaksuw.supabase.co:5432/postgres');

client.connect().then(async () => {
  try {
    // 1. Add email and cupat_id to profiles
    await client.query(`
      ALTER TABLE public.profiles 
      ADD COLUMN IF NOT EXISTS email TEXT UNIQUE,
      ADD COLUMN IF NOT EXISTS cupat_id TEXT UNIQUE,
      ADD COLUMN IF NOT EXISTS cudoc_id TEXT UNIQUE;
    `);
    
    // 2. Add columns to portal's patients table
    // (the local patients table for the hospital)
    await client.query(`
      ALTER TABLE public.patients
      ADD COLUMN IF NOT EXISTS email TEXT,
      ADD COLUMN IF NOT EXISTS cupat_id TEXT,
      ADD COLUMN IF NOT EXISTS aadhar_number TEXT;
    `);

    // 3. Add columns to doctors table
    await client.query(`
      ALTER TABLE public.doctors
      ADD COLUMN IF NOT EXISTS cudoc_id TEXT UNIQUE,
      ADD COLUMN IF NOT EXISTS age INTEGER,
      ADD COLUMN IF NOT EXISTS email_id TEXT,
      ADD COLUMN IF NOT EXISTS current_hospital TEXT[],
      ADD COLUMN IF NOT EXISTS verification_docs TEXT[];
    `);

    // 4. Storage bucket for verifications
    // Using sql to create bucket is possible in Supabase if we have access to storage schema.
    await client.query(`
      INSERT INTO storage.buckets (id, name, public) 
      VALUES ('verifications', 'verifications', true)
      ON CONFLICT (id) DO NOTHING;
    `);
    
    console.log("Successfully updated schema and created storage bucket.");
  } catch (err) {
    console.error("Schema update error:", err);
  } finally {
    client.end();
  }
});
