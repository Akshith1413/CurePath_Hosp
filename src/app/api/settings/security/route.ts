import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseServer";
import { protect, authErrorResponse } from "@/lib/authUtils";

// GET /api/settings/security
export async function GET(req: Request) {
  const authRes = await protect(req);
  if (authRes.error) return authErrorResponse(authRes.error, authRes.status);
  const hospitalId = authRes.hospital.id;

  try {
    let { data: settings, error } = await supabase.from("hospital_settings").select("*").eq("hospital_id", hospitalId).single();

    if (error || !settings) {
      const { data: newSettings, error: insertErr } = await supabase.from("hospital_settings").insert([{ hospital_id: hospitalId }]).select("*").single();
      if (insertErr) throw insertErr;
      settings = newSettings;
    }

    const { data: hospitalNode } = await supabase.from("hospitals").select("mfa_enabled").eq("id", hospitalId).single();
    if (hospitalNode) settings.two_factor_enabled = hospitalNode.mfa_enabled;

    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    console.error("Get Security Error:", error);
    return NextResponse.json({ success: false, error: "Server Error: Could not fetch security settings." }, { status: 500 });
  }
}

// PUT /api/settings/security
export async function PUT(req: Request) {
  const authRes = await protect(req);
  if (authRes.error) return authErrorResponse(authRes.error, authRes.status);
  const hospitalId = authRes.hospital.id;

  try {
    const body = await req.json().catch(() => ({}));
    const { aadhaar_verification_enabled, session_timeout_minutes, ip_whitelist_enabled, ip_whitelist, blockchain_network, auto_backup_enabled, audit_log_retention_days } = body;

    const updateFields: any = { updated_at: new Date().toISOString() };
    if (aadhaar_verification_enabled !== undefined) updateFields.aadhaar_verification_enabled = aadhaar_verification_enabled;
    if (session_timeout_minutes !== undefined) updateFields.session_timeout_minutes = parseInt(session_timeout_minutes);
    if (ip_whitelist_enabled !== undefined) updateFields.ip_whitelist_enabled = ip_whitelist_enabled;
    if (ip_whitelist !== undefined) updateFields.ip_whitelist = ip_whitelist;
    if (blockchain_network) updateFields.blockchain_network = blockchain_network;
    if (auto_backup_enabled !== undefined) updateFields.auto_backup_enabled = auto_backup_enabled;
    if (audit_log_retention_days !== undefined) updateFields.audit_log_retention_days = parseInt(audit_log_retention_days);

    const { data: existing } = await supabase.from("hospital_settings").select("id").eq("hospital_id", hospitalId).single();
    let settings;
    if (existing) {
      const { data, error } = await supabase.from("hospital_settings").update(updateFields).eq("hospital_id", hospitalId).select("*").single();
      if (error) throw error;
      settings = data;
    } else {
      const { data, error } = await supabase.from("hospital_settings").insert([{ hospital_id: hospitalId, ...updateFields }]).select("*").single();
      if (error) throw error;
      settings = data;
    }
    return NextResponse.json({ success: true, message: "Security settings updated successfully.", settings });
  } catch (error: any) {
    console.error("Update Security Error:", error);
    return NextResponse.json({ success: false, error: "Server Error: Could not update security settings." }, { status: 500 });
  }
}
