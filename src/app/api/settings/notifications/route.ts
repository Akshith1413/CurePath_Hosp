import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseServer";
import { protect, authErrorResponse } from "@/lib/authUtils";

// GET /api/settings/notifications
export async function GET(req: Request) {
  const authRes = await protect(req);
  if (authRes.error) return authErrorResponse(authRes.error, authRes.status);
  const hospitalId = authRes.hospital.id;

  try {
    let { data: prefs, error } = await supabase.from("notification_preferences").select("*").eq("hospital_id", hospitalId).single();
    if (error || !prefs) {
      const { data: newPrefs, error: insertErr } = await supabase.from("notification_preferences").insert([{ hospital_id: hospitalId }]).select("*").single();
      if (insertErr) throw insertErr;
      prefs = newPrefs;
    }
    return NextResponse.json({ success: true, preferences: prefs });
  } catch (error: any) {
    console.error("Get Notifications Error:", error);
    return NextResponse.json({ success: false, error: "Server Error: Could not fetch notification preferences." }, { status: 500 });
  }
}

// PUT /api/settings/notifications
export async function PUT(req: Request) {
  const authRes = await protect(req);
  if (authRes.error) return authErrorResponse(authRes.error, authRes.status);
  const hospitalId = authRes.hospital.id;

  try {
    const body = await req.json().catch(() => ({}));
    const { appointment_alerts, emergency_alerts, doctor_verification_alerts, blockchain_sync_alerts, email_reports, sms_alerts } = body;

    const updateFields: any = { updated_at: new Date().toISOString() };
    if (appointment_alerts !== undefined) updateFields.appointment_alerts = appointment_alerts;
    if (emergency_alerts !== undefined) updateFields.emergency_alerts = emergency_alerts;
    if (doctor_verification_alerts !== undefined) updateFields.doctor_verification_alerts = doctor_verification_alerts;
    if (blockchain_sync_alerts !== undefined) updateFields.blockchain_sync_alerts = blockchain_sync_alerts;
    if (email_reports !== undefined) updateFields.email_reports = email_reports;
    if (sms_alerts !== undefined) updateFields.sms_alerts = sms_alerts;

    const { data: existing } = await supabase.from("notification_preferences").select("id").eq("hospital_id", hospitalId).single();
    let prefs;
    if (existing) {
      const { data, error } = await supabase.from("notification_preferences").update(updateFields).eq("hospital_id", hospitalId).select("*").single();
      if (error) throw error;
      prefs = data;
    } else {
      const { data, error } = await supabase.from("notification_preferences").insert([{ hospital_id: hospitalId, ...updateFields }]).select("*").single();
      if (error) throw error;
      prefs = data;
    }
    return NextResponse.json({ success: true, message: "Notification preferences updated successfully.", preferences: prefs });
  } catch (error: any) {
    console.error("Update Notifications Error:", error);
    return NextResponse.json({ success: false, error: "Server Error: Could not update notification preferences." }, { status: 500 });
  }
}
