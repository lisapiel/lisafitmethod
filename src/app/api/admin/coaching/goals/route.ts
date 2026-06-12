import { NextRequest, NextResponse } from "next/server"
import { verifyAdminRequest } from "@/lib/adminAuth"
import { listGoalRecords, createGoalRecord } from "@/lib/authTokens"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const url = new URL(req.url)
  const clientEmail = url.searchParams.get("clientEmail") ?? undefined
  const goals = await listGoalRecords(clientEmail)
  return NextResponse.json({ goals })
}

export async function POST(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const data = await req.json()
  if (!data.clientEmail || !data.type) {
    return NextResponse.json({ error: "clientEmail and type required" }, { status: 400 })
  }
  const goal = await createGoalRecord({
    clientEmail: String(data.clientEmail).toLowerCase(),
    type: data.type,
    label: data.label,
    startDate: data.startDate ?? new Date().toISOString().slice(0, 10),
    targetDate: data.targetDate,
    startValue: data.startValue != null ? Number(data.startValue) : undefined,
    targetValue: data.targetValue != null ? Number(data.targetValue) : undefined,
    currentValue: data.currentValue != null ? Number(data.currentValue) : undefined,
    unit: data.unit,
    notes: data.notes,
    status: data.status ?? "ON_TRACK",
  })
  return NextResponse.json({ goal })
}
