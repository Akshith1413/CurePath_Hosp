import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseServer";
import { protect, authErrorResponse } from "@/lib/authUtils";
import { createBlockchainRecord } from "@/lib/utils/blockchain";
import { sendDeleteAlertEmail } from "@/lib/utils/emailService";

// GET /api/insurance/:id
export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const authRes = await protect(req);
  if (authRes.error) return authErrorResponse(authRes.error, authRes.status);
  const hospitalId = authRes.hospital.id;
  const { id } = await context.params;

  try {
    const { data: policy, error } = await supabase
      .from("insurance_policies")
      .select(`*, patients:patient_id ( id, patient_name, age, gender )`)
      .eq("id", id).eq("hospital_id", hospitalId).single();

    if (error || !policy) return NextResponse.json({ success: false, error: "Insurance policy record not found." }, { status: 404 });
    return NextResponse.json({ success: true, policy });
  } catch (error: any) {
    console.error("Get Policy By ID Error:", error);
    return NextResponse.json({ success: false, error: "Server Error: Could not fetch insurance policy." }, { status: 500 });
  }
}

// PUT /api/insurance/:id
export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  const authRes = await protect(req);
  if (authRes.error) return authErrorResponse(authRes.error, authRes.status);
  const hospitalId = authRes.hospital.id;
  const { id } = await context.params;

  try {
    const updateFields = await req.json().catch(() => ({}));
    if (!updateFields || Object.keys(updateFields).length === 0) return NextResponse.json({ success: false, error: "No update fields provided." }, { status: 400 });

    const { data: existing, error: checkError } = await supabase.from("insurance_policies").select("id").eq("id", id).eq("hospital_id", hospitalId).single();
    if (checkError || !existing) return NextResponse.json({ success: false, error: "Insurance policy record not found." }, { status: 404 });

    if (updateFields.policy_status) {
      if (updateFields.policy_status === "ACTIVE") updateFields.verification_status = "VERIFIED";
      else if (updateFields.policy_status === "CANCELLED") updateFields.verification_status = "FAILED";
    }

    const { data: policy, error } = await supabase.from("insurance_policies").update(updateFields).eq("id", id).eq("hospital_id", hospitalId).select("*").single();
    if (error) throw error;

    let action = "UPDATED";
    if (policy.claim_status === "APPROVED") action = "APPROVED";
    if (policy.claim_status === "REJECTED") action = "REJECTED";

    await createBlockchainRecord(hospitalId, "INSURANCE_CLAIM", policy.id, action, {
      provider: policy.insurance_provider, policy_name: policy.policy_name, claim_status: policy.claim_status, verification_status: policy.verification_status
    });

    return NextResponse.json({ success: true, message: "Insurance policy updated successfully.", policy });
  } catch (error: any) {
    console.error("Update Policy Error:", error);
    return NextResponse.json({ success: false, error: "Server Error: Could not update insurance policy." }, { status: 500 });
  }
}

// DELETE /api/insurance/:id
export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  const authRes = await protect(req);
  if (authRes.error) return authErrorResponse(authRes.error, authRes.status);
  const hospitalId = authRes.hospital.id;
  const { id } = await context.params;

  try {
    const { data: existing, error: checkError } = await supabase.from("insurance_policies").select("id, policy_name").eq("id", id).eq("hospital_id", hospitalId).single();
    if (checkError || !existing) return NextResponse.json({ success: false, error: "Insurance policy record not found." }, { status: 404 });

    const { error } = await supabase.from("insurance_policies").delete().eq("id", id).eq("hospital_id", hospitalId);
    if (error) throw error;

    sendDeleteAlertEmail(authRes.hospital.admin_email, authRes.hospital.hospital_name, "Insurance Policy", existing.policy_name);
    await createBlockchainRecord(hospitalId, "INSURANCE_CLAIM", id, "REJECTED", { action: "delete_insurance_policy", policy_id: id });

    return NextResponse.json({ success: true, message: "Insurance policy record permanently deleted." });
  } catch (error: any) {
    console.error("Delete Policy Error:", error);
    return NextResponse.json({ success: false, error: "Server Error: Could not delete insurance policy." }, { status: 500 });
  }
}
