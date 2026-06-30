import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseServer";
import { protect, authErrorResponse } from "@/lib/authUtils";

// GET /api/settings/branches
export async function GET(req: Request) {
  const authRes = await protect(req);
  if (authRes.error) return authErrorResponse(authRes.error, authRes.status);
  const hospitalId = authRes.hospital.id;

  try {
    const { data: branches, error } = await supabase
      .from("hospital_branches")
      .select("*")
      .eq("hospital_id", hospitalId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return NextResponse.json({ success: true, branches: branches || [] });
  } catch (error: any) {
    console.error("Get Branches Error:", error);
    return NextResponse.json({ success: false, error: "Server Error: Could not fetch branches." }, { status: 500 });
  }
}
