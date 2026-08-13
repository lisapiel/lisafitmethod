import { NextRequest, NextResponse } from "next/server"
import { CognitoIdentityProviderClient, GetUserCommand } from "@aws-sdk/client-cognito-identity-provider"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb"
import { isAdminEmail } from "@/lib/authTokens"

export const dynamic = "force-dynamic"

const TABLE = process.env.DYNAMODB_TABLE ?? "lfm-user-progress"

function makeDb() {
  return DynamoDBDocumentClient.from(new DynamoDBClient({
    region: process.env.COGNITO_REGION ?? "us-east-2",
    credentials: {
      accessKeyId: process.env.COGNITO_AWS_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.COGNITO_AWS_SECRET_ACCESS_KEY ?? "",
    },
  }))
}

function makeCognito() {
  return new CognitoIdentityProviderClient({
    region: process.env.COGNITO_REGION ?? "us-east-2",
    credentials: {
      accessKeyId: process.env.COGNITO_AWS_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.COGNITO_AWS_SECRET_ACCESS_KEY ?? "",
    },
  })
}

async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const auth = req.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) return false
  try {
    const cognito = makeCognito()
    const result = await cognito.send(new GetUserCommand({ AccessToken: auth.slice(7) }))
    const callerEmail = result.UserAttributes?.find((a) => a.Name === "email")?.Value
    return callerEmail != null && isAdminEmail(callerEmail)
  } catch {
    return false
  }
}

// GET /api/admin/coaching/restart-requests
// Returns all coaching restart requests from former clients, newest first.
export async function GET(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const result = await makeDb().send(new ScanCommand({
    TableName: TABLE,
    FilterExpression: "begins_with(userId, :prefix)",
    ExpressionAttributeValues: { ":prefix": "coaching_restart_" },
  }))

  type RestartItem = {
    id: string
    email: string
    displayName: string
    submittedAt: string
    helpWith: string
    changedSince: string | null
    timeline: string
    previousPriceInCents: number | null
    previousCommitmentType: string | null
    previousSubscriptionStartDate: string | null
    previousCancellationDate: string | null
    previousCancellationReason: string | null
  }

  const requests: RestartItem[] = (result.Items ?? [])
    .map((item) => ({
      id: String(item.userId).replace("coaching_restart_", ""),
      email: String(item.email),
      displayName: String(item.displayName),
      submittedAt: String(item.submittedAt),
      helpWith: String(item.helpWith),
      changedSince: item.changedSince != null ? String(item.changedSince) : null,
      timeline: String(item.timeline),
      previousPriceInCents: item.previousPriceInCents != null ? Number(item.previousPriceInCents) : null,
      previousCommitmentType: item.previousCommitmentType != null ? String(item.previousCommitmentType) : null,
      previousSubscriptionStartDate: item.previousSubscriptionStartDate != null ? String(item.previousSubscriptionStartDate) : null,
      previousCancellationDate: item.previousCancellationDate != null ? String(item.previousCancellationDate) : null,
      previousCancellationReason: item.previousCancellationReason != null ? String(item.previousCancellationReason) : null,
    }))
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))

  return NextResponse.json({ requests })
}
