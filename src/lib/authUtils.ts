import jwt from "jsonwebtoken";
import { supabase } from "./supabaseServer";
import { NextResponse } from "next/server";

export async function protect(req: Request): Promise<{ error: string, status: number, hospital?: undefined } | { error?: undefined, status?: undefined, hospital: any }> {
  const authHeader = req.headers.get("authorization");

  if (authHeader && authHeader.startsWith("Bearer")) {
    try {
      const token = authHeader.split(" ")[1];
      let hospitalId = null;

      // 1. Try Supabase Auth API
      const { data: authData, error: authError } = await supabase.auth.getUser(token);
      
      if (!authError && authData && authData.user) {
        hospitalId = authData.user.id;
      } else {
        // 2. Fallback to local JWT verification
        try {
          const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "your_super_secret_jwt_key_change_this_in_production");
          hospitalId = decoded.id;
        } catch (jwtErr) {
          return { error: "Node authorization failed: Invalid session signature.", status: 401 };
        }
      }

      // Retrieve hospital node info from Supabase database
      const { data: hospital, error } = await supabase
        .from("hospitals")
        .select("id, hospital_name, registration_number, state, admin_email, contact_number, is_verified, created_at, mfa_enabled")
        .eq("id", hospitalId)
        .single();

      if (error || !hospital) {
        return { error: "Node authorization failed: Hospital registry not found.", status: 401 };
      }

      return { hospital };
    } catch (error: any) {
      console.error("JWT Verification Error:", error.message);
      return { error: "Node authorization failed: Invalid session signature.", status: 401 };
    }
  }

  return { error: "Node authorization failed: Authorization session token missing.", status: 401 };
}

// Helper for sending auth errors easily in routes
export function authErrorResponse(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status });
}
