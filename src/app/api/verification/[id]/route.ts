import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseServer";
import { protect, authErrorResponse } from "@/lib/authUtils";
import { createBlockchainRecord } from "@/lib/utils/blockchain";

const VALID_STATUSES = ["PENDING", "UNDER_REVIEW", "VERIFIED", "REJECTED"];

// GET /api/verification/:id
export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const authRes = await protect(req);
  if (authRes.error) return authErrorResponse(authRes.error, authRes.status);
  const hospitalId = authRes.hospital.id;
  const { id } = await context.params;

  try {
    const { data: verification, error } = await supabase
      .from("doctor_verifications")
      .select(`*, doctors:doctor_id ( id, doctor_name, specialization, qualification, medical_license_number, aadhaar_number, years_of_experience )`)
      .eq("id", id).eq("hospital_id", hospitalId).single();

    if (error || !verification) return NextResponse.json({ success: false, error: "Verification record not found on this hospital node." }, { status: 404 });

    return NextResponse.json({ success: true, verification });
  } catch (error: any) {
    console.error("Get Verification Error:", error);
    return NextResponse.json({ success: false, error: "Server Error: Could not fetch verification record." }, { status: 500 });
  }
}

// PUT /api/verification/:id
export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  const authRes = await protect(req);
  if (authRes.error) return authErrorResponse(authRes.error, authRes.status);
  const hospitalId = authRes.hospital.id;
  const { id } = await context.params;

  try {
    const body = await req.json().catch(() => ({}));
    const { verification_status, reviewer_notes } = body;

    if (!verification_status) return NextResponse.json({ success: false, error: "verification_status is required." }, { status: 400 });
    if (!VALID_STATUSES.includes(verification_status)) return NextResponse.json({ success: false, error: `Invalid verification_status.` }, { status: 400 });

    const { data: existing, error: checkErr } = await supabase.from("doctor_verifications").select("id, doctor_id, hospital_id").eq("id", id).eq("hospital_id", hospitalId).single();
    if (checkErr || !existing) return NextResponse.json({ success: false, error: "Verification record not found on this hospital node." }, { status: 404 });

    const { data: verification, error } = await supabase
      .from("doctor_verifications")
      .update({ verification_status, reviewer_notes: reviewer_notes || null, reviewed_at: new Date().toISOString() })
      .eq("id", id).select("*").single();

    if (error) throw error;

    await supabase.from("doctors").update({
      verification_status: verification_status === "VERIFIED" ? "Verified" : verification_status === "REJECTED" ? "Rejected" : verification_status === "UNDER_REVIEW" ? "Under Review" : "Pending"
    }).eq("id", existing.doctor_id);

    let blockchainAction = "UPDATED";
    if (verification_status === "VERIFIED") blockchainAction = "VERIFIED";
    if (verification_status === "REJECTED") blockchainAction = "REJECTED";

    await createBlockchainRecord(existing.hospital_id, "DOCTOR_VERIFICATION", existing.doctor_id, blockchainAction, { status: verification_status, reviewer_notes });

    return NextResponse.json({ success: true, message: `Verification status updated to ${verification_status}.`, verification });
  } catch (error: any) {
    console.error("Update Verification Error:", error);
    return NextResponse.json({ success: false, error: "Server Error: Could not update verification status." }, { status: 500 });
  }
}
