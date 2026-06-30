import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseServer";
import { protect, authErrorResponse } from "@/lib/authUtils";
import { createBlockchainRecord } from "@/lib/utils/blockchain";
import crypto from "crypto";

const VALID_STATUSES = ["PENDING", "UNDER_REVIEW", "VERIFIED", "REJECTED"];
const STORAGE_BUCKET = "doctor-documents";

const DOC_FIELDS: Record<string, string> = {
  degree_certificate: "degree_certificate_url",
  medical_license: "medical_license_url",
  aadhaar_card: "aadhaar_card_url",
  experience_certificate: "experience_certificate_url"
};

async function uploadToStorage(file: File, hospitalId: string, doctorId: string, docType: string) {
  const ext = file.name.split(".").pop() ? `.${file.name.split(".").pop()}` : ".pdf";
  const uniqueName = `${hospitalId}/${doctorId}/${docType}_${crypto.randomUUID()}${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(uniqueName, buffer, { contentType: file.type, upsert: false });

  if (error) throw error;
  const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(data.path);
  return urlData.publicUrl;
}

export async function GET(req: Request) {
  const authRes = await protect(req);
  if (authRes.error) return authErrorResponse(authRes.error, authRes.status);
  const hospitalId = authRes.hospital.id;

  try {
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    let query = supabase
      .from("doctor_verifications")
      .select(`*, doctors:doctor_id ( id, doctor_name, specialization, qualification, medical_license_number )`, { count: "exact" })
      .eq("hospital_id", hospitalId)
      .order("submitted_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && VALID_STATUSES.includes(status)) query = query.eq("verification_status", status);

    const { data: verifications, count, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, total: count || 0, limit, offset, verifications: verifications || [] });
  } catch (error: any) {
    console.error("Get Verifications Error:", error);
    return NextResponse.json({ success: false, error: "Server Error: Could not fetch verification records." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authRes = await protect(req);
  if (authRes.error) return authErrorResponse(authRes.error, authRes.status);
  const hospitalId = authRes.hospital.id;

  try {
    const formData = await req.formData();
    const doctor_id = formData.get("doctor_id")?.toString();

    if (!doctor_id) return NextResponse.json({ success: false, error: "doctor_id is required in the form data." }, { status: 400 });

    const { data: doctor, error: docErr } = await supabase.from("doctors").select("id, doctor_name").eq("id", doctor_id).eq("hospital_id", hospitalId).single();
    if (docErr || !doctor) return NextResponse.json({ success: false, error: "Doctor not found on this hospital node." }, { status: 404 });

    const uploadedUrls: Record<string, string> = {};

    for (const [fieldName, dbColumn] of Object.entries(DOC_FIELDS)) {
      const file = formData.get(fieldName) as File | null;
      if (file && file.size > 0) {
        if (file.size > 10 * 1024 * 1024) return NextResponse.json({ success: false, error: `File ${fieldName} is too large. Max 10MB.` }, { status: 400 });
        const url = await uploadToStorage(file, hospitalId, doctor_id, fieldName);
        uploadedUrls[dbColumn] = url;
      }
    }

    if (Object.keys(uploadedUrls).length === 0) return NextResponse.json({ success: false, error: "No valid document fields found in the upload." }, { status: 400 });

    const { data: existing, error: existErr } = await supabase.from("doctor_verifications").select("id").eq("doctor_id", doctor_id).eq("hospital_id", hospitalId).single();
    
    let verification;
    if (existing) {
      const { data, error } = await supabase.from("doctor_verifications").update({ ...uploadedUrls, verification_status: "PENDING", submitted_at: new Date().toISOString() }).eq("id", existing.id).select("*").single();
      if (error) throw error;
      verification = data;
    } else {
      const { data, error } = await supabase.from("doctor_verifications").insert([{ hospital_id: hospitalId, doctor_id, ...uploadedUrls, verification_status: "PENDING" }]).select("*").single();
      if (error) throw error;
      verification = data;
    }

    return NextResponse.json({ success: true, message: `${Object.keys(uploadedUrls).length} document(s) uploaded successfully for Dr. ${doctor.doctor_name}.`, verification }, { status: 201 });
  } catch (error: any) {
    console.error("Upload Verification Error:", error);
    return NextResponse.json({ success: false, error: "Server Error: Could not upload verification documents." }, { status: 500 });
  }
}
