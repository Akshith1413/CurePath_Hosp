import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseServer";
import { protect, authErrorResponse } from "@/lib/authUtils";
import { createBlockchainRecord } from "@/lib/utils/blockchain";

const VALID_LEVELS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const VALID_STATUSES = ["Awaiting Triage", "In Treatment", "Stabilized", "Discharged", "Admitted to ICU"];
const VALID_AMBULANCE = ["Not Required", "Dispatched", "En Route", "Arrived"];

// GET /api/emergency/:id
export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const authRes = await protect(req);
  if (authRes.error) return authErrorResponse(authRes.error, authRes.status);
  const hospitalId = authRes.hospital.id;
  const { id } = await context.params;

  try {
    const { data: emergency, error } = await supabase
      .from("emergency_cases")
      .select(`*, patients:patient_id ( id, patient_name, age, gender, blood_group, phone, diagnosis ), doctors:assigned_doctor_id ( id, doctor_name, specialization, qualification )`)
      .eq("id", id).eq("hospital_id", hospitalId).single();

    if (error || !emergency) return NextResponse.json({ success: false, error: "Emergency case not found on this hospital node." }, { status: 404 });

    return NextResponse.json({ success: true, emergency });
  } catch (error: any) {
    console.error("Get Emergency Error:", error);
    return NextResponse.json({ success: false, error: "Server Error: Could not fetch emergency case." }, { status: 500 });
  }
}

// PUT /api/emergency/:id
export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  const authRes = await protect(req);
  if (authRes.error) return authErrorResponse(authRes.error, authRes.status);
  const hospitalId = authRes.hospital.id;
  const { id } = await context.params;

  try {
    const updateFields = await req.json().catch(() => ({}));
    if (!updateFields || Object.keys(updateFields).length === 0) return NextResponse.json({ success: false, error: "No fields provided to update." }, { status: 400 });

    if (updateFields.emergency_level && !VALID_LEVELS.includes(updateFields.emergency_level)) return NextResponse.json({ success: false, error: `Invalid emergency_level.` }, { status: 400 });
    if (updateFields.emergency_status && !VALID_STATUSES.includes(updateFields.emergency_status)) return NextResponse.json({ success: false, error: `Invalid emergency_status.` }, { status: 400 });
    if (updateFields.ambulance_status && !VALID_AMBULANCE.includes(updateFields.ambulance_status)) return NextResponse.json({ success: false, error: `Invalid ambulance_status.` }, { status: 400 });

    const { data: existing, error: checkErr } = await supabase.from("emergency_cases").select("id").eq("id", id).eq("hospital_id", hospitalId).single();
    if (checkErr || !existing) return NextResponse.json({ success: false, error: "Emergency case not found on this hospital node." }, { status: 404 });

    const { data: emergency, error } = await supabase.from("emergency_cases").update(updateFields).eq("id", id).eq("hospital_id", hospitalId).select("*").single();
    if (error) throw error;

    let action = "UPDATED";
    if (emergency.emergency_status === "Stabilized") action = "APPROVED";
    if (emergency.emergency_status === "Discharged") action = "REJECTED";

    await createBlockchainRecord(hospitalId, "EMERGENCY_CASE", emergency.id, action, {
      symptoms: emergency.symptoms, level: emergency.emergency_level, status: emergency.emergency_status, ambulance: emergency.ambulance_status
    });

    return NextResponse.json({ success: true, message: "Emergency case updated successfully.", emergency });
  } catch (error: any) {
    console.error("Update Emergency Error:", error);
    return NextResponse.json({ success: false, error: "Server Error: Could not update emergency case." }, { status: 500 });
  }
}

// DELETE /api/emergency/:id
export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  const authRes = await protect(req);
  if (authRes.error) return authErrorResponse(authRes.error, authRes.status);
  const hospitalId = authRes.hospital.id;
  const { id } = await context.params;

  try {
    const { data: existing, error: checkErr } = await supabase.from("emergency_cases").select("id").eq("id", id).eq("hospital_id", hospitalId).single();
    if (checkErr || !existing) return NextResponse.json({ success: false, error: "Emergency case not found on this hospital node." }, { status: 404 });

    const { error } = await supabase.from("emergency_cases").delete().eq("id", id).eq("hospital_id", hospitalId);
    if (error) throw error;

    await createBlockchainRecord(hospitalId, "EMERGENCY_CASE", id, "REJECTED", { action: "delete_emergency_case", case_id: id });

    return NextResponse.json({ success: true, message: "Emergency case record permanently deleted." });
  } catch (error: any) {
    console.error("Delete Emergency Error:", error);
    return NextResponse.json({ success: false, error: "Server Error: Could not delete emergency case." }, { status: 500 });
  }
}
