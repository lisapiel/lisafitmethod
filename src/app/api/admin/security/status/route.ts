import { NextRequest, NextResponse } from "next/server"
import { checkAdminRequest } from "@/lib/adminAuth"
import { adminMfaRequired } from "@/lib/adminMfa"

export const dynamic = "force-dynamic"

// Exempt from the two-factor rule on purpose: this is how the admin layout
// and /admin/security learn that two-factor is still to be set up.
export async function GET(req: NextRequest) {
  const access = await checkAdminRequest(req, { exempt: true })
  if (!access.ok) return NextResponse.json({ error: "Unauthorized", reason: access.reason }, { status: 401 })
  const mfaRequired = adminMfaRequired()
  return NextResponse.json({
    email: access.email,
    mfaEnabled: access.mfaEnabled,
    mfaRequired,
    adminAllowed: !mfaRequired || access.mfaEnabled,
  })
}
