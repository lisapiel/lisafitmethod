import { NextRequest, NextResponse } from "next/server"
import { CognitoIdentityProviderClient, GetUserCommand } from "@aws-sdk/client-cognito-identity-provider"
import { getCoachingClientRecord, updateCoachingClientRecord } from "@/lib/authTokens"

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

// POST /api/coaching/setup — client saves their body data + nutrition goal.
// Only the authenticated coaching client can update their own record.
export async function POST(req: NextRequest) {
  const email = await getCallerEmail(req)
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json() as {
    heightInches?: number
    age?: number
    sex?: "male" | "female"
    activityLevel?: number
    nutritionGoal?: "fat-loss" | "maintain" | "muscle-gain"
    currentWeight?: number
  }

  // Validate basics
  const height = Number(body.heightInches)
  const age = Number(body.age)
  const activity = Number(body.activityLevel)
  if (!height || height < 48 || height > 96) {
    return NextResponse.json({ error: "Height must be between 4' and 8' (48–96 inches)" }, { status: 400 })
  }
  if (!age || age < 16 || age > 100) {
    return NextResponse.json({ error: "Age must be 16–100" }, { status: 400 })
  }
  if (body.sex !== "male" && body.sex !== "female") {
    return NextResponse.json({ error: "Sex must be male or female (for BMR formula)" }, { status: 400 })
  }
  if (!activity || activity < 1.2 || activity > 1.9) {
    return NextResponse.json({ error: "Activity level required" }, { status: 400 })
  }
  const goal = body.nutritionGoal
  if (goal !== "fat-loss" && goal !== "maintain" && goal !== "muscle-gain") {
    return NextResponse.json({ error: "Nutrition goal required" }, { status: 400 })
  }

  const existing = await getCoachingClientRecord(email)
  const updates: Parameters<typeof updateCoachingClientRecord>[1] = {
    heightInches: height,
    age,
    sex: body.sex,
    activityLevel: activity,
    nutritionGoal: goal,
  }
  // Seed startingWeight if we haven't captured it yet and they provided a current weight
  const currentWeight = Number(body.currentWeight)
  if (!existing?.startingWeight && currentWeight && currentWeight >= 80 && currentWeight <= 500) {
    updates.startingWeight = currentWeight
  }

  await updateCoachingClientRecord(email, updates)
  return NextResponse.json({ ok: true })
}
