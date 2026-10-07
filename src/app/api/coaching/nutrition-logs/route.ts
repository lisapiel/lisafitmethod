import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { fetchAuthSession } from "aws-amplify/auth/server"
import { runWithAmplifyServerContext } from "@/lib/amplify-server"
import {
  createNutritionLog,
  listNutritionLogsForClient,
  getCoachingClientRecord,
  type NutritionLogRecord,
} from "@/lib/authTokens"
import { resolveMacrosFor } from "@/lib/nutrition"
import { isLocalDateKey } from "@/lib/localDate"

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

// GET /api/coaching/nutrition-logs?from=YYYY-MM-DD&to=YYYY-MM-DD
// Returns the authed client's own logs. Date filter is optional.
export async function GET(req: Request) {
  const email = await getSessionEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const url = new URL(req.url)
  const from = url.searchParams.get("from") ?? undefined
  const to = url.searchParams.get("to") ?? undefined
  if (from && !isLocalDateKey(from)) return NextResponse.json({ error: "Invalid from" }, { status: 400 })
  if (to && !isLocalDateKey(to)) return NextResponse.json({ error: "Invalid to" }, { status: 400 })
  const logs = await listNutritionLogsForClient(email, { fromDate: from, toDate: to })
  return NextResponse.json({ logs })
}

// POST — create a new nutrition log for the authed client.
// Body: { date (YYYY-MM-DD, client-local), timeZone?, kind: "quick"|"meal", mealType?, description?, calories, protein, carbs?, fat? }
// Server trusts the client's `date` and `timeZone`. Server does NOT re-derive
// the day from a server clock — late-night logs from clients in other zones
// must land on their own local day.
export async function POST(req: Request) {
  const email = await getSessionEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: Partial<NutritionLogRecord>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 })
  }

  if (!isLocalDateKey(body.date ?? "")) {
    return NextResponse.json({ error: "`date` must be YYYY-MM-DD in the client's local time zone." }, { status: 400 })
  }
  const kind = body.kind === "quick" || body.kind === "meal" ? body.kind : null
  if (!kind) return NextResponse.json({ error: "`kind` must be `quick` or `meal`." }, { status: 400 })
  if (kind === "meal" && !["breakfast", "lunch", "dinner", "snack"].includes(body.mealType ?? "")) {
    return NextResponse.json({ error: "`mealType` is required for meal entries." }, { status: 400 })
  }
  const calories = Number(body.calories)
  const protein = Number(body.protein)
  if (!Number.isFinite(calories) || calories < 0 || calories > 5000) {
    return NextResponse.json({ error: "`calories` must be between 0 and 5000." }, { status: 400 })
  }
  if (!Number.isFinite(protein) || protein < 0 || protein > 400) {
    return NextResponse.json({ error: "`protein` must be between 0 and 400." }, { status: 400 })
  }
  const carbs = body.carbs == null || body.carbs === 0 ? undefined : Number(body.carbs)
  const fat = body.fat == null || body.fat === 0 ? undefined : Number(body.fat)
  if (carbs != null && (!Number.isFinite(carbs) || carbs < 0 || carbs > 800)) {
    return NextResponse.json({ error: "`carbs` must be between 0 and 800." }, { status: 400 })
  }
  if (fat != null && (!Number.isFinite(fat) || fat < 0 || fat > 300)) {
    return NextResponse.json({ error: "`fat` must be between 0 and 300." }, { status: 400 })
  }

  // Snapshot the active coach target at the time of logging. If body data is
  // incomplete and auto target can't be computed, we simply omit the snapshot.
  const client = await getCoachingClientRecord(email)
  const resolved = client ? resolveMacrosFor(client) : null
  const targetAtLog = resolved
    ? { calories: resolved.calories, protein: resolved.protein, carbs: resolved.carbs, fat: resolved.fat }
    : undefined

  const description = typeof body.description === "string" && body.description.trim().length > 0
    ? body.description.trim().slice(0, 500)
    : undefined

  try {
    const record = await createNutritionLog({
      clientEmail: email,
      date: body.date!,
      timeZone: typeof body.timeZone === "string" ? body.timeZone.slice(0, 80) : undefined,
      kind,
      mealType: kind === "meal" ? (body.mealType as NutritionLogRecord["mealType"]) : undefined,
      description,
      calories: Math.round(calories),
      protein: Math.round(protein),
      carbs: carbs != null ? Math.round(carbs) : undefined,
      fat: fat != null ? Math.round(fat) : undefined,
      targetAtLog,
    })
    return NextResponse.json({ ok: true, log: record })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown DynamoDB error"
    return NextResponse.json({ error: `Create log failed: ${message}` }, { status: 500 })
  }
}
