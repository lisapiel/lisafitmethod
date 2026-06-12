import { NextRequest, NextResponse } from "next/server"
import { verifyAdminRequest } from "@/lib/adminAuth"
import { updateGoalRecord } from "@/lib/authTokens"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb"

export const dynamic = "force-dynamic"

const TABLE = "lfm-user-progress"
function makeDb() {
  return DynamoDBDocumentClient.from(new DynamoDBClient({
    region: process.env.COGNITO_REGION ?? "us-east-2",
    credentials: {
      accessKeyId: process.env.COGNITO_AWS_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.COGNITO_AWS_SECRET_ACCESS_KEY ?? "",
    },
  }))
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { id } = await params
  const updates = await req.json()
  // Coerce numeric fields
  for (const k of ["startValue", "targetValue", "currentValue"]) {
    if (updates[k] != null && updates[k] !== "") updates[k] = Number(updates[k])
    else if (updates[k] === "") delete updates[k]
  }
  await updateGoalRecord(id, updates)
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { id } = await params
  const db = makeDb()
  await db.send(new DeleteCommand({
    TableName: TABLE,
    Key: { userId: `coaching_goal_${id}` },
  }))
  return NextResponse.json({ ok: true })
}
