import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { supabase } from "@/lib/supabaseServer";
import { protect, authErrorResponse } from "@/lib/authUtils";
import { generateSecret, verifyTOTP } from "@/lib/utils/totp";
import { sendLoginAlertEmail } from "@/lib/utils/emailService";

const generateToken = (id: string) => {
  return jwt.sign(
    { id }, 
    process.env.JWT_SECRET || "your_super_secret_jwt_key_change_this_in_production", 
    { expiresIn: (process.env.JWT_EXPIRES_IN || "24h") as any }
  );
};

export async function POST(req: Request, context: { params: Promise<{ action: string }> }) {
  const { action } = await context.params;

  try {
    const body = await req.json().catch(() => ({}));

    // verify-login is public
    if (action === "verify-login") {
      return await verifyMFALogin(body, req);
    }

    // Other actions are private
    const authRes = await protect(req);
    if (authRes.error) return authErrorResponse(authRes.error, authRes.status);
    const hospital = authRes.hospital;

    switch (action) {
      case "enroll":
        return await enrollMFA(hospital);
      case "enable":
        return await verifyAndEnableMFA(body, hospital);
      case "disable":
        return await disableMFA(body, hospital);
      default:
        return NextResponse.json({ success: false, error: "Action not found" }, { status: 404 });
    }
  } catch (error: any) {
    console.error("MFA POST Error:", error);
    return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
  }
}

async function verifyMFALogin(body: any, req: Request) {
  const { tempToken, code } = body;
  if (!tempToken || !code) return NextResponse.json({ success: false, error: "Missing temporary verification token or 6-digit code." }, { status: 400 });

  try {
    const decoded: any = jwt.verify(tempToken, process.env.JWT_SECRET || "your_super_secret_jwt_key_change_this_in_production");
    if (!decoded.isTemp) return NextResponse.json({ success: false, error: "Invalid authentication token signature." }, { status: 400 });

    const { data: hospital, error } = await supabase.from("hospitals").select("*").eq("id", decoded.id).single();
    if (error || !hospital || !hospital.mfa_enabled || !hospital.mfa_secret) return NextResponse.json({ success: false, error: "Node login registry mismatch or MFA disabled." }, { status: 400 });

    if (!verifyTOTP(hospital.mfa_secret, code)) return NextResponse.json({ success: false, error: "Invalid 6-digit code. Please verify and try again." }, { status: 401 });

    const token = generateToken(hospital.id);
    const ip = req.headers.get("x-forwarded-for") || "Local Network Gateway";
    sendLoginAlertEmail(hospital.admin_email, hospital.hospital_name, ip);

    return NextResponse.json({
      success: true,
      message: "Multi-factor Authentication verified. Node connected.",
      token,
      hospital: {
        id: hospital.id, hospitalName: hospital.hospital_name, registrationNumber: hospital.registration_number,
        branchName: hospital.branch_name, state: hospital.state, city: hospital.city, adminEmail: hospital.admin_email,
        contactNumber: hospital.contact_number, isVerified: hospital.is_verified, createdAt: hospital.created_at, mfaEnabled: hospital.mfa_enabled
      }
    }, { status: 200 });
  } catch (err: any) {
    if (err.name === "TokenExpiredError") return NextResponse.json({ success: false, error: "Login session expired. Please log in again." }, { status: 400 });
    return NextResponse.json({ success: false, error: "Server Error: Code verification failed." }, { status: 500 });
  }
}

async function enrollMFA(hospital: any) {
  const { data: dbHospital, error } = await supabase.from("hospitals").select("mfa_enabled, admin_email").eq("id", hospital.id).single();
  if (error || !dbHospital) return NextResponse.json({ success: false, error: "Hospital node not found." }, { status: 404 });
  if (dbHospital.mfa_enabled) return NextResponse.json({ success: false, error: "Multi-factor Authentication is already enabled." }, { status: 400 });

  const secret = generateSecret();
  const email = dbHospital.admin_email || "admin";
  const otpauthUrl = `otpauth://totp/CurePath:${email}?secret=${secret}&issuer=CurePath`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(otpauthUrl)}`;

  return NextResponse.json({ success: true, secret, qrCodeUrl }, { status: 200 });
}

async function verifyAndEnableMFA(body: any, hospital: any) {
  const { secret, code } = body;
  if (!secret || !code) return NextResponse.json({ success: false, error: "Please provide the secret and the 6-digit verification code." }, { status: 400 });
  if (!verifyTOTP(secret, code)) return NextResponse.json({ success: false, error: "Invalid verification code. Please check your authenticator app and try again." }, { status: 400 });

  const { error } = await supabase.from("hospitals").update({ mfa_enabled: true, mfa_secret: secret }).eq("id", hospital.id);
  if (error) throw error;
  return NextResponse.json({ success: true, message: "Multi-factor Authentication has been successfully enabled on your node." }, { status: 200 });
}

async function disableMFA(body: any, hospital: any) {
  const { code } = body;
  if (!code) return NextResponse.json({ success: false, error: "Please provide your 6-digit verification code to disable MFA." }, { status: 400 });

  const { data: dbHospital, error: selectError } = await supabase.from("hospitals").select("mfa_secret").eq("id", hospital.id).single();
  if (selectError || !dbHospital || !dbHospital.mfa_secret) return NextResponse.json({ success: false, error: "MFA is not set up on this node." }, { status: 400 });
  if (!verifyTOTP(dbHospital.mfa_secret, code)) return NextResponse.json({ success: false, error: "Invalid verification code." }, { status: 400 });

  const { error } = await supabase.from("hospitals").update({ mfa_enabled: false, mfa_secret: null }).eq("id", hospital.id);
  if (error) throw error;
  return NextResponse.json({ success: true, message: "Multi-factor Authentication has been disabled." }, { status: 200 });
}
