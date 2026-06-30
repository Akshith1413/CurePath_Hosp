import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const { email, cudocId } = await req.json();

    if (!email || !cudocId) {
      return NextResponse.json({ success: false, error: "Missing email or CUDOC ID" }, { status: 400 });
    }

    // First find the profile to ensure the email matches
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .eq("cudoc_id", cudocId)
      .single();

    if (!profile) {
      return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 });
    }

    // Now fetch the verification docs from doctors table
    const { data: doctor } = await supabase
      .from("doctors")
      .select("verification_docs")
      .eq("id", profile.id)
      .single();

    if (!doctor || !doctor.verification_docs || doctor.verification_docs.length === 0) {
      return NextResponse.json({ success: false, error: "No documents found" }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      docs: doctor.verification_docs 
    });

  } catch (error: any) {
    console.error("Retrieve Docs Error:", error);
    return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
  }
}
