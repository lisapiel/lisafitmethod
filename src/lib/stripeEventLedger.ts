import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DeleteCommand, DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb"
import { AsyncLocalStorage } from "async_hooks"
import { createHash, randomBytes } from "crypto"

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
    claimToken: token,
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
      // "token" is a DynamoDB reserved word, so the attribute is claimToken and is always referenced by a placeholder.
      ConditionExpression: "#ct = :old",
      ExpressionAttributeNames: { "#ct": "claimToken" },
      ExpressionAttributeValues: { ":old": existing.claimToken },
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
      claimToken: claim.token,
      processedAt: new Date(now).toISOString(),
    },
    ConditionExpression: "#ct = :token",
    ExpressionAttributeNames: { "#ct": "claimToken" },
    ExpressionAttributeValues: { ":token": claim.token },
  }))
}

function errorText(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

type EventScope = { eventId: string; db: LedgerDb }
const eventScope = new AsyncLocalStorage<EventScope>()

export type LedgerFailure = { eventId: string; eventType: string; error: string }

export type RunOptions = {
  db?: LedgerDb
  now?: () => number
  // Called when an event was handled but could not be recorded as done.
  onLedgerFailure?: (failure: LedgerFailure) => Promise<void> | void
  completeAttempts?: number
  retryDelayMs?: number
}

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Stripe can deliver the same event more than once, and retries a delivery
// until it gets a 2xx. A repeat of a handled event is acknowledged without
// running again; an event whose handling failed is released so Stripe's next
// retry runs it in full.
//
// If the work succeeded but recording "done" keeps failing, the answer to
// Stripe is still 200. A 500 would make Stripe redeliver and repeat work that
// has already happened. The cost of answering 200 is narrower: the claim is
// left "processing", so only a later redelivery of this same event could run
// it again, after the lease, and emails already sent by this event are still
// skipped because they are recorded separately.
export async function runEventOnce(
  event: { id: string; type: string },
  handle: () => Promise<Response>,
  options: RunOptions = {}
): Promise<Response> {
  const db = options.db ?? makeDb()
  const now = options.now ?? Date.now
  const attempts = Math.max(1, options.completeAttempts ?? 3)
  const delay = options.retryDelayMs ?? 150

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
    response = await eventScope.run({ eventId: event.id, db }, handle)
  } catch (err) {
    console.error(`[webhook] ${event.type} ${event.id} failed:`, errorText(err))
    response = Response.json({ error: "Webhook handling failed", detail: errorText(err) }, { status: 500 })
  }

  if (response.status < 200 || response.status >= 300) {
    try {
      await releaseEvent(claim, db)
    } catch (err) {
      // The lease expires on its own, so Stripe's retry still runs after it.
      console.error(`[webhook] could not release ${event.type} ${event.id}:`, errorText(err))
    }
    return response
  }

  let lastError = ""
  for (let i = 0; i < attempts; i++) {
    try {
      await completeEvent(claim, event.type, db, now())
      return response
    } catch (err) {
      // Another run took the event over after our lease ran out; it owns the outcome.
      if (err instanceof Error && err.name === "ConditionalCheckFailedException") return response
      lastError = errorText(err)
      if (i < attempts - 1) await pause(delay * (i + 1))
    }
  }
  console.error(`[webhook] handled ${event.type} ${event.id} but could not record it as done:`, lastError)
  try {
    await options.onLedgerFailure?.({ eventId: event.id, eventType: event.type, error: lastError })
  } catch {
    // Alerting is best effort; the response below is what matters to Stripe.
  }
  return response
}

function mailKey(eventId: string, recipient: string, subject: string): string {
  const digest = createHash("sha256").update(`${recipient.trim().toLowerCase()}\n${subject}`).digest("hex").slice(0, 24)
  return `${ledgerKey(eventId)}__mail_${digest}`
}

// Sends at most once per Stripe event: when an earlier attempt of the same
// event already delivered this email, a retry skips it. Outside a webhook
// event it simply sends. The marker holds a hash, never the address.
export async function sendOncePerEvent(recipient: string, subject: string, send: () => Promise<void>): Promise<"sent" | "skipped"> {
  const scope = eventScope.getStore()
  if (!scope) {
    await send()
    return "sent"
  }
  const key = mailKey(scope.eventId, recipient, subject)
  const existing = (await scope.db.send(new GetCommand({ TableName: TABLE, Key: { userId: key } }))).Item
  if (existing?.status === "sent") return "skipped"
  await send()
  try {
    await scope.db.send(new PutCommand({
      TableName: TABLE,
      Item: { userId: key, eventId: scope.eventId, status: "sent", sentAt: new Date().toISOString() },
    }))
  } catch (err) {
    // The email went out; failing the event now would only send it again.
    console.error(`[webhook] email sent but not recorded for ${scope.eventId}:`, errorText(err))
  }
  return "sent"
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
      ConditionExpression: "#ct = :token",
      ExpressionAttributeNames: { "#ct": "claimToken" },
      ExpressionAttributeValues: { ":token": claim.token },
    }))
  } catch (err) {
    if (!isConditionFailure(err)) throw err
  }
}
