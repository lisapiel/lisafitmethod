import { NextRequest, NextResponse } from "next/server"
import { CognitoIdentityProviderClient, GetUserCommand } from "@aws-sdk/client-cognito-identity-provider"
import { getCoachingClientRecord, listCoachingApplications, updateCoachingClientRecord } from "@/lib/authTokens"
import { pickApplicationFor } from "@/lib/intake"
import { goalFromApplication, hasCompletedProfile, planSetupProfile } from "@/lib/profileRequests"

export const dynamic = "force-dynamic"

function makeCognito() {
  return new CognitoIdentityProviderClient({
    region: process.env.COGNITO_REGION ?? "us-east-2",
    credentials: {
      accessKeyId: process.env.COGNITO_AWS_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.COGNITO_AWS_SECRET_ACCESS_KEY ?? "",
    },
  })
}

async function getCallerEmail(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) return null
  try {
    const cognito = makeCognito()
    const result = await cognito.send(new GetUserCommand({ AccessToken: auth.slice(7) }))
    return result.UserAttributes?.find((a) => a.Name === "email")?.Value ?? null
  } catch {
    return null
  }
}

// GET /api/coaching/setup: the nutrition goal to preselect for a client who
// hasn't chosen one yet, taken from their application when it maps clearly.
// Only the mapped goal is returned, never the application itself.
export async function GET(req: NextRequest) {
  const email = await getCallerEmail(req)
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const client = await getCoachingClientRecord(email)
  if (hasCompletedProfile(client) || client?.nutritionGoal) {
    return NextResponse.json({ suggestedGoal: null })
  }
  const app = pickApplicationFor(await listCoachingApplications().catch(() => []), email)
  return NextResponse.json({ suggestedGoal: goalFromApplication(app?.primaryGoal) })
}

// POST /api/coaching/setup — client saves their body data + nutrition goal.
// Only the authenticated coaching client can update their own record.
export async function POST(req: NextRequest) {
  const email = await getCallerEmail(req)
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json() as {
    heightInches?: number
    age?: number
    sex?: "male" | "female"
    activityLevel?: unknown
    nutritionGoal?: unknown
    currentWeight?: number
  }

  // Validate basics
  const height = Number(body.heightInches)
  const age = Number(body.age)
  if (!height || height < 48 || height > 96) {
    return NextResponse.json({ error: "Height must be between 4' and 8' (48–96 inches)" }, { status: 400 })
  }
  if (!age || age < 16 || age > 100) {
    return NextResponse.json({ error: "Age must be 16–100" }, { status: 400 })
  }
  if (body.sex !== "male" && body.sex !== "female") {
    return NextResponse.json({ error: "Sex must be male or female (for BMR formula)" }, { status: 400 })
  }

  // Goal and activity are chosen once here. After that they change only when
  // Lisa approves a request, so this path can't be used to get round the review.
  const existing = await getCoachingClientRecord(email)
  const profile = planSetupProfile(existing, body)
  if (!profile.ok) return NextResponse.json({ error: profile.error }, { status: profile.status })
  const updates: Parameters<typeof updateCoachingClientRecord>[1] = {
    heightInches: height,
    age,
    sex: body.sex,
    ...profile.updates,
  }
  // The starting weight is saved once, the first time setup sends one. After
  // that only Lisa corrects it, so a different weight sent here is not saved
  // and the response says so, so the page never claims it saved one.
  const currentWeight = Number(body.currentWeight)
  const existingStart = existing?.startingWeight
  let startingWeightKept = false
  if (!existingStart && currentWeight && currentWeight >= 80 && currentWeight <= 500) {
    updates.startingWeight = currentWeight
  } else if (existingStart && body.currentWeight != null && currentWeight !== existingStart) {
    startingWeightKept = true
  }

  await updateCoachingClientRecord(email, updates)
  return NextResponse.json({ ok: true, startingWeight: updates.startingWeight ?? existingStart ?? null, startingWeightKept })
}
