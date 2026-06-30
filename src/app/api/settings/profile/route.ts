import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseServer";
import { protect, authErrorResponse } from "@/lib/authUtils";

// GET /api/settings/profile
export async function GET(req: Request) {
  const authRes = await protect(req);
  if (authRes.error) return authErrorResponse(authRes.error, authRes.status);
  const hospitalId = authRes.hospital.id;

  try {
    const { data: hospital, error } = await supabase
      .from("hospitals")
      .select("id, hospital_name, registration_number, branch_name, state, city, admin_email, contact_number, is_verified, created_at")
      .eq("id", hospitalId).single();

    if (error || !hospital) return NextResponse.json({ success: false, error: "Hospital profile not found." }, { status: 404 });

    const profile = { ...hospital, logo_url: `https://yjppxjpvfphwgfrgtglr.supabase.co/storage/v1/object/public/doctor-documents/hospital-logos/${hospitalId}/logo.png` };
    return NextResponse.json({ success: true, profile });
  } catch (error: any) {
    console.error("Get Profile Error:", error);
    return NextResponse.json({ success: false, error: "Server Error: Could not fetch hospital profile." }, { status: 500 });
  }
}

// PUT /api/settings/profile
export async function PUT(req: Request) {
  const authRes = await protect(req);
  if (authRes.error) return authErrorResponse(authRes.error, authRes.status);
  const hospitalId = authRes.hospital.id;

  try {
    const body = await req.json().catch(() => ({}));
    const { hospital_name, branch_name, state, city, contact_number } = body;

    const updateFields: any = {};
    if (hospital_name) updateFields.hospital_name = hospital_name;
    if (branch_name) updateFields.branch_name = branch_name;
    if (state) updateFields.state = state;
    if (city) updateFields.city = city;
    if (contact_number) updateFields.contact_number = contact_number;

    if (Object.keys(updateFields).length === 0) return NextResponse.json({ success: false, error: "No valid fields provided to update." }, { status: 400 });

    const { data: hospital, error } = await supabase
      .from("hospitals").update(updateFields).eq("id", hospitalId)
      .select("id, hospital_name, registration_number, branch_name, state, city, admin_email, contact_number, is_verified, created_at")
      .single();

    if (error) throw error;
    const profile = { ...hospital, logo_url: `https://yjppxjpvfphwgfrgtglr.supabase.co/storage/v1/object/public/doctor-documents/hospital-logos/${hospitalId}/logo.png` };

    return NextResponse.json({ success: true, message: "Hospital profile updated successfully.", profile });
  } catch (error: any) {
    console.error("Update Profile Error:", error);
    return NextResponse.json({ success: false, error: "Server Error: Could not update hospital profile." }, { status: 500 });
  }
}
