import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseServer";
import { protect, authErrorResponse } from "@/lib/authUtils";

// POST /api/settings/branch
export async function POST(req: Request) {
  const authRes = await protect(req);
  if (authRes.error) return authErrorResponse(authRes.error, authRes.status);
  const hospitalId = authRes.hospital.id;

  try {
    const body = await req.json().catch(() => ({}));
    const { branch_name, branch_code, address, city, state, phone, is_primary } = body;

    if (!branch_name || !branch_code || !address || !city || !state || !phone) return NextResponse.json({ success: false, error: "Required fields: branch_name, branch_code, address, city, state, phone." }, { status: 400 });

    if (is_primary) await supabase.from("hospital_branches").update({ is_primary: false }).eq("hospital_id", hospitalId);

    const { data: branch, error } = await supabase.from("hospital_branches")
      .insert([{ hospital_id: hospitalId, branch_name, branch_code, address, city, state, phone, is_primary: is_primary || false }])
      .select("*").single();
    
    if (error) throw error;
    return NextResponse.json({ success: true, message: "Branch added successfully.", branch }, { status: 201 });
  } catch (error: any) {
    console.error("Add Branch Error:", error);
    return NextResponse.json({ success: false, error: "Server Error: Could not add branch." }, { status: 500 });
  }
}
