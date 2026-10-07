import { NextRequest, NextResponse } from "next/server"
import { verifyAdminRequest } from "@/lib/adminAuth"
import { getCoachingClientRecord, updateCoachingClientRecord, clearCoachingClientField } from "@/lib/authTokens"
import { validateMacroCalorieConsistency } from "@/lib/nutrition"

export const dynamic = "force-dynamic"

type CustomMacrosIn = { calories?: number; protein?: number; carbs?: number; fat?: number }

// Sanity ceilings for coach-typed overrides. Catches obvious data-entry
// mistakes (extra digit, missing decimal, unit slip). Loose enough to accept
// any legitimately high target for a large athlete.
const MACRO_MAX = { calories: 5000, protein: 300, carbs: 700, fat: 250 } as const

function coerceNumber(v: unknown): number | undefined {
  const n = Number(v)
  if (!Number.isFinite(n) || n <= 0) return undefined
  return Math.round(n)
}

function macroOutOfRange(cm: { calories: number; protein: number; carbs: number; fat: number }): string | null {
  if (cm.calories > MACRO_MAX.calories) return `Calories ${cm.calories} exceeds the ${MACRO_MAX.calories} kcal safety ceiling. Double-check the number.`
  if (cm.protein > MACRO_MAX.protein) return `Protein ${cm.protein}g exceeds the ${MACRO_MAX.protein}g safety ceiling. Double-check the number.`
  if (cm.carbs > MACRO_MAX.carbs) return `Carbs ${cm.carbs}g exceeds the ${MACRO_MAX.carbs}g safety ceiling. Double-check the number.`
  if (cm.fat > MACRO_MAX.fat) return `Fat ${cm.fat}g exceeds the ${MACRO_MAX.fat}g safety ceiling. Double-check the number.`
  return null
}

// PATCH — admin sets or clears the complete coach macro override for a client.
//
// Policy (locked after review 2026-10-06):
//   - An override is ALWAYS a complete set of {calories, protein, carbs, fat}.
//     Partial overrides are rejected (returns 400). This keeps the active
//     target internally consistent and removes ambiguity about which number
//     the client is following.
//   - Protein × 4 + carbs × 4 + fat × 9 must agree with calories within the
//     tolerance in validateMacroCalorieConsistency (rounding slack allowed).
//     If it doesn't, the save is refused and the exact discrepancy is
//     returned so the admin can correct.
//   - To clear the override, send `{ customMacros: null }`. The entire
//     `customMacros` attribute is REMOVE'd from the DynamoDB record so the
//     client immediately drops back to the auto-computed target.
//
// Body:
//   PATCH set:   { customMacros: { calories, protein, carbs, fat } }
//   PATCH clear: { customMacros: null }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ email: string }> }) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { email: rawEmail } = await params
  const email = decodeURIComponent(rawEmail).toLowerCase()

  const client = await getCoachingClientRecord(email)
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 })

  let body: { customMacros?: CustomMacrosIn | null }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 })
  }

  // Explicit null → clear the override.
  if (body.customMacros === null) {
    try {
      await clearCoachingClientField(email, "customMacros")
      return NextResponse.json({ ok: true, customMacros: null })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown DynamoDB error"
      return NextResponse.json({ error: `Clear override failed: ${message}` }, { status: 500 })
    }
  }

  const cm = body.customMacros ?? {}
  const calories = coerceNumber(cm.calories)
  const protein = coerceNumber(cm.protein)
  const carbs = coerceNumber(cm.carbs)
  const fat = coerceNumber(cm.fat)

  // Complete-set rule: every macro must be present. Partial overrides are
  // rejected to prevent an "override calories only + auto protein" style of
  // save producing an incoherent active target.
  if (calories == null || protein == null || carbs == null || fat == null) {
    return NextResponse.json(
      { error: "An override must include calories, protein, carbs, and fat. Enter every field or clear the override." },
      { status: 400 }
    )
  }

  const complete = { calories, protein, carbs, fat }

  const rangeError = macroOutOfRange(complete)
  if (rangeError) {
    return NextResponse.json({ error: rangeError }, { status: 400 })
  }

  const consistencyError = validateMacroCalorieConsistency(complete)
  if (consistencyError) {
    return NextResponse.json({ error: consistencyError }, { status: 400 })
  }

  const updatedAt = new Date().toISOString()
  // Explicit object (no undefineds) so the SDK marshaller is never asked to
  // serialize a `customMacros` value with gaps.
  const customMacros = { calories, protein, carbs, fat, updatedAt }
  try {
    await updateCoachingClientRecord(email, { customMacros })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown DynamoDB error"
    return NextResponse.json({ error: `Save override failed: ${message}` }, { status: 500 })
  }
  return NextResponse.json({ ok: true, customMacros })
}
