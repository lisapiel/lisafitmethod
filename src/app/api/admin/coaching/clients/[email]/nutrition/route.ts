import { NextRequest, NextResponse } from "next/server"
import { verifyAdminRequest } from "@/lib/adminAuth"
import { getCoachingClientRecord, updateCoachingClientRecord } from "@/lib/authTokens"

export const dynamic = "force-dynamic"

type CustomMacros = { calories?: number; protein?: number; carbs?: number; fat?: number }

function coerceNumber(v: unknown): number | undefined {
  const n = Number(v)
  if (!Number.isFinite(n) || n <= 0) return undefined
  return Math.round(n)
}

// PATCH — admin sets/clears the coach macro override for a client.
// Body: { customMacros: { calories?, protein?, carbs?, fat? } | null }
// If customMacros is null (or all fields empty), the override is cleared.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ email: string }> }) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { email: rawEmail } = await params
  const email = decodeURIComponent(rawEmail).toLowerCase()

  const client = await getCoachingClientRecord(email)
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 })

  const body = await req.json() as { customMacros?: CustomMacros | null }

  if (body.customMacros === null) {
    // Clear the override
    await updateCoachingClientRecord(email, { customMacros: undefined })
    return NextResponse.json({ ok: true, customMacros: null })
  }

  const cm: CustomMacros = body.customMacros ?? {}
  const cleaned = {
    calories: coerceNumber(cm.calories),
    protein: coerceNumber(cm.protein),
    carbs: coerceNumber(cm.carbs),
    fat: coerceNumber(cm.fat),
  }
  const allEmpty = cleaned.calories == null && cleaned.protein == null && cleaned.carbs == null && cleaned.fat == null
  if (allEmpty) {
    await updateCoachingClientRecord(email, { customMacros: undefined })
    return NextResponse.json({ ok: true, customMacros: null })
  }

  const updatedAt = new Date().toISOString()
  await updateCoachingClientRecord(email, { customMacros: { ...cleaned, updatedAt } })
  return NextResponse.json({ ok: true, customMacros: { ...cleaned, updatedAt } })
}
