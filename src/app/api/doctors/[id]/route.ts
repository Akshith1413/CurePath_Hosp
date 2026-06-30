import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseServer";
import { protect, authErrorResponse } from "@/lib/authUtils";
import { createBlockchainRecord } from "@/lib/utils/blockchain";
import { sendDeleteAlertEmail } from "@/lib/utils/emailService";

// GET /api/doctors/:id
export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const authRes = await protect(req);
  if (authRes.error) return authErrorResponse(authRes.error, authRes.status);
  const hospitalId = authRes.hospital.id;
  const { id } = await context.params;

  try {
    const { data: doctor, error } = await supabase.from("doctors").select("*").eq("id", id).eq("hospital_id", hospitalId).single();
    if (error || !doctor) return NextResponse.json({ success: false, error: "Doctor record not found on this hospital node." }, { status: 404 });

    const { data: assignedPatients, error: patError } = await supabase
      .from("patients").select("id, patient_name, diagnosis, status, admission_date")
      .eq("assigned_doctor_id", id).eq("hospital_id", hospitalId).order("admission_date", { ascending: false });
    if (patError) throw patError;

    return NextResponse.json({ success: true, doctor: { ...doctor, assigned_patients: assignedPatients || [] } });
  } catch (error: any) {
    console.error("Get Doctor Error:", error);
    return NextResponse.json({ success: false, error: "Server Error: Could not fetch doctor record." }, { status: 500 });
  }
}

// PUT /api/doctors/:id
export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  const authRes = await protect(req);
  if (authRes.error) return authErrorResponse(authRes.error, authRes.status);
  const hospitalId = authRes.hospital.id;
  const { id } = await context.params;

  try {
    const updateFields = await req.json().catch(() => ({}));
    if (!updateFields || Object.keys(updateFields).length === 0) return NextResponse.json({ success: false, error: "No fields provided to update." }, { status: 400 });

    const { data: existing, error: checkError } = await supabase.from("doctors").select("id").eq("id", id).eq("hospital_id", hospitalId).single();
    if (checkError || !existing) return NextResponse.json({ success: false, error: "Doctor record not found on this hospital node." }, { status: 404 });

    const { data: doctor, error } = await supabase.from("doctors").update(updateFields).eq("id", id).eq("hospital_id", hospitalId).select("*").single();
    if (error) throw error;

    await createBlockchainRecord(hospitalId, "DOCTOR_VERIFICATION", doctor.id, "UPDATED", {
      doctor_name: doctor.doctor_name, specialization: doctor.specialization, license: doctor.medical_license_number, status: doctor.verification_status
    });

    return NextResponse.json({ success: true, message: "Doctor record updated successfully.", doctor });
  } catch (error: any) {
    console.error("Update Doctor Error:", error);
    return NextResponse.json({ success: false, error: "Server Error: Could not update doctor record." }, { status: 500 });
  }
}

// DELETE /api/doctors/:id
export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  const authRes = await protect(req);
  if (authRes.error) return authErrorResponse(authRes.error, authRes.status);
  const hospitalId = authRes.hospital.id;
  const { id } = await context.params;

  try {
    const { data: existing, error: checkError } = await supabase.from("doctors").select("id, full_name").eq("id", id).eq("hospital_id", hospitalId).single();
    if (checkError || !existing) return NextResponse.json({ success: false, error: "Doctor record not found on this hospital node." }, { status: 404 });

    const { error } = await supabase.from("doctors").delete().eq("id", id).eq("hospital_id", hospitalId);
    if (error) throw error;

    sendDeleteAlertEmail(authRes.hospital.admin_email, authRes.hospital.hospital_name, "Doctor Record", existing.full_name);
    await createBlockchainRecord(hospitalId, "DOCTOR_VERIFICATION", id, "REJECTED", { action: "delete_doctor_profile", doctor_id: id });

    return NextResponse.json({ success: true, message: "Doctor record permanently deleted." });
  } catch (error: any) {
    console.error("Delete Doctor Error:", error);
    return NextResponse.json({ success: false, error: "Server Error: Could not delete doctor record." }, { status: 500 });
  }
}
