import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseServer";
import { protect, authErrorResponse } from "@/lib/authUtils";

// PUT /api/settings/branch/:id
export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  const authRes = await protect(req);
  if (authRes.error) return authErrorResponse(authRes.error, authRes.status);
  const hospitalId = authRes.hospital.id;
  const { id } = await context.params;

  try {
    const updateFields = await req.json().catch(() => ({}));
    if (!updateFields || Object.keys(updateFields).length === 0) return NextResponse.json({ success: false, error: "No fields provided to update." }, { status: 400 });

    if (updateFields.is_primary) await supabase.from("hospital_branches").update({ is_primary: false }).eq("hospital_id", hospitalId);

    const { data: branch, error } = await supabase.from("hospital_branches").update(updateFields).eq("id", id).eq("hospital_id", hospitalId).select("*").single();
    if (error) throw error;
    
    return NextResponse.json({ success: true, message: "Branch updated successfully.", branch });
  } catch (error: any) {
    console.error("Update Branch Error:", error);
    return NextResponse.json({ success: false, error: "Server Error: Could not update branch." }, { status: 500 });
  }
}

// DELETE /api/settings/branch/:id
export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  const authRes = await protect(req);
  if (authRes.error) return authErrorResponse(authRes.error, authRes.status);
  const hospitalId = authRes.hospital.id;
  const { id } = await context.params;

  try {
    const { error } = await supabase.from("hospital_branches").delete().eq("id", id).eq("hospital_id", hospitalId);
    if (error) throw error;
    return NextResponse.json({ success: true, message: "Branch deleted successfully." });
  } catch (error: any) {
    console.error("Delete Branch Error:", error);
    return NextResponse.json({ success: false, error: "Server Error: Could not delete branch." }, { status: 500 });
  }
}
