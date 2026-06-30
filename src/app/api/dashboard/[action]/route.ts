import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseServer";
import { protect, authErrorResponse } from "@/lib/authUtils";

export async function GET(req: Request, context: { params: Promise<{ action: string }> }) {
  const { action } = await context.params;
  
  const authRes = await protect(req);
  if (authRes.error) return authErrorResponse(authRes.error, authRes.status);
  const hospitalId = authRes.hospital.id;

  try {
    switch (action) {
      case "stats":
        return await getDashboardStats(hospitalId);
      case "recent-activities":
        return await getRecentActivities(hospitalId);
      case "emergency-alerts":
        return await getEmergencyAlerts(hospitalId);
      default:
        return NextResponse.json({ success: false, error: "Action not found" }, { status: 404 });
    }
  } catch (error: any) {
    console.error(`Dashboard GET ${action} Error:`, error);
    return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
  }
}

async function getDashboardStats(hospitalId: string) {
  const today = new Date().toISOString().split("T")[0];

  const { count: totalPatients, error: patientError } = await supabase
    .from("patients").select("*", { count: "exact", head: true }).eq("hospital_id", hospitalId);
  if (patientError) throw patientError;

  const { data: doctorsData, error: doctorError } = await supabase
    .from("doctors").select("verification_status").eq("hospital_id", hospitalId);
  if (doctorError) throw doctorError;

  const totalDoctors = doctorsData ? doctorsData.length : 0;
  const verifiedDoctors = doctorsData ? doctorsData.filter(d => d.verification_status === "Verified").length : 0;

  const { count: appointmentsToday, error: appointmentError } = await supabase
    .from("appointments").select("*", { count: "exact", head: true })
    .eq("hospital_id", hospitalId).eq("appointment_date", today);
  if (appointmentError) throw appointmentError;

  const { count: emergencyCases, error: emergencyError } = await supabase
    .from("emergency_cases").select("*", { count: "exact", head: true })
    .eq("hospital_id", hospitalId).not("emergency_status", "in", '("Stabilized","Discharged","Admitted to ICU")');
  if (emergencyError) throw emergencyError;

  const { count: icuPatients, error: icuError } = await supabase
    .from("emergency_cases").select("*", { count: "exact", head: true })
    .eq("hospital_id", hospitalId).eq("icu_required", true).not("emergency_status", "eq", "Discharged");
  if (icuError) throw icuError;

  return NextResponse.json({
    success: true,
    stats: {
      totalPatients: totalPatients || 0,
      totalDoctors: totalDoctors || 0,
      verifiedDoctors: verifiedDoctors || 0,
      appointmentsToday: appointmentsToday || 0,
      emergencyCases: emergencyCases || 0,
      icuPatients: icuPatients || 0
    }
  });
}

async function getRecentActivities(hospitalId: string) {
  const { data: activities, error } = await supabase
    .from("recent_activities").select("id, activity_type, description, timestamp")
    .eq("hospital_id", hospitalId).order("timestamp", { ascending: false }).limit(10);
  if (error) throw error;
  return NextResponse.json({ success: true, activities: activities || [] });
}

async function getEmergencyAlerts(hospitalId: string) {
  const { data: alerts, error } = await supabase
    .from("emergency_cases")
    .select(`id, emergency_level, symptoms, admission_time, emergency_status, icu_required, patients:patient_id ( id, patient_name )`)
    .eq("hospital_id", hospitalId)
    .not("emergency_status", "in", '("Stabilized","Discharged")')
    .order("created_at", { ascending: false });
  if (error) throw error;
  return NextResponse.json({ success: true, alerts: alerts || [] });
}
