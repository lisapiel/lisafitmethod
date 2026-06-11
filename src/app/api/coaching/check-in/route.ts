import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { fetchAuthSession } from "aws-amplify/auth/server"
import { runWithAmplifyServerContext } from "@/lib/amplify-server"
import { createCoachingCheckIn, listCoachingCheckIns } from "@/lib/authTokens"

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

  const checkIns = await listCoachingCheckIns(email)
  return NextResponse.json({ checkIns })
}

export async function POST(req: NextRequest) {
  const email = await getSessionEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()

  const checkIn = await createCoachingCheckIn({
    clientEmail: email.toLowerCase(),
    submittedAt: new Date().toISOString(),
    status: "PENDING",
    ...(body.weight != null && { weight: parseFloat(body.weight) }),
    ...(body.weightUnit && { weightUnit: body.weightUnit }),
    ...(body.sleepQuality && { sleepQuality: body.sleepQuality }),
    ...(body.energyLevel && { energyLevel: body.energyLevel }),
    ...(body.hungerLevel && { hungerLevel: body.hungerLevel }),
    ...(body.stressLevel && { stressLevel: body.stressLevel }),
    ...(body.digestion && { digestion: body.digestion }),
    ...(body.trainingPerformance && { trainingPerformance: body.trainingPerformance }),
    ...(body.nutritionAdherence && { nutritionAdherence: body.nutritionAdherence }),
    ...(body.workoutConsistency && { workoutConsistency: body.workoutConsistency }),
    ...(body.wins && { wins: body.wins }),
    ...(body.struggles && { struggles: body.struggles }),
    ...(body.questionsForCoach && { questionsForCoach: body.questionsForCoach }),
    ...(body.additionalNotes && { additionalNotes: body.additionalNotes }),
  })

  return NextResponse.json({ checkIn })
}
