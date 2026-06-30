import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseServer";
import { protect, authErrorResponse } from "@/lib/authUtils";
import { createBlockchainRecord } from "@/lib/utils/blockchain";

// GET /api/insurance
export async function GET(req: Request) {
  const authRes = await protect(req);
  if (authRes.error) return authErrorResponse(authRes.error, authRes.status);
  const hospitalId = authRes.hospital.id;

  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("search");
    const policy_status = url.searchParams.get("policy_status");
    const claim_status = url.searchParams.get("claim_status");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    let query = supabase
      .from("insurance_policies")
      .select(`*, patients:patient_id ( id, patient_name )`, { count: "exact" })
      .eq("hospital_id", hospitalId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (policy_status) query = query.eq("policy_status", policy_status);
    if (claim_status) query = query.eq("claim_status", claim_status);
    if (search) query = query.or(`policy_name.ilike.%${search}%,insurance_provider.ilike.%${search}%`);

    const { data: policies, count, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, total: count || 0, limit, offset, policies: policies || [] });
  } catch (error: any) {
    console.error("Get Policies Error:", error);
    return NextResponse.json({ success: false, error: "Server Error: Could not fetch insurance policies." }, { status: 500 });
  }
}

// POST /api/insurance/add (Handled as POST /api/insurance)
export async function POST(req: Request) {
  const authRes = await protect(req);
  if (authRes.error) return authErrorResponse(authRes.error, authRes.status);
  const hospitalId = authRes.hospital.id;

  try {
    const body = await req.json().catch(() => ({}));
    const { patient_id, policy_name, insurance_provider, coverage_amount, premium_amount, policy_status, claim_status, policy_start_date, policy_end_date } = body;

    if (!policy_name || !insurance_provider || coverage_amount === undefined || premium_amount === undefined || !policy_start_date || !policy_end_date) {
      return NextResponse.json({ success: false, error: "Please provide all required fields: policy_name, insurance_provider, coverage_amount, premium_amount, policy_start_date, policy_end_date." }, { status: 400 });
    }

    let verification_status = "PENDING";
    if (policy_status === "ACTIVE") verification_status = "VERIFIED";
    else if (policy_status === "CANCELLED") verification_status = "FAILED";

    const { data: policy, error } = await supabase
      .from("insurance_policies")
      .insert([{
        hospital_id: hospitalId, patient_id: patient_id || null, policy_name, insurance_provider,
        coverage_amount: parseFloat(coverage_amount), premium_amount: parseFloat(premium_amount),
        policy_status: policy_status || "PENDING", claim_status: claim_status || "NOT_CLAIMED",
        verification_status, policy_start_date, policy_end_date
      }])
      .select("*")
      .single();

    if (error) throw error;

    await createBlockchainRecord(hospitalId, "INSURANCE_CLAIM", policy.id, "CREATED", {
      provider: policy.insurance_provider, policy_name: policy.policy_name, coverage: policy.coverage_amount, premium: policy.premium_amount
    });

    return NextResponse.json({ success: true, message: "Insurance policy registered successfully.", policy }, { status: 201 });
  } catch (error: any) {
    console.error("Add Policy Error:", error);
    return NextResponse.json({ success: false, error: "Server Error: Could not register insurance policy." }, { status: 500 });
  }
}
