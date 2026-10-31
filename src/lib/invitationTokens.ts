import { randomBytes } from "node:crypto"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb"

const TABLE = process.env.DYNAMODB_TABLE ?? "lfm-user-progress"

function makeDb() {
  return DynamoDBDocumentClient.from(
    new DynamoDBClient({
      region: process.env.COGNITO_REGION ?? "us-east-2",
      credentials: {
        accessKeyId: process.env.COGNITO_AWS_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.COGNITO_AWS_SECRET_ACCESS_KEY ?? "",
      },
    }),
  )
}

// Proof that someone opened the approval email.
//
// The invitation itself is the application record and never expires — an
// approved offer stays open until it is declined or paid. This is the separate,
// much shorter-lived thing that the link carries: a credential saying "whoever
// is holding this received the email we sent to the applicant".
//
// It is what lets a brand-new client choose a password without a second email,
// and what stops someone who merely learned an application id from claiming the
// invitation for their own account. So it is single-use, expiring, and bound to
// one application and one address.
const TOKEN_TTL_DAYS = 45

export type InvitationToken = {
  token: string
  applicationId: string
  email: string
  used: boolean
  usedAt?: string
  usedFor?: "password-setup" | "account-link"
  expiresAt: string
  createdAt: string
}

const key = (token: string) => `invite_token__${token}`

export function generateInvitationToken(): string {
  return randomBytes(32).toString("hex")
}

export async function storeInvitationToken(input: {
  token: string
  applicationId: string
  email: string
}): Promise<void> {
  const now = new Date()
  const record: InvitationToken = {
    token: input.token,
    applicationId: input.applicationId,
    email: input.email.trim().toLowerCase(),
    used: false,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString(),
  }
  const db = makeDb()
  await db.send(new PutCommand({ TableName: TABLE, Item: { userId: key(input.token), ...record } }))
}

export type TokenCheck =
  | { valid: true; token: InvitationToken }
  | { valid: false; reason: "missing" | "not_found" | "used" | "expired" | "mismatch" }

// Read-only. Tells a page what to offer without spending the token.
export async function checkInvitationToken(
  token: string | undefined | null,
  applicationId: string,
): Promise<TokenCheck> {
  if (!token) return { valid: false, reason: "missing" }
  try {
    const db = makeDb()
    const result = await db.send(new GetCommand({ TableName: TABLE, Key: { userId: key(token) } }))
    const item = result.Item as InvitationToken | undefined
    if (!item) return { valid: false, reason: "not_found" }
    if (item.applicationId !== applicationId) return { valid: false, reason: "mismatch" }
    if (item.used) return { valid: false, reason: "used" }
    if (new Date(item.expiresAt) < new Date()) return { valid: false, reason: "expired" }
    return { valid: true, token: item }
  } catch {
    return { valid: false, reason: "not_found" }
  }
}

// Spend it. The conditional write is the whole point: two requests racing to
// use the same token, one wins, and the loser is told it is spent rather than
// both being allowed through.
export async function consumeInvitationToken(
  token: string,
  applicationId: string,
  usedFor: NonNullable<InvitationToken["usedFor"]>,
): Promise<TokenCheck> {
  const pre = await checkInvitationToken(token, applicationId)
  if (!pre.valid) return pre
  try {
    const db = makeDb()
    await db.send(new UpdateCommand({
      TableName: TABLE,
      Key: { userId: key(token) },
      UpdateExpression: "SET #u = :true, usedAt = :now, usedFor = :for",
      ConditionExpression: "#u = :false",
      ExpressionAttributeNames: { "#u": "used" },
      ExpressionAttributeValues: { ":true": true, ":false": false, ":now": new Date().toISOString(), ":for": usedFor },
    }))
    return pre
  } catch {
    return { valid: false, reason: "used" }
  }
}
