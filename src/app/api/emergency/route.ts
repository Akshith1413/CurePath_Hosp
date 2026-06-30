import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseServer";
import { protect, authErrorResponse } from "@/lib/authUtils";
import { createBlockchainRecord } from "@/lib/utils/blockchain";

const VALID_LEVELS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const VALID_STATUSES = ["Awaiting Triage", "In Treatment", "Stabilized", "Discharged", "Admitted to ICU"];
const VALID_AMBULANCE = ["Not Required", "Dispatched", "En Route", "Arrived"];
const LEVEL_PRIORITY: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

// GET /api/emergency
export async function GET(req: Request) {
  const authRes = await protect(req);
  if (authRes.error) return authErrorResponse(authRes.error, authRes.status);
  const hospitalId = authRes.hospital.id;

  try {
    const url = new URL(req.url);
    const level = url.searchParams.get("level");
    const status = url.searchParams.get("status");
    const icu = url.searchParams.get("icu");
    const limit = parseInt(url.searchParams.get("limit") || "30");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    let query = supabase
      .from("emergency_cases")
      .select(`*, patients:patient_id ( id, patient_name, age, gender, blood_group ), doctors:assigned_doctor_id ( id, doctor_name, specialization )`, { count: "exact" })
      .eq("hospital_id", hospitalId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (level && VALID_LEVELS.includes(level)) query = query.eq("emergency_level", level);
    if (status && VALID_STATUSES.includes(status)) query = query.eq("emergency_status", status);
    if (icu === "true") query = query.eq("icu_required", true);

    const { data: emergencies, count, error } = await query;
    if (error) throw error;

    const sorted = (emergencies || []).sort((a, b) => (LEVEL_PRIORITY[a.emergency_level] || 99) - (LEVEL_PRIORITY[b.emergency_level] || 99));

    return NextResponse.json({ success: true, total: count || 0, limit, offset, emergencies: sorted });
  } catch (error: any) {
    console.error("Get Emergencies Error:", error);
    return NextResponse.json({ success: false, error: "Server Error: Could not fetch emergency cases." }, { status: 500 });
  }
}

// POST /api/emergency/create (Handling as POST /api/emergency)
export async function POST(req: Request) {
  const authRes = await protect(req);
  if (authRes.error) return authErrorResponse(authRes.error, authRes.status);
  const hospitalId = authRes.hospital.id;

  try {
    const body = await req.json().catch(() => ({}));
    const { patient_id, emergency_level, symptoms, assigned_doctor_id, icu_required, ambulance_status, admission_time } = body;

    if (!patient_id || !emergency_level || !symptoms || !admission_time) return NextResponse.json({ success: false, error: "Required fields: patient_id, emergency_level, symptoms, admission_time." }, { status: 400 });
    if (!VALID_LEVELS.includes(emergency_level)) return NextResponse.json({ success: false, error: `Invalid emergency_level.` }, { status: 400 });
    if (ambulance_status && !VALID_AMBULANCE.includes(ambulance_status)) return NextResponse.json({ success: false, error: `Invalid ambulance_status.` }, { status: 400 });

    const { data: patient, error: patErr } = await supabase.from("patients").select("id, patient_name").eq("id", patient_id).eq("hospital_id", hospitalId).single();
    if (patErr || !patient) return NextResponse.json({ success: false, error: "Patient not found on this hospital node." }, { status: 404 });

    if (assigned_doctor_id) {
      const { data: doctor, error: docErr } = await supabase.from("doctors").select("id").eq("id", assigned_doctor_id).eq("hospital_id", hospitalId).single();
      if (docErr || !doctor) return NextResponse.json({ success: false, error: "Assigned doctor not found on this hospital node." }, { status: 404 });
    }

    const { data: emergency, error } = await supabase
      .from("emergency_cases")
      .insert([{ hospital_id: hospitalId, patient_id, emergency_level, symptoms, assigned_doctor_id: assigned_doctor_id || null, icu_required: icu_required || false, ambulance_status: ambulance_status || "Not Required", admission_time, emergency_status: "Awaiting Triage" }])
      .select("*").single();

    if (error) throw error;

    await createBlockchainRecord(hospitalId, "EMERGENCY_CASE", emergency.id, "CREATED", { patient_name: patient.patient_name, symptoms: emergency.symptoms, level: emergency.emergency_level, status: emergency.emergency_status });

    return NextResponse.json({ success: true, message: `Emergency case created — Level: ${emergency_level}`, emergency: { ...emergency, patient_name: patient.patient_name } }, { status: 201 });
  } catch (error: any) {
    console.error("Create Emergency Error:", error);
    return NextResponse.json({ success: false, error: "Server Error: Could not create emergency case." }, { status: 500 });
  }
}
