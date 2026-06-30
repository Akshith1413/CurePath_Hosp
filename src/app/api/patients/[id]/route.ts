import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseServer";
import { protect, authErrorResponse } from "@/lib/authUtils";
import { createBlockchainRecord } from "@/lib/utils/blockchain";
import { sendDeleteAlertEmail } from "@/lib/utils/emailService";

// GET /api/patients/:id
export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const authRes = await protect(req);
  if (authRes.error) return authErrorResponse(authRes.error, authRes.status);
  const hospitalId = authRes.hospital.id;
  const { id } = await context.params;

  try {
    const { data: patient, error } = await supabase
      .from("patients")
      .select(`*, doctors:assigned_doctor_id ( id, doctor_name )`)
      .eq("id", id)
      .eq("hospital_id", hospitalId)
      .single();

    if (error || !patient) return NextResponse.json({ success: false, error: "Patient record not found on this hospital node." }, { status: 404 });

    return NextResponse.json({ success: true, patient });
  } catch (error: any) {
    console.error("Get Patient Error:", error);
    return NextResponse.json({ success: false, error: "Server Error: Could not fetch patient record." }, { status: 500 });
  }
}

// PUT /api/patients/:id
export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  const authRes = await protect(req);
  if (authRes.error) return authErrorResponse(authRes.error, authRes.status);
  const hospitalId = authRes.hospital.id;
  const { id } = await context.params;

  try {
    const updateFields = await req.json().catch(() => ({}));
    if (!updateFields || Object.keys(updateFields).length === 0) return NextResponse.json({ success: false, error: "No fields provided to update." }, { status: 400 });

    if (updateFields.discharge_date && !updateFields.status) updateFields.status = "Discharged";

    const { data: existing, error: checkError } = await supabase.from("patients").select("id").eq("id", id).eq("hospital_id", hospitalId).single();
    if (checkError || !existing) return NextResponse.json({ success: false, error: "Patient record not found on this hospital node." }, { status: 404 });

    const { data: patient, error } = await supabase
      .from("patients")
      .update(updateFields)
      .eq("id", id)
      .eq("hospital_id", hospitalId)
      .select(`*, doctors:assigned_doctor_id ( id, doctor_name )`)
      .single();

    if (error) throw error;

    await createBlockchainRecord(hospitalId, "PATIENT_RECORD", patient.id, "UPDATED", {
      patient_name: patient.patient_name, diagnosis: patient.diagnosis, age: patient.age, status: patient.status
    });

    return NextResponse.json({ success: true, message: "Patient record updated successfully.", patient });
  } catch (error: any) {
    console.error("Update Patient Error:", error);
    return NextResponse.json({ success: false, error: "Server Error: Could not update patient record." }, { status: 500 });
  }
}

// DELETE /api/patients/:id
export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  const authRes = await protect(req);
  if (authRes.error) return authErrorResponse(authRes.error, authRes.status);
  const hospitalId = authRes.hospital.id;
  const { id } = await context.params;

  try {
    const { data: existing, error: checkError } = await supabase.from("patients").select("id, patient_name").eq("id", id).eq("hospital_id", hospitalId).single();
    if (checkError || !existing) return NextResponse.json({ success: false, error: "Patient record not found on this hospital node." }, { status: 404 });

    const { error } = await supabase.from("patients").delete().eq("id", id).eq("hospital_id", hospitalId);
    if (error) throw error;

    sendDeleteAlertEmail(authRes.hospital.admin_email, authRes.hospital.hospital_name, "Patient Record", existing.patient_name);
    await createBlockchainRecord(hospitalId, "PATIENT_RECORD", id, "REJECTED", { action: "delete_patient_profile", patient_id: id });

    return NextResponse.json({ success: true, message: "Patient record permanently deleted." });
  } catch (error: any) {
    console.error("Delete Patient Error:", error);
    return NextResponse.json({ success: false, error: "Server Error: Could not delete patient record." }, { status: 500 });
  }
}
