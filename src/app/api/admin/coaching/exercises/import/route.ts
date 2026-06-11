import { NextRequest, NextResponse } from "next/server"
import { verifyAdminRequest } from "@/lib/adminAuth"
import { createExerciseRecord, listExerciseRecords } from "@/lib/authTokens"

export const dynamic = "force-dynamic"

type IncomingExercise = {
  name: string
  videoS3Key: string
  thumbnailS3Key?: string
  primaryMuscle?: string
  equipment?: string
  category?: string
}

export async function POST(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { exercises } = (await req.json()) as { exercises: IncomingExercise[] }
  if (!Array.isArray(exercises) || exercises.length === 0) {
    return NextResponse.json({ error: "exercises array required" }, { status: 400 })
  }

  const existing = await listExerciseRecords()
  const existingNames = new Set(existing.map((e) => e.name.toLowerCase()))

  let created = 0
  let skipped = 0
  for (const ex of exercises) {
    if (!ex.name) { skipped++; continue }
    if (existingNames.has(ex.name.toLowerCase())) { skipped++; continue }
    await createExerciseRecord({
      name: ex.name,
      videoS3Key: ex.videoS3Key,
      thumbnailS3Key: ex.thumbnailS3Key,
      primaryMuscle: ex.primaryMuscle,
      equipment: ex.equipment,
      category: ex.category,
      status: "ACTIVE",
    })
    created++
  }

  return NextResponse.json({ created, skipped, total: exercises.length })
}
