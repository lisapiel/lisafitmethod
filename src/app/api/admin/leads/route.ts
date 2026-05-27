import { NextRequest, NextResponse } from "next/server"
import { CognitoIdentityProviderClient, GetUserCommand } from "@aws-sdk/client-cognito-identity-provider"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, ScanCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb"

export const dynamic = "force-dynamic"

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
    const result = await db.send(new ScanCommand({ TableName: "lfm-leads" }))
    const leads = (result.Items ?? []).sort((a, b) =>
      (b.createdAt ?? "").localeCompare(a.createdAt ?? "")
    )
    return NextResponse.json({ leads })
  } catch (err) {
    console.error("DynamoDB leads scan error:", err)
    return NextResponse.json({ error: "Failed to load leads" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const token = getToken(req)
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const sub = await getUserSub(token)
  if (!sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await req.json() as { id: string }
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
    const db = makeDynamo()
    await db.send(new DeleteCommand({ TableName: "lfm-leads", Key: { id } }))
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("DynamoDB leads delete error:", err)
    return NextResponse.json({ error: "Failed to delete lead" }, { status: 500 })
  }
}
