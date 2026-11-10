import { NextRequest, NextResponse } from "next/server"
import { getBundleCredit } from "@/lib/authTokens"
import { clientSessionEmail } from "@/lib/clientSession"
import { resolveBundleCreditLookup } from "@/lib/bundleCreditAccess"

export const dynamic = "force-dynamic"

// GET /api/coaching/bundle-credit[?email=X]
// Used by the apply form to show a credit-available banner. Signed-in only and
// answers only for the session's own email, so nobody can check whether
// another person bought a bundle. The credit itself is applied at checkout
// from the application email, independent of this display lookup.
// Returns { available, amountCents, expiresAt }.
export async function GET(req: NextRequest) {
  const lookup = resolveBundleCreditLookup(await clientSessionEmail(), req.nextUrl.searchParams.get("email"))
  if (!lookup.ok) {
    return NextResponse.json({ available: false, amountCents: 0, expiresAt: null }, { status: lookup.status })
  }
  const { available, amountCents, expiresAt } = await getBundleCredit(lookup.email)
  return NextResponse.json({ available, amountCents, expiresAt })
}
