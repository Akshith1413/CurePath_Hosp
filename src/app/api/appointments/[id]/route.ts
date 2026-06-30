import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseServer";
import { protect, authErrorResponse } from "@/lib/authUtils";
import { createBlockchainRecord } from "@/lib/utils/blockchain";

const VALID_TYPES = ["REGULAR", "EMERGENCY", "ICU", "FOLLOW_UP"];
const VALID_STATUSES = ["Scheduled", "In Progress", "Completed", "Cancelled"];

// GET /api/appointments/:id
export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const authRes = await protect(req);
  if (authRes.error) return authErrorResponse(authRes.error, authRes.status);
  const hospitalId = authRes.hospital.id;
  const { id } = await context.params;

  try {
    const { data: appointment, error } = await supabase
      .from("appointments")
      .select(`*, patients:patient_id ( id, patient_name, age, gender, blood_group ), doctors:doctor_id ( id, doctor_name, specialization, qualification )`)
      .eq("id", id)
      .eq("hospital_id", hospitalId)
      .single();

    if (error || !appointment) return NextResponse.json({ success: false, error: "Appointment not found on this hospital node." }, { status: 404 });

    return NextResponse.json({ success: true, appointment });
  } catch (error: any) {
    console.error("Get Appointment Error:", error);
    return NextResponse.json({ success: false, error: "Server Error: Could not fetch appointment." }, { status: 500 });
  }
}

// PUT /api/appointments/:id
export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  const authRes = await protect(req);
  if (authRes.error) return authErrorResponse(authRes.error, authRes.status);
  const hospitalId = authRes.hospital.id;
  const { id } = await context.params;

  try {
    const updateFields = await req.json().catch(() => ({}));
    if (!updateFields || Object.keys(updateFields).length === 0) return NextResponse.json({ success: false, error: "No fields provided to update." }, { status: 400 });

    if (updateFields.appointment_type && !VALID_TYPES.includes(updateFields.appointment_type)) {
      return NextResponse.json({ success: false, error: `Invalid appointment_type. Must be one of: ${VALID_TYPES.join(", ")}` }, { status: 400 });
    }
    if (updateFields.status && !VALID_STATUSES.includes(updateFields.status)) {
      return NextResponse.json({ success: false, error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` }, { status: 400 });
    }

    const { data: existing, error: checkErr } = await supabase.from("appointments").select("id").eq("id", id).eq("hospital_id", hospitalId).single();
    if (checkErr || !existing) return NextResponse.json({ success: false, error: "Appointment not found on this hospital node." }, { status: 404 });

    const { data: appointment, error } = await supabase.from("appointments").update(updateFields).eq("id", id).eq("hospital_id", hospitalId).select("*").single();
    if (error) throw error;

    if (updateFields.medication || updateFields.diagnosis) {
      await createBlockchainRecord(hospitalId, "PRESCRIPTION", appointment.patient_id, "UPDATED", {
        medication: appointment.medication, diagnosis: appointment.diagnosis, status: appointment.status
      });
    }

    return NextResponse.json({ success: true, message: "Appointment updated successfully.", appointment });
  } catch (error: any) {
    console.error("Update Appointment Error:", error);
    return NextResponse.json({ success: false, error: "Server Error: Could not update appointment." }, { status: 500 });
  }
}

// DELETE /api/appointments/:id
export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  const authRes = await protect(req);
  if (authRes.error) return authErrorResponse(authRes.error, authRes.status);
  const hospitalId = authRes.hospital.id;
  const { id } = await context.params;

  try {
    const { data: existing, error: checkErr } = await supabase.from("appointments").select("id").eq("id", id).eq("hospital_id", hospitalId).single();
    if (checkErr || !existing) return NextResponse.json({ success: false, error: "Appointment not found on this hospital node." }, { status: 404 });

    const { error } = await supabase.from("appointments").delete().eq("id", id).eq("hospital_id", hospitalId);
    if (error) throw error;

    return NextResponse.json({ success: true, message: "Appointment permanently deleted." });
  } catch (error: any) {
    console.error("Delete Appointment Error:", error);
    return NextResponse.json({ success: false, error: "Server Error: Could not delete appointment." }, { status: 500 });
  }
}
