import { NextRequest, NextResponse } from "next/server"
import { CognitoIdentityProviderClient, GetUserCommand } from "@aws-sdk/client-cognito-identity-provider"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb"
import { CourseProgress } from "@/lib/courseProgress"

export const dynamic = "force-dynamic"

const TABLE = "lfm-user-progress"

function makeDynamo() {
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

async function getUserSub(accessToken: string): Promise<string | null> {
  try {
    const cognito = new CognitoIdentityProviderClient({
      region: process.env.COGNITO_REGION ?? "us-east-2",
      credentials: {
        accessKeyId: process.env.COGNITO_AWS_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.COGNITO_AWS_SECRET_ACCESS_KEY ?? "",
      },
    })
    const result = await cognito.send(new GetUserCommand({ AccessToken: accessToken }))
    return result.UserAttributes?.find((a) => a.Name === "sub")?.Value ?? null
  } catch {
    return null
  }
}

function getToken(req: NextRequest): string | null {
  const auth = req.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) return null
  return auth.slice(7)
}

export async function GET(req: NextRequest) {
  const token = getToken(req)
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const sub = await getUserSub(token)
  if (!sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const db = makeDynamo()
    const result = await db.send(new GetCommand({ TableName: TABLE, Key: { userId: sub } }))
    if (!result.Item) return NextResponse.json({ progress: null })
    return NextResponse.json({ progress: result.Item.progress as CourseProgress })
  } catch (err) {
    console.error("DynamoDB GET error:", err)
    return NextResponse.json({ error: "Failed to load progress" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const token = getToken(req)
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const sub = await getUserSub(token)
  if (!sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { progress } = await req.json() as { progress: CourseProgress }
    if (!progress) return NextResponse.json({ error: "Missing progress" }, { status: 400 })

    const db = makeDynamo()
    await db.send(new PutCommand({
      TableName: TABLE,
      Item: { userId: sub, progress, updatedAt: new Date().toISOString() },
    }))
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("DynamoDB PUT error:", err)
    return NextResponse.json({ error: "Failed to save progress" }, { status: 500 })
  }
}
