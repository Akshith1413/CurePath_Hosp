import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseServer";
import { protect, authErrorResponse } from "@/lib/authUtils";

// POST /api/settings/logo
export async function POST(req: Request) {
  const authRes = await protect(req);
  if (authRes.error) return authErrorResponse(authRes.error, authRes.status);
  const hospitalId = authRes.hospital.id;

  try {
    const formData = await req.formData();
    const logoFile = formData.get("logo") as File | null;

    if (!logoFile || logoFile.size === 0) return NextResponse.json({ success: false, error: "No logo file found in request." }, { status: 400 });

    const arrayBuffer = await logoFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const filePath = `hospital-logos/${hospitalId}/logo.png`;

    const { error } = await supabase.storage.from("doctor-documents").upload(filePath, buffer, { contentType: logoFile.type, upsert: true });
    if (error) throw error;

    const { data: urlData } = supabase.storage.from("doctor-documents").getPublicUrl(filePath);

    return NextResponse.json({ success: true, message: "Hospital logo uploaded successfully.", logoUrl: urlData.publicUrl }, { status: 201 });
  } catch (error: any) {
    console.error("Upload Logo Error:", error);
    return NextResponse.json({ success: false, error: "Server Error: Could not upload hospital logo." }, { status: 500 });
  }
}
