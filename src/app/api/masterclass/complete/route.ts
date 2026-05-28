import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { fetchAuthSession } from "aws-amplify/auth/server"
import { runWithAmplifyServerContext } from "@/lib/amplify-server"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb"

export const dynamic = "force-dynamic"

const TABLE = "lfm-user-progress"

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

export async function POST(request: NextRequest) {
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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { blockId, dayLabel } = await request.json() as { blockId?: string; dayLabel?: string }
  if (!blockId || !dayLabel) {
    return NextResponse.json({ error: "blockId and dayLabel are required" }, { status: 400 })
  }

  const db = makeDb()
  await db.send(
    new PutCommand({
      TableName: TABLE,
      Item: {
        userId: `masterclass_completion_${email.toLowerCase()}_${blockId}_${dayLabel}`,
        email: email.toLowerCase(),
        blockId,
        dayLabel,
        completedAt: new Date().toISOString(),
      },
    })
  )

  return NextResponse.json({ ok: true })
}
