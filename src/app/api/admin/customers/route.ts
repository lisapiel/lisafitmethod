import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { fetchAuthSession } from "aws-amplify/auth/server"
import { runWithAmplifyServerContext } from "@/lib/amplify-server"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb"

export const dynamic = "force-dynamic"

const ADMIN_EMAIL = "lisa.p.mcpherson@gmail.com"
const TABLE = "lfm-user-progress"

export interface CustomerRow {
  email: string
  product: "training" | "nutrition" | "tracker"
  grantedAt: string
}

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

  if (email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const db = makeDb()
  const customers: CustomerRow[] = []

  const prefixes: Array<{ prefix: string; product: CustomerRow["product"] }> = [
    { prefix: "training_access_", product: "training" },
    { prefix: "nutrition_access_", product: "nutrition" },
    { prefix: "tracker_access_", product: "tracker" },
  ]

  for (const { prefix, product } of prefixes) {
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
        const userId = item.userId as string
        const rowEmail = userId.replace(prefix, "")
        if (rowEmail === ADMIN_EMAIL) continue
        customers.push({
          email: rowEmail,
          product,
          grantedAt: (item.grantedAt as string | undefined) ?? "",
        })
      }
      lastKey = result.LastEvaluatedKey as Record<string, unknown> | undefined
    } while (lastKey)
  }

  customers.sort((a, b) => b.grantedAt.localeCompare(a.grantedAt))

  return NextResponse.json({ customers })
}
