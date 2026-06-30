import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseServer";
import { protect, authErrorResponse } from "@/lib/authUtils";
import { createBlockchainRecord } from "@/lib/utils/blockchain";

const VALID_TYPES = ["REGULAR", "EMERGENCY", "ICU", "FOLLOW_UP"];
const VALID_STATUSES = ["Scheduled", "In Progress", "Completed", "Cancelled"];

export async function GET(req: Request) {
  const authRes = await protect(req);
  if (authRes.error) return authErrorResponse(authRes.error, authRes.status);
  const hospitalId = authRes.hospital.id;

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type");
    const status = url.searchParams.get("status");
    const date = url.searchParams.get("date");
    const search = url.searchParams.get("search");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    let query = supabase
      .from("appointments")
      .select(`*, patients:patient_id ( id, patient_name ), doctors:doctor_id ( id, doctor_name, specialization )`, { count: "exact" })
      .eq("hospital_id", hospitalId)
      .order("appointment_date", { ascending: false })
      .order("appointment_time", { ascending: false })
      .range(offset, offset + limit - 1);

    if (type && VALID_TYPES.includes(type)) query = query.eq("appointment_type", type);
    if (status && VALID_STATUSES.includes(status)) query = query.eq("status", status);
    if (date) query = query.eq("appointment_date", date);
    if (search) query = query.or(`diagnosis.ilike.%${search}%,medication.ilike.%${search}%`);

    const { data: appointments, count, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, total: count || 0, limit, offset, appointments: appointments || [] });
  } catch (error: any) {
    console.error("Get Appointments Error:", error);
    return NextResponse.json({ success: false, error: "Server Error: Could not fetch appointments." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authRes = await protect(req);
  if (authRes.error) return authErrorResponse(authRes.error, authRes.status);
  const hospitalId = authRes.hospital.id;

  try {
    const body = await req.json().catch(() => ({}));
    const { patient_id, doctor_id, appointment_type, diagnosis, medication, treatment_duration, appointment_date, appointment_time, follow_up_date } = body;

    if (!patient_id || !doctor_id || !appointment_type || !appointment_date || !appointment_time) {
      return NextResponse.json({ success: false, error: "Required fields: patient_id, doctor_id, appointment_type, appointment_date, appointment_time." }, { status: 400 });
    }
    if (!VALID_TYPES.includes(appointment_type)) {
      return NextResponse.json({ success: false, error: `Invalid appointment_type. Must be one of: ${VALID_TYPES.join(", ")}` }, { status: 400 });
    }

    const { data: patient, error: patErr } = await supabase.from("patients").select("id, patient_name").eq("id", patient_id).eq("hospital_id", hospitalId).single();
    if (patErr || !patient) return NextResponse.json({ success: false, error: "Patient not found on this hospital node." }, { status: 404 });

    const { data: doctor, error: docErr } = await supabase.from("doctors").select("id, doctor_name").eq("id", doctor_id).eq("hospital_id", hospitalId).single();
    if (docErr || !doctor) return NextResponse.json({ success: false, error: "Doctor not found on this hospital node." }, { status: 404 });

    const { data: appointment, error } = await supabase
      .from("appointments")
      .insert([{ hospital_id: hospitalId, patient_id, doctor_id, appointment_type, diagnosis: diagnosis || null, medication: medication || null, treatment_duration: treatment_duration || "30 mins", appointment_date, appointment_time, follow_up_date: follow_up_date || null, status: "Scheduled" }])
      .select("*")
      .single();

    if (error) throw error;

    if (appointment.medication) {
      await createBlockchainRecord(hospitalId, "PRESCRIPTION", appointment.patient_id, "CREATED", {
        doctor_name: doctor.doctor_name, patient_name: patient.patient_name, medication: appointment.medication, diagnosis: appointment.diagnosis
      });
    }

    return NextResponse.json({ success: true, message: "Appointment scheduled successfully.", appointment: { ...appointment, patient_name: patient.patient_name, doctor_name: doctor.doctor_name } }, { status: 201 });
  } catch (error: any) {
    console.error("Create Appointment Error:", error);
    return NextResponse.json({ success: false, error: "Server Error: Could not create appointment." }, { status: 500 });
  }
}
