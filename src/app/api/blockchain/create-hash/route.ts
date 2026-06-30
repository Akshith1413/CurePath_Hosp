import { NextResponse } from "next/server";
import { protect, authErrorResponse } from "@/lib/authUtils";
import { createBlockchainRecord } from "@/lib/utils/blockchain";

const VALID_RECORD_TYPES = ["PRESCRIPTION", "DOCTOR_VERIFICATION", "INSURANCE_CLAIM", "EMERGENCY_CASE", "PATIENT_RECORD"];
const VALID_ACTION_TYPES = ["CREATED", "UPDATED", "VERIFIED", "APPROVED", "REJECTED"];

export async function POST(req: Request) {
  const authRes = await protect(req);
  if (authRes.error) return authErrorResponse(authRes.error, authRes.status);
  const hospitalId = authRes.hospital.id;

  try {
    const body = await req.json().catch(() => ({}));
    const { record_type, record_id, action_type, record_data } = body;

    if (!record_type || !action_type) return NextResponse.json({ success: false, error: "Both record_type and action_type are required." }, { status: 400 });

    const normalizedType = record_type.toUpperCase();
    const normalizedAction = action_type.toUpperCase();

    if (!VALID_RECORD_TYPES.includes(normalizedType)) return NextResponse.json({ success: false, error: `Invalid record_type.` }, { status: 400 });
    if (!VALID_ACTION_TYPES.includes(normalizedAction)) return NextResponse.json({ success: false, error: `Invalid action_type.` }, { status: 400 });

    const result = await createBlockchainRecord(hospitalId, normalizedType, record_id, normalizedAction, record_data || {});

    if (!result.success) return NextResponse.json({ success: false, error: result.error || "Failed to seal record onto private trust chain." }, { status: 500 });

    return NextResponse.json({ success: true, message: "Cryptographic hash sealed successfully onto private blockchain ledger.", log: result.log }, { status: 201 });
  } catch (error: any) {
    console.error("Create Blockchain Hash Error:", error);
    return NextResponse.json({ success: false, error: "Server Error: Could not verify and log record metadata." }, { status: 500 });
  }
}
