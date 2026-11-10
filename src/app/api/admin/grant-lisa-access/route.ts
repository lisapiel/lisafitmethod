import { NextResponse } from "next/server"
import { grantTrainingAccess, grantNutritionAccess, ADMIN_EMAIL } from "@/lib/authTokens"
import { adminSessionEmail } from "@/lib/adminAuth"

export const dynamic = "force-dynamic"

export async function POST() {
  const email = await adminSessionEmail()

  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  await grantTrainingAccess(ADMIN_EMAIL)
  await grantNutritionAccess(ADMIN_EMAIL)

  return NextResponse.json({ ok: true, message: "Access granted to Training + Nutrition Foundations" })
}
