import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseServer";
import { protect, authErrorResponse } from "@/lib/authUtils";

// GET /api/patients/global?search=xyz
export async function GET(req: Request) {
  const authRes = await protect(req);
  if (authRes.error) return authErrorResponse(authRes.error, authRes.status);

  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("search");

    if (!search || search.length < 2) {
      return NextResponse.json({ success: true, profiles: [] });
    }

    // Search globally across profiles (by name, email, cupat_id, or aadhar_number)
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, aadhar_number, email, cupat_id, date_of_birth")
      .or(`full_name.ilike.%${search}%,email.ilike.%${search}%,cupat_id.ilike.%${search}%,aadhar_number.ilike.%${search}%`)
      .limit(10);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, profiles: data || [] });
  } catch (error: any) {
    console.error("Global Patient Search Error:", error);
    return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
  }
}

// POST for explicit matching
export async function POST(req: Request) {
  const authRes = await protect(req);
  if (authRes.error) return authErrorResponse(authRes.error, authRes.status);

  try {
    const { type, value } = await req.json();

    if (!type || !value) {
      return NextResponse.json({ success: false, error: "Missing search parameters" }, { status: 400 });
    }

    let query = supabase.from("profiles").select("*");
    
    if (type === "uuid" || type === "cupat_id") {
      query = query.eq("cupat_id", value).or(`id.eq.${value}`); // fallback to id just in case
    } else if (type === "aadhar") {
      query = query.eq("aadhar_number", value);
    } else {
      return NextResponse.json({ success: false, error: "Invalid search type" }, { status: 400 });
    }

    const { data, error } = await query.limit(1).maybeSingle();

    if (error || !data) {
      return NextResponse.json({ success: false, error: "Patient not found in global network" }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      profile: {
        id: data.id,
        cupat_id: data.cupat_id,
        email: data.email,
        full_name: data.full_name,
        aadhar_number: data.aadhar_number,
        age: data.date_of_birth ? Math.floor((new Date().getTime() - new Date(data.date_of_birth).getTime()) / 31557600000) : null,
        phone: null, 
        address: null,
        gender: null,
        blood_group: null
      }
    });

  } catch (error: any) {
    console.error("Global Patient Search Error:", error);
    return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
  }
}
