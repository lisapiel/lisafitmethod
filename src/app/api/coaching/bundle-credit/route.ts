import { NextRequest, NextResponse } from "next/server"
import { getBundleCredit } from "@/lib/authTokens"

export const dynamic = "force-dynamic"

// GET /api/coaching/bundle-credit?email=X
// Public — used by the apply form to show a credit-available banner when the
// applicant's email matches a bundle purchase within the credit window.
// Returns { available, amountCents, expiresAt, purchasedAt }.
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ available: false, amountCents: 0, expiresAt: null, purchasedAt: null })
  }
  const credit = await getBundleCredit(email)
  return NextResponse.json(credit)
}
