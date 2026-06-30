import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseServer";
import { protect, authErrorResponse } from "@/lib/authUtils";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  const authRes = await protect(req);
  if (authRes.error) return authErrorResponse(authRes.error, authRes.status);

  try {
    const { profile_id } = await req.json();

    if (!profile_id) {
      return NextResponse.json({ success: false, error: "Missing profile_id" }, { status: 400 });
    }

    // 1. Fetch global medical records for this patient
    const { data: records, error } = await supabase
      .from("medical_records")
      .select("*, hospitals ( name )")
      .eq("patient_id", profile_id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Map records for prompt and frontend
    const mappedRecords = (records || []).map(r => ({
      created_at: r.created_at,
      hospital_name: r.hospitals?.name || "Unknown Hospital",
      diagnosis: r.diagnosis,
      course_of_treatment: r.course_of_treatment,
      prescription: r.prescription,
      notes: r.notes
    }));

    let summary = "No medical records found in the blockchain for this patient.";

    // 2. Generate AI Summary if records exist
    if (mappedRecords.length > 0) {
      if (!process.env.GEMINI_API_KEY) {
        summary = "AI Summarization is currently unavailable (Missing API Key). Please review the raw records below.";
      } else {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
          You are a highly capable AI medical assistant. I will provide you with a patient's immutable medical history retrieved from a global blockchain network across different hospitals.
          Please provide a concise, professional, and easy-to-read summary of their health history for a doctor who is seeing them now.
          Highlight chronic conditions, recent major treatments, and active prescriptions. Do not invent any information.

          Here are the records:
          ${JSON.stringify(mappedRecords, null, 2)}
        `;

        const result = await model.generateContent(prompt);
        summary = result.response.text();
      }
    }

    return NextResponse.json({ 
      success: true, 
      summary,
      records: mappedRecords
    });

  } catch (error: any) {
    console.error("AI Summary Error:", error);
    return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
  }
}
