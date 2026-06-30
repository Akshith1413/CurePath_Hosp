import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseServer";
import { protect, authErrorResponse } from "@/lib/authUtils";

// GET /api/blockchain/logs/:id
export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const authRes = await protect(req);
  if (authRes.error) return authErrorResponse(authRes.error, authRes.status);
  const hospitalId = authRes.hospital.id;
  const { id } = await context.params;

  try {
    const { data: log, error } = await supabase.from("blockchain_logs").select("*").eq("id", id).eq("hospital_id", hospitalId).single();

    if (error || !log) return NextResponse.json({ success: false, error: "Blockchain log entry not found on this trust node." }, { status: 404 });

    return NextResponse.json({ success: true, log });
  } catch (error: any) {
    console.error("Get Blockchain Log Error:", error);
    return NextResponse.json({ success: false, error: "Server Error: Could not fetch ledger node log." }, { status: 500 });
  }
}
