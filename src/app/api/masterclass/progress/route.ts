import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { fetchAuthSession } from "aws-amplify/auth/server"
import { runWithAmplifyServerContext } from "@/lib/amplify-server"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb"

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

export async function GET() {
  const sessionEmail = await runWithAmplifyServerContext({
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

  if (!sessionEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const db = makeDb()
  const prefix = `masterclass_completion_${sessionEmail.toLowerCase()}_`
  const completions: { key: string; blockId: string; dayLabel: string; completedAt: string }[] = []

  let lastKey: Record<string, unknown> | undefined
  do {
    const result = await db.send(
      new ScanCommand({
        TableName: TABLE,
        FilterExpression: "begins_with(userId, :prefix)",
        ExpressionAttributeValues: { ":prefix": prefix },
        ExclusiveStartKey: lastKey,
      })
    )
    for (const item of result.Items ?? []) {
      completions.push({
        key: item.userId as string,
        blockId: item.blockId as string,
        dayLabel: item.dayLabel as string,
        completedAt: item.completedAt as string,
      })
    }
    lastKey = result.LastEvaluatedKey as Record<string, unknown> | undefined
  } while (lastKey)

  return NextResponse.json({ completions })
}
