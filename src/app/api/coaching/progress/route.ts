import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { fetchAuthSession } from "aws-amplify/auth/server"
import { runWithAmplifyServerContext } from "@/lib/amplify-server"
import { listSnapshotRecords, createSnapshotRecord } from "@/lib/authTokens"

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

export async function GET() {
  const email = await getSessionEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const snapshots = await listSnapshotRecords(email)
  return NextResponse.json({ snapshots })
}

export async function POST(req: NextRequest) {
  const email = await getSessionEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const data = await req.json()
  const snapshot = await createSnapshotRecord({
    clientEmail: email.toLowerCase(),
    snapshotDate: data.snapshotDate ?? new Date().toISOString(),
    weight: data.weight,
    weightUnit: data.weightUnit,
    waist: data.waist,
    hips: data.hips,
    glutes: data.glutes,
    chest: data.chest,
    arm: data.arm,
    thigh: data.thigh,
    customMeasurements: data.customMeasurements,
    photoS3Keys: data.photoS3Keys,
    notes: data.notes,
  })
  return NextResponse.json({ snapshot })
}
