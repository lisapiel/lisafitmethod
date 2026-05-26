import { randomBytes } from "crypto"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb"

const TABLE = "lfm-user-progress"

export interface AuthToken {
  email: string
  type: "setup" | "reset"
  expiresAt: string
  used: boolean
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

export function generateAuthToken(): string {
  return randomBytes(32).toString("hex")
}

export async function storeAuthToken(
  token: string,
  email: string,
  type: "setup" | "reset"
): Promise<void> {
  const db = makeDb()
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
  await db.send(
    new PutCommand({
      TableName: TABLE,
      Item: { userId: `setpw_token__${token}`, email, type, expiresAt, used: false },
    })
  )
}

export async function getAuthToken(token: string): Promise<AuthToken | null> {
  try {
    const db = makeDb()
    const result = await db.send(
      new GetCommand({ TableName: TABLE, Key: { userId: `setpw_token__${token}` } })
    )
    if (!result.Item) return null
    return result.Item as AuthToken
  } catch {
    return null
  }
}

export async function markAuthTokenUsed(token: string): Promise<void> {
  const db = makeDb()
  await db.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { userId: `setpw_token__${token}` },
      UpdateExpression: "SET #used = :true",
      ExpressionAttributeNames: { "#used": "used" },
      ExpressionAttributeValues: { ":true": true },
    })
  )
}

export async function grantTrackerAccess(email: string): Promise<void> {
  const db = makeDb()
  await db.send(
    new PutCommand({
      TableName: TABLE,
      Item: { userId: `tracker_access_${email.toLowerCase()}`, grantedAt: new Date().toISOString() },
    })
  )
}

export async function hasTrackerAccess(email: string): Promise<boolean> {
  try {
    const db = makeDb()
    const result = await db.send(
      new GetCommand({ TableName: TABLE, Key: { userId: `tracker_access_${email.toLowerCase()}` } })
    )
    return !!result.Item
  } catch {
    return false
  }
}
