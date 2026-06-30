import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseServer";
import { protect, authErrorResponse } from "@/lib/authUtils";
import { generateHash } from "@/lib/utils/blockchain";

// GET /api/blockchain/verify/:id
export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const authRes = await protect(req);
  if (authRes.error) return authErrorResponse(authRes.error, authRes.status);
  const hospitalId = authRes.hospital.id;
  const { id } = await context.params;

  try {
    const { data: log, error } = await supabase.from("blockchain_logs").select("*").eq("id", id).eq("hospital_id", hospitalId).single();

    if (error || !log) return NextResponse.json({ success: false, error: "Blockchain verification ledger entry not found." }, { status: 404 });

    const computedHash = generateHash(log.metadata, log.previous_hash, log.created_at);
    const isValid = computedHash === log.current_hash;
    const currentStatus = isValid ? "VALID" : "TAMPERED";

    if (log.verified_status !== currentStatus) {
      await supabase.from("blockchain_logs").update({ verified_status: currentStatus }).eq("id", id);
    }

    return NextResponse.json({
      success: true, verified: isValid, verified_status: currentStatus, record_id: log.record_id, record_type: log.record_type,
      sealed_hash: log.current_hash, recomputed_hash: computedHash, previous_hash: log.previous_hash, action_type: log.action_type, timestamp: log.created_at
    });
  } catch (error: any) {
    console.error("Verify Blockchain Log Error:", error);
    return NextResponse.json({ success: false, error: "Server Error: Cryptographic verification routine failed." }, { status: 500 });
  }
}
