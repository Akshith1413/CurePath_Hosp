import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseServer";
import { protect, authErrorResponse } from "@/lib/authUtils";

// GET /api/blockchain/logs
export async function GET(req: Request) {
  const authRes = await protect(req);
  if (authRes.error) return authErrorResponse(authRes.error, authRes.status);
  const hospitalId = authRes.hospital.id;

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type");
    const status = url.searchParams.get("status");
    const limit = parseInt(url.searchParams.get("limit") || "30");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    let query = supabase
      .from("blockchain_logs")
      .select("*", { count: "exact" })
      .eq("hospital_id", hospitalId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (type) query = query.eq("record_type", type.toUpperCase());
    if (status) query = query.eq("verified_status", status.toUpperCase());

    const { data: logs, count, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, total: count || 0, limit, offset, logs: logs || [] });
  } catch (error: any) {
    console.error("Get Blockchain Logs Error:", error);
    return NextResponse.json({ success: false, error: "Server Error: Could not fetch blockchain logs from ledger node." }, { status: 500 });
  }
}
