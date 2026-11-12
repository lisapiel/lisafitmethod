import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DeleteCommand, DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb"
import { randomBytes } from "crypto"

const TABLE = process.env.DYNAMODB_TABLE ?? "lfm-user-progress"
const PREFIX = "stripe_event_"

// Longer than any webhook run can take, so a live run is never taken over,
// but short enough that a run that crashed mid-way is retried within minutes.
export const LEASE_MS = 5 * 60 * 1000

export interface LedgerDb {
  send(command: GetCommand | PutCommand | DeleteCommand): Promise<{ Item?: Record<string, unknown> }>
}

export type Claim =
  | { kind: "claimed"; eventId: string; token: string }
  | { kind: "duplicate"; eventId: string }
  | { kind: "busy"; eventId: string }

function makeDb(): LedgerDb {
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

function isConditionFailure(err: unknown): boolean {
  return err instanceof Error && err.name === "ConditionalCheckFailedException"
}

export function ledgerKey(eventId: string): string {
  return `${PREFIX}${eventId}`
}

// Holds only the event id, its type and processing state. Never any customer data.
export async function claimEvent(
  eventId: string,
  eventType: string,
  db: LedgerDb = makeDb(),
  now: number = Date.now()
): Promise<Claim> {
  const token = randomBytes(12).toString("hex")
  const fresh = {
    userId: ledgerKey(eventId),
    eventId,
    eventType,
    status: "processing",
    token,
    claimedAt: new Date(now).toISOString(),
    leaseUntil: now + LEASE_MS,
  }
  try {
    await db.send(new PutCommand({ TableName: TABLE, Item: fresh, ConditionExpression: "attribute_not_exists(userId)" }))
    return { kind: "claimed", eventId, token }
  } catch (err) {
    if (!isConditionFailure(err)) throw err
  }

  const existing = (await db.send(new GetCommand({ TableName: TABLE, Key: { userId: ledgerKey(eventId) } }))).Item
  if (!existing) return claimEvent(eventId, eventType, db, now)
  if (existing.status === "done") return { kind: "duplicate", eventId }
  if (typeof existing.leaseUntil === "number" && existing.leaseUntil > now) return { kind: "busy", eventId }

  // The previous run died without finishing. Take over only if nobody else has.
  try {
    await db.send(new PutCommand({
      TableName: TABLE,
      Item: fresh,
      ConditionExpression: "token = :old",
      ExpressionAttributeValues: { ":old": existing.token },
    }))
    return { kind: "claimed", eventId, token }
  } catch (err) {
    if (isConditionFailure(err)) return { kind: "busy", eventId }
    throw err
  }
}

export async function completeEvent(
  claim: Extract<Claim, { kind: "claimed" }>,
  eventType: string,
  db: LedgerDb = makeDb(),
  now: number = Date.now()
): Promise<void> {
  await db.send(new PutCommand({
    TableName: TABLE,
    Item: {
      userId: ledgerKey(claim.eventId),
      eventId: claim.eventId,
      eventType,
      status: "done",
      token: claim.token,
      processedAt: new Date(now).toISOString(),
    },
    ConditionExpression: "token = :token",
    ExpressionAttributeValues: { ":token": claim.token },
  }))
}

function errorText(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

// Stripe can deliver the same event more than once, and retries a delivery
// until it gets a 2xx. A repeat of a handled event is acknowledged without
// running again; an event whose handling failed is released so Stripe's next
// retry runs it in full.
export async function runEventOnce(
  event: { id: string; type: string },
  handle: () => Promise<Response>,
  db: LedgerDb = makeDb(),
  now: () => number = Date.now
): Promise<Response> {
  let claim: Claim
  try {
    claim = await claimEvent(event.id, event.type, db, now())
  } catch (err) {
    console.error(`[webhook] ledger unavailable for ${event.type} ${event.id}:`, errorText(err))
    return Response.json({ error: "Event ledger unavailable" }, { status: 503 })
  }
  if (claim.kind === "duplicate") return Response.json({ received: true, duplicate: true })
  if (claim.kind === "busy") return Response.json({ error: "Event is already being handled" }, { status: 409 })

  let response: Response
  try {
    response = await handle()
  } catch (err) {
    console.error(`[webhook] ${event.type} ${event.id} failed:`, errorText(err))
    response = Response.json({ error: "Webhook handling failed", detail: errorText(err) }, { status: 500 })
  }

  try {
    if (response.status >= 200 && response.status < 300) await completeEvent(claim, event.type, db, now())
    else await releaseEvent(claim, db)
  } catch (err) {
    // The work itself is settled; a stale claim only delays a duplicate by one lease.
    console.error(`[webhook] ledger update failed for ${event.type} ${event.id}:`, errorText(err))
  }
  return response
}

// Frees the event so Stripe's next retry can run it straight away.
export async function releaseEvent(
  claim: Extract<Claim, { kind: "claimed" }>,
  db: LedgerDb = makeDb()
): Promise<void> {
  try {
    await db.send(new DeleteCommand({
      TableName: TABLE,
      Key: { userId: ledgerKey(claim.eventId) },
      ConditionExpression: "token = :token",
      ExpressionAttributeValues: { ":token": claim.token },
    }))
  } catch (err) {
    if (!isConditionFailure(err)) throw err
  }
}
