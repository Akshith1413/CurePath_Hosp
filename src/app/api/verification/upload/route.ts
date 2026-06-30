import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseServer";
import { protect, authErrorResponse } from "@/lib/authUtils";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  const authRes = await protect(req);
  if (authRes.error) return authErrorResponse(authRes.error, authRes.status);

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const cudocId = formData.get("cudocId") as string;
    
    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    if (!cudocId) {
      return NextResponse.json({ success: false, error: "CUDOC ID is required" }, { status: 400 });
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${cudocId}_${crypto.randomUUID()}.${fileExt}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data, error } = await supabaseAdmin.storage
      .from("verifications")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (error) {
      console.error("Storage upload error:", error);
      return NextResponse.json({ success: false, error: "Failed to upload to storage" }, { status: 500 });
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from("verifications")
      .getPublicUrl(fileName);

    const fileUrl = publicUrlData.publicUrl;

    const { data: docData } = await supabaseAdmin.from("doctors").select("verification_docs").eq("cudoc_id", cudocId).single();
    if (docData) {
      const currentDocs = docData.verification_docs || [];
      await supabaseAdmin.from("doctors").update({ 
        verification_docs: [...currentDocs, fileUrl],
        verification_status: "Pending" 
      }).eq("cudoc_id", cudocId);
    }

    return NextResponse.json({ success: true, message: "File uploaded successfully", fileUrl });
  } catch (err: any) {
    console.error("Upload Error:", err);
    return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
  }
}
