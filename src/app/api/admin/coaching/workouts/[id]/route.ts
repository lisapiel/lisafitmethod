import { NextRequest, NextResponse } from "next/server"
import { verifyAdminRequest } from "@/lib/adminAuth"
import { getWorkoutTemplate, updateWorkoutTemplate, deleteWorkoutTemplate } from "@/lib/authTokens"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { id } = await params
  const workout = await getWorkoutTemplate(id)
  if (!workout) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ workout })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { id } = await params
  const updates = await req.json()
  if (updates.exercises && typeof updates.exercises !== "string") {
    updates.exercises = JSON.stringify(updates.exercises)
  }
  await updateWorkoutTemplate(id, updates)
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { id } = await params
  await deleteWorkoutTemplate(id)
  return NextResponse.json({ ok: true })
}
