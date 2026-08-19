import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { fetchAuthSession } from "aws-amplify/auth/server"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb"
import { runWithAmplifyServerContext } from "@/lib/amplify-server"
import {
  hasTrainingAccess, hasNutritionAccess, hasTrackerAccess, hasCoachingAccess, hasMasterclassAccess,
  isAdminEmail, ownsCoachingRaw,
} from "@/lib/authTokens"
import {
  COURSE_PRICE_CENTS, COURSE_PRICE_DISPLAY,
  NUTRITION_COURSE_PRICE_CENTS, NUTRITION_COURSE_PRICE_DISPLAY,
  TRACKER_PRICE_CENTS, TRACKER_PRICE_DISPLAY,
  COACHING_CLIENT_TRAINING_CENTS, COACHING_CLIENT_TRAINING_DISPLAY,
  COACHING_CLIENT_NUTRITION_CENTS, COACHING_CLIENT_NUTRITION_DISPLAY,
  COACHING_CLIENT_TRACKER_CENTS, COACHING_CLIENT_TRACKER_DISPLAY,
} from "@/lib/pricing"

export const dynamic = "force-dynamic"

const TABLE = process.env.DYNAMODB_TABLE ?? "lfm-user-progress"

// Raw entitlement readers — bypass the admin auto-grant that the shared
// has*Access() helpers use for backend authorization. The drawer's
// My Products display needs the customer's ACTUAL entitlement state, not
// their admin capability, so an admin who hasn't purchased Training
// Foundations shows Training as "Available to add" rather than "Active".
function makeDb() {
  return DynamoDBDocumentClient.from(
    new DynamoDBClient({
      region: process.env.COGNITO_REGION ?? "us-east-2",
      credentials: {
        accessKeyId: process.env.COGNITO_AWS_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.COGNITO_AWS_SECRET_ACCESS_KEY ?? "",
      },
    })
  )
}

async function ownsRecord(prefix: string, email: string): Promise<boolean> {
  try {
    const db = makeDb()
    const result = await db.send(
      new GetCommand({ TableName: TABLE, Key: { userId: `${prefix}_${email.toLowerCase()}` } })
    )
    return !!result.Item
  } catch {
    return false
  }
}

export async function GET() {
  const email = await runWithAmplifyServerContext({
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

  if (!email) {
    return NextResponse.json({
      email: null,
      training: false, nutrition: false, tracker: false, coaching: false, masterclass: false,
      owns: { training: false, nutrition: false, tracker: false, coaching: false, masterclass: false },
      offers: {
        coachingClient: {
          eligible: false,
          training: null, nutrition: null, tracker: null,
        },
      },
      isAdmin: false,
    })
  }

  // Both projections computed in parallel:
  //  - Top-level booleans: kept as-is for backward compat with every other
  //    /api/member/access consumer. These still include the admin bypass so
  //    server-side gates that legitimately want admins to have access keep
  //    working exactly as before.
  //  - owns.*: raw customer entitlement, no admin bypass. Used by the
  //    hamburger drawer to render true ownership vs. available-to-add.
  //  - offers.coachingClient: the same raw check drives client-price
  //    eligibility so the drawer + sales pages can render preferred pricing
  //    without duplicating logic. Pricing is authoritative on the server
  //    (Stripe PaymentIntent routes re-check ownsCoachingRaw) — this payload
  //    is display metadata only.
  const [training, nutrition, tracker, coaching, masterclass, ownsTraining, ownsNutrition, ownsTracker, ownsCoachingReal, ownsMasterclass] = await Promise.all([
    hasTrainingAccess(email),
    hasNutritionAccess(email),
    hasTrackerAccess(email),
    hasCoachingAccess(email),
    hasMasterclassAccess(email),
    ownsRecord("training_access", email),
    ownsRecord("nutrition_access", email),
    ownsRecord("tracker_access", email),
    ownsCoachingRaw(email),
    ownsRecord("masterclass_access", email),
  ])

  const coachingClientEligible = ownsCoachingReal
  const productOffer = (
    regularCents: number, regularDisplay: string,
    clientCents: number, clientDisplay: string,
  ) => coachingClientEligible ? {
    regularCents, regularDisplay,
    clientCents, clientDisplay,
  } : null

  return NextResponse.json({
    email,
    training, nutrition, tracker, coaching, masterclass,
    owns: {
      training: ownsTraining,
      nutrition: ownsNutrition,
      tracker: ownsTracker,
      coaching: ownsCoachingReal,
      masterclass: ownsMasterclass,
    },
    offers: {
      coachingClient: {
        eligible: coachingClientEligible,
        training: productOffer(COURSE_PRICE_CENTS, COURSE_PRICE_DISPLAY, COACHING_CLIENT_TRAINING_CENTS, COACHING_CLIENT_TRAINING_DISPLAY),
        nutrition: productOffer(NUTRITION_COURSE_PRICE_CENTS, NUTRITION_COURSE_PRICE_DISPLAY, COACHING_CLIENT_NUTRITION_CENTS, COACHING_CLIENT_NUTRITION_DISPLAY),
        tracker: productOffer(TRACKER_PRICE_CENTS, TRACKER_PRICE_DISPLAY, COACHING_CLIENT_TRACKER_CENTS, COACHING_CLIENT_TRACKER_DISPLAY),
      },
    },
    isAdmin: isAdminEmail(email),
  })
}
