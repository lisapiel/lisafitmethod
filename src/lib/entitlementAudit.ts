import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, GetCommand, PutCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb"
import type { CourseEntitlement } from "@/lib/refundPolicy"

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

const accessKey = (e: CourseEntitlement, email: string) => `${e}_access_${email.trim().toLowerCase()}`

export type AccessRecord = { grantedAt?: string; grantType?: string } | null

export async function readAccessRecord(email: string, e: CourseEntitlement): Promise<AccessRecord> {
  try {
    const db = makeDb()
    const r = await db.send(new GetCommand({ TableName: TABLE, Key: { userId: accessKey(e, email) } }))
    if (!r.Item) return null
    return { grantedAt: r.Item.grantedAt as string | undefined, grantType: r.Item.grantType as string | undefined }
  } catch {
    return null
  }
}

// Removing access is the one destructive act in this flow, so the record of
// what was removed — and why — is written before the removal and kept
// permanently. Restoring someone by hand only needs this row.
export async function revokeEntitlement(input: {
  email: string
  entitlement: CourseEntitlement
  reason: string
  stripeId: string
  previous: AccessRecord
}): Promise<void> {
  const db = makeDb()
  const now = new Date().toISOString()
  await db.send(new PutCommand({
    TableName: TABLE,
    Item: {
      userId: `entitlement_audit_${input.stripeId}_${input.entitlement}`,
      email: input.email.toLowerCase(),
      entitlement: input.entitlement,
      action: "revoked",
      reason: input.reason,
      stripeId: input.stripeId,
      revokedAt: now,
      previousGrantedAt: input.previous?.grantedAt ?? null,
      previousGrantType: input.previous?.grantType ?? null,
    },
  }))
  await db.send(new DeleteCommand({ TableName: TABLE, Key: { userId: accessKey(input.entitlement, input.email) } }))
}

// Stripe delivers the same event more than once, and retries anything that
// does not return 2xx. Processing is recorded under the Stripe object's own
// id so a redelivery is a no-op rather than a second revocation.
export async function alreadyHandled(stripeId: string): Promise<boolean> {
  try {
    const db = makeDb()
    const r = await db.send(new GetCommand({ TableName: TABLE, Key: { userId: `refund_handled_${stripeId}` } }))
    return !!r.Item
  } catch {
    return false
  }
}

export async function markHandled(stripeId: string, detail: Record<string, unknown>): Promise<void> {
  try {
    const db = makeDb()
    await db.send(new PutCommand({
      TableName: TABLE,
      Item: { userId: `refund_handled_${stripeId}`, handledAt: new Date().toISOString(), ...detail },
    }))
  } catch {
    // Non-fatal: at worst the decision is recomputed, and it is the same decision.
  }
}
