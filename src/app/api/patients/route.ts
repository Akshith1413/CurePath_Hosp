import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseServer";
import { protect, authErrorResponse } from "@/lib/authUtils";
import { createBlockchainRecord } from "@/lib/utils/blockchain";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// GET /api/patients (GetAll)
export async function GET(req: Request) {
  const authRes = await protect(req);
  if (authRes.error) return authErrorResponse(authRes.error, authRes.status);
  const hospitalId = authRes.hospital.id;

  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("search");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    let query = supabase
      .from("patients")
      .select(`*, doctors:assigned_doctor_id ( id, doctor_name )`, { count: "exact" })
      .eq("hospital_id", hospitalId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`patient_name.ilike.%${search}%,diagnosis.ilike.%${search}%`);
    }

    const { data: patients, count, error } = await query;
    if (error) throw error;

    return NextResponse.json({
      success: true,
      total: count || 0,
      limit,
      offset,
      patients: patients || []
    });
  } catch (error: any) {
    console.error("Get All Patients Error:", error);
    return NextResponse.json({ success: false, error: "Server Error: Could not fetch patients." }, { status: 500 });
  }
}

// POST /api/patients (AddPatient)
export async function POST(req: Request) {
  const authRes = await protect(req);
  if (authRes.error) return authErrorResponse(authRes.error, authRes.status);
  const hospitalId = authRes.hospital.id;

  try {
    const body = await req.json().catch(() => ({}));
    const { patient_name, age, gender, blood_group, phone, address, diagnosis, assigned_doctor_id, medication, admission_date, email, aadhar_number, cupat_id } = body;

    if (!patient_name || !diagnosis) {
      return NextResponse.json({ success: false, error: "Please provide all required patient fields (name, diagnosis)." }, { status: 400 });
    }

    // 1. Resolve Global Profile
    let profileId = null;
    let finalCupatId = cupat_id;

    if (cupat_id) {
      // Find existing
      const { data: existingProfile } = await supabaseAdmin.from("profiles").select("id").eq("cupat_id", cupat_id).single();
      if (existingProfile) profileId = existingProfile.id;
    } 
    
    if (!profileId && email) {
      // Find by email
      const { data: existingProfile } = await supabaseAdmin.from("profiles").select("id, cupat_id").eq("email", email).single();
      if (existingProfile) {
        profileId = existingProfile.id;
        finalCupatId = existingProfile.cupat_id;
      } else {
        // Create new auth user
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: email,
          password: `P@ss${Math.random().toString(36).slice(-8)}`,
          email_confirm: true
        });
        
        if (authError) {
          console.error("Auth creation error:", authError);
          profileId = crypto.randomUUID();
        } else {
          profileId = authData.user.id;
        }
        
        finalCupatId = `CUPAT-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
        
        // Wait for trigger to create profile, then update it
        await new Promise(r => setTimeout(r, 1000));
        await supabaseAdmin.from("profiles").upsert({
          id: profileId,
          email,
          cupat_id: finalCupatId,
          aadhar_number: aadhar_number || null,
          full_name: patient_name,
          role: 'patient'
        });
      }
    }

    if (!profileId) {
      profileId = crypto.randomUUID();
    }

    // 2. Insert into local patients table
    const { data: patient, error } = await supabaseAdmin
      .from("patients")
      .insert([{
        hospital_id: hospitalId,
        patient_name,
        age: age ? parseInt(age) : null,
        gender, blood_group, phone, address, diagnosis,
        assigned_doctor_id: assigned_doctor_id || null,
        medication: medication || null,
        admission_date: admission_date || new Date().toISOString().split("T")[0],
        status: "Admitted",
        email: email || null,
        cupat_id: finalCupatId || null,
        aadhar_number: aadhar_number || null
      }])
      .select("*")
      .single();

    if (error) throw error;

    // 3. Insert into global medical_records if profile resolved
    if (profileId) {
      const { error: medError } = await supabaseAdmin.from("medical_records").insert([{
        patient_id: profileId,
        hospital_id: hospitalId,
        diagnosis,
        course_of_treatment: "Admitted",
        prescription: medication || "None",
        notes: `Patient ${patient_name} admitted at hospital.`,
        created_at: new Date().toISOString()
      }]);
      if (medError) console.error("Failed to insert medical record:", medError);
    }

    await createBlockchainRecord(hospitalId, "PATIENT_RECORD", patient.id, "CREATED", {
      patient_name: patient.patient_name, diagnosis: patient.diagnosis, cupat_id: finalCupatId
    });

    return NextResponse.json({ success: true, message: "Patient registered globally and locally.", patient }, { status: 201 });
  } catch (error: any) {
    console.error("Add Patient Error:", error);
    return NextResponse.json({ success: false, error: "Server Error: Could not register patient." }, { status: 500 });
  }
}
