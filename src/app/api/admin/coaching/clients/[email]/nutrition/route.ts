import { NextRequest, NextResponse } from "next/server"
import { verifyAdminRequest } from "@/lib/adminAuth"
import { getCoachingClientRecord, updateCoachingClientRecord } from "@/lib/authTokens"

export const dynamic = "force-dynamic"

type CustomMacros = { calories?: number; protein?: number; carbs?: number; fat?: number }

// Sanity ceilings for coach-typed overrides. Tight enough to catch an
// obvious data-entry mistake (extra digit, missing decimal, unit slip),
// loose enough to allow a legitimately high target for a large athlete.
//
// Rough references for the protein number: a 250 lb (113 kg) client on
// fat-loss at 2.0 g/kg lands at ~227 g. A 300 lb (136 kg) client on
// fat-loss at 2.0 g/kg lands at ~272 g. A cap at 300 g accepts every
// automatic calculation this codebase produces for any weight inside
// the 60–500 lb plausibility band, plus headroom for a coach who wants
// to push above the auto number.
//
// Values are strict upper bounds — the PATCH refuses to save anything
// greater. Anything caught here is almost always a typo, not a
// physiological maximum.
const MACRO_MAX = { calories: 5000, protein: 300, carbs: 700, fat: 250 } as const

function coerceNumber(v: unknown): number | undefined {
  const n = Number(v)
  if (!Number.isFinite(n) || n <= 0) return undefined
  return Math.round(n)
}

function macroOutOfRange(cm: { calories?: number; protein?: number; carbs?: number; fat?: number }): string | null {
  if (cm.calories != null && cm.calories > MACRO_MAX.calories) return `Calories ${cm.calories} exceeds the ${MACRO_MAX.calories} kcal safety ceiling. Double-check the number.`
  if (cm.protein != null && cm.protein > MACRO_MAX.protein) return `Protein ${cm.protein}g exceeds the ${MACRO_MAX.protein}g safety ceiling. Double-check the number.`
  if (cm.carbs != null && cm.carbs > MACRO_MAX.carbs) return `Carbs ${cm.carbs}g exceeds the ${MACRO_MAX.carbs}g safety ceiling. Double-check the number.`
  if (cm.fat != null && cm.fat > MACRO_MAX.fat) return `Fat ${cm.fat}g exceeds the ${MACRO_MAX.fat}g safety ceiling. Double-check the number.`
  return null
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

  // Sanity-check before persisting so an accidental extra digit (350 vs.
  // 35) or unit slip never becomes a stored macro target.
  const rangeError = macroOutOfRange(cleaned)
  if (rangeError) {
    return NextResponse.json({ error: rangeError }, { status: 400 })
  }

  const updatedAt = new Date().toISOString()
  await updateCoachingClientRecord(email, { customMacros: { ...cleaned, updatedAt } })
  return NextResponse.json({ ok: true, customMacros: { ...cleaned, updatedAt } })
}
