import { NextResponse } from "next/server";
import { protect, authErrorResponse } from "@/lib/authUtils";
import { verifyChainIntegrity } from "@/lib/utils/blockchain";

// GET /api/blockchain/verify-chain
export async function GET(req: Request) {
  const authRes = await protect(req);
  if (authRes.error) return authErrorResponse(authRes.error, authRes.status);
  const hospitalId = authRes.hospital.id;

  try {
    const auditResult = await verifyChainIntegrity(hospitalId);

    if (!auditResult.success) {
      return NextResponse.json({ success: false, error: auditResult.error || "Chain audit verification routine failed." }, { status: 500 });
    }

    return NextResponse.json({ success: true, verified: auditResult.verified, count: auditResult.count, failedBlockId: auditResult.failedBlockId || null, reason: auditResult.reason || null });
  } catch (error: any) {
    console.error("Chain Audit Error:", error);
    return NextResponse.json({ success: false, error: "Server Error: Cryptographic chain audit failed." }, { status: 500 });
  }
}
