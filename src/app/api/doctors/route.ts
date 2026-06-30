import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseServer";
import { protect, authErrorResponse } from "@/lib/authUtils";
import { createBlockchainRecord } from "@/lib/utils/blockchain";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// GET /api/doctors
export async function GET(req: Request) {
  const authRes = await protect(req);
  if (authRes.error) return authErrorResponse(authRes.error, authRes.status);
  const hospitalId = authRes.hospital.id;

  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("search");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const offset = parseInt(url.searchParams.get("offset") || "0");
    const status = url.searchParams.get("status");

    let query = supabase
      .from("doctors")
      .select("*", { count: "exact" })
      .eq("hospital_id", hospitalId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) query = query.or(`doctor_name.ilike.%${search}%,specialization.ilike.%${search}%`);
    if (status) query = query.eq("verification_status", status);

    const { data: doctors, count, error } = await query;
    if (error) throw error;

    const doctorsWithCases = await Promise.all(
      (doctors || []).map(async (doc) => {
        const { data: assignedPatients } = await supabase
          .from("patients").select("id, patient_name").eq("assigned_doctor_id", doc.id).eq("status", "Admitted");
        return { ...doc, assigned_patients: assignedPatients || [], active_cases: assignedPatients ? assignedPatients.length : 0 };
      })
    );

    return NextResponse.json({ success: true, total: count || 0, limit, offset, doctors: doctorsWithCases });
  } catch (error: any) {
    console.error("Get All Doctors Error:", error);
    return NextResponse.json({ success: false, error: "Server Error: Could not fetch doctors." }, { status: 500 });
  }
}

// POST /api/doctors/add (We'll use POST /api/doctors to follow REST, but handle add)
export async function POST(req: Request) {
  const authRes = await protect(req);
  if (authRes.error) return authErrorResponse(authRes.error, authRes.status);
  const hospitalId = authRes.hospital.id;

  try {
    const body = await req.json().catch(() => ({}));
    const { doctor_name, specialization, qualification, medical_license_number, aadhaar_number, years_of_experience, contact_number, email_id, age, current_hospital, cudoc_id } = body;

    if (!doctor_name || !specialization || !medical_license_number || !aadhaar_number) {
      return NextResponse.json({ success: false, error: "Please provide all required fields." }, { status: 400 });
    }

    const { data: existing, error: dupError } = await supabase.from("doctors").select("id").eq("medical_license_number", medical_license_number);
    if (dupError && dupError.code !== 'PGRST116') throw dupError;
    if (existing && existing.length > 0) return NextResponse.json({ success: false, error: "A doctor with this medical license number is already registered." }, { status: 400 });

    // 1. Resolve Global Profile
    let profileId = null;
    let finalCudocId = cudoc_id;

    if (cudoc_id) {
      const { data: existingProfile } = await supabaseAdmin.from("profiles").select("id").eq("cudoc_id", cudoc_id).single();
      if (existingProfile) profileId = existingProfile.id;
    } 

    if (!profileId && email_id) {
      const { data: existingProfile } = await supabaseAdmin.from("profiles").select("id, cudoc_id").eq("email", email_id).single();
      if (existingProfile) {
        profileId = existingProfile.id;
        finalCudocId = existingProfile.cudoc_id;
      } else {
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: email_id,
          password: `P@ss${Math.random().toString(36).slice(-8)}`,
          email_confirm: true
        });
        
        if (authError) {
          console.error("Failed to create global auth user for doctor:", authError);
          // Fallback to local profile generation if auth fails (e.g. invalid permissions)
          profileId = crypto.randomUUID(); 
        } else {
          profileId = authData.user.id;
        }

        finalCudocId = `CUDOC-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
        
        await new Promise(r => setTimeout(r, 1000));
        await supabaseAdmin.from("profiles").upsert({
          id: profileId,
          email: email_id,
          cudoc_id: finalCudocId,
          aadhar_number: aadhaar_number || null,
          full_name: doctor_name,
          role: 'doctor'
        });
      }
    }

    if (!profileId) {
       profileId = crypto.randomUUID();
    }

    const { data: doctor, error } = await supabaseAdmin
      .from("doctors")
      .insert([{
        id: profileId, // Explicitly set ID from profile to satisfy foreign key
        hospital_id: hospitalId, 
        doctor_name, 
        specialization, 
        qualification, 
        medical_license_number, 
        aadhaar_number,
        years_of_experience: years_of_experience ? parseInt(years_of_experience) : 0, 
        contact_number, 
        verification_status: "Pending",
        email_id: email_id || null,
        age: age ? parseInt(age) : null,
        current_hospital: current_hospital ? [current_hospital] : [],
        cudoc_id: finalCudocId || null
      }])
      .select("*")
      .single();
    if (error) throw error;

    await supabaseAdmin.from("doctor_verifications").insert([{ hospital_id: hospitalId, doctor_id: doctor.id, verification_status: "PENDING" }]);
    await createBlockchainRecord(hospitalId, "DOCTOR_VERIFICATION", doctor.id, "CREATED", { doctor_name: doctor.doctor_name, specialization: doctor.specialization, license: doctor.medical_license_number });

    return NextResponse.json({ success: true, message: "Doctor successfully registered on the hospital node.", doctor }, { status: 201 });
  } catch (error: any) {
    console.error("Add Doctor Error:", error);
    return NextResponse.json({ success: false, error: "Server Error: Could not register doctor." }, { status: 500 });
  }
}
