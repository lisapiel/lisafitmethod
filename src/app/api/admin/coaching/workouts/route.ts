import { NextRequest, NextResponse } from "next/server"
import { verifyAdminRequest } from "@/lib/adminAuth"
import { listWorkoutTemplates, createWorkoutTemplate } from "@/lib/authTokens"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const workouts = await listWorkoutTemplates()
  return NextResponse.json({ workouts })
}

export async function POST(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const data = await req.json()
  if (!data.name || !data.exercises) {
    return NextResponse.json({ error: "name and exercises required" }, { status: 400 })
  }
  const workout = await createWorkoutTemplate({
    name: data.name,
    description: data.description,
    category: data.category,
    exercises: typeof data.exercises === "string" ? data.exercises : JSON.stringify(data.exercises),
  })
  return NextResponse.json({ workout })
}
