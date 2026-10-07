import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { fetchAuthSession } from "aws-amplify/auth/server"
import { runWithAmplifyServerContext } from "@/lib/amplify-server"
import {
  getNutritionLog,
  updateNutritionLog,
  deleteNutritionLog,
  type NutritionLogRecord,
} from "@/lib/authTokens"

export const dynamic = "force-dynamic"

async function getSessionEmail(): Promise<string | null> {
  return runWithAmplifyServerContext({
    nextServerContext: { cookies },
    operation: async (contextSpec): Promise<string | null> => {
      try {
        const session = await fetchAuthSession(contextSpec)
        return (session.tokens?.idToken?.payload?.email as string | undefined) ?? null
      } catch {
        return null
      }
    },
  })
}

type Ctx = { params: Promise<{ id: string }> }

// PATCH — client edits one of their own logs (calories/protein/carbs/fat/description/mealType).
// Immutable fields (id, clientEmail, loggedAt, date, timeZone, targetAtLog) are enforced server-side.
export async function PATCH(req: Request, { params }: Ctx) {
  const email = await getSessionEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const existing = await getNutritionLog(id)
  if (!existing) return NextResponse.json({ error: "Log not found" }, { status: 404 })
  if (existing.clientEmail !== email.toLowerCase()) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  let body: Partial<NutritionLogRecord>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 })
  }
  const updates: Partial<NutritionLogRecord> = {}
  if (body.calories != null) {
    const n = Number(body.calories)
    if (!Number.isFinite(n) || n < 0 || n > 5000) return NextResponse.json({ error: "`calories` out of range." }, { status: 400 })
    updates.calories = Math.round(n)
  }
  if (body.protein != null) {
    const n = Number(body.protein)
    if (!Number.isFinite(n) || n < 0 || n > 400) return NextResponse.json({ error: "`protein` out of range." }, { status: 400 })
    updates.protein = Math.round(n)
  }
  if (body.carbs != null) {
    const n = Number(body.carbs)
    if (!Number.isFinite(n) || n < 0 || n > 800) return NextResponse.json({ error: "`carbs` out of range." }, { status: 400 })
    updates.carbs = Math.round(n)
  }
  if (body.fat != null) {
    const n = Number(body.fat)
    if (!Number.isFinite(n) || n < 0 || n > 300) return NextResponse.json({ error: "`fat` out of range." }, { status: 400 })
    updates.fat = Math.round(n)
  }
  if (typeof body.description === "string") updates.description = body.description.trim().slice(0, 500)
  if (body.mealType && ["breakfast", "lunch", "dinner", "snack"].includes(body.mealType)) updates.mealType = body.mealType

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: true, log: existing })
  }
  updates.updatedAt = new Date().toISOString()
  try {
    await updateNutritionLog(id, updates)
    const updated = await getNutritionLog(id)
    return NextResponse.json({ ok: true, log: updated })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown DynamoDB error"
    return NextResponse.json({ error: `Update log failed: ${message}` }, { status: 500 })
  }
}

// DELETE — client removes their own log entry (unauthenticated/other-client calls refused).
export async function DELETE(_req: Request, { params }: Ctx) {
  const email = await getSessionEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const existing = await getNutritionLog(id)
  if (!existing) return NextResponse.json({ error: "Log not found" }, { status: 404 })
  if (existing.clientEmail !== email.toLowerCase()) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  try {
    await deleteNutritionLog(id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown DynamoDB error"
    return NextResponse.json({ error: `Delete log failed: ${message}` }, { status: 500 })
  }
}
