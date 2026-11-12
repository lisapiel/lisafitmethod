import { randomBytes } from "node:crypto"
import { GetCommand, PutCommand, type ScanCommand } from "@aws-sdk/lib-dynamodb"
import { scanAll } from "@/lib/dynamoScan"
import type { BillingMode } from "./rules"

// Billing records. Stripe and this table can't change in one transaction, so
// every change is written down before Stripe is asked, and finished after:
//
//   1. an operation record is created as PENDING (write-once id), and the
//      client's billing record is locked to it (revision-checked write);
//   2. Stripe is called with the operation id as its idempotency key;
//   3. the operation becomes APPLIED (Stripe confirmed), FAILED (Stripe
//      refused, nothing changed) or UNCERTAIN (no answer; Stripe decides);
//   4. the billing record takes the new mode and the lock is released, and
//      the operation becomes COMPLETED.
//
// If the process stops anywhere, the next billing load reads Stripe and
// finishes or fails the operation (see reconcile.ts). The client's coaching
// access is never touched by any of this.

export const TABLE = process.env.DYNAMODB_TABLE ?? "lfm-user-progress"

export type Sender = { send(command: unknown): Promise<unknown> }

export type OpKind =
  | "MAKE_COMPLIMENTARY"
  | "VOID_INVOICE"
  | "RECORD_PAID"
  // Complimentary grant changes. None of these touch Stripe except the
  // client's own cancellation, which only schedules the subscription to end.
  | "SET_COMPLIMENTARY_END"
  | "END_COMPLIMENTARY"
  | "CLIENT_CANCEL_COMPLIMENTARY"
export type OpStatus = "PENDING" | "APPLIED" | "UNCERTAIN" | "COMPLETED" | "FAILED"

export type BillingState = {
  userId: string
  email: string
  mode: BillingMode
  // The subscription's own price when collection was paused, kept for reference.
  referencePriceCents?: number | null
  // For complimentary: when and by whom it was granted.
  modeSince?: string
  modeBy?: string
  // The complimentary grant (see entitlement.ts). Written only by admin actions,
  // apart from a client's own cancellation, which can only bring the end closer.
  compReason?: string | null
  compEndsAt?: string | null
  compEndReason?: "end-date" | "client-cancelled" | null
  compEndedAt?: string | null
  compEndedBy?: string | null
  compEndNote?: string | null
  // The paid commitment in place when the client was made complimentary. It
  // doesn't apply while complimentary; kept so the record shows what was waived.
  compCommitment?: { type: string | null; endDate: string | null } | null
  rev: number
  pendingOpId?: string | null
  pendingKind?: OpKind | null
  pendingStatus?: OpStatus | null
  pendingAt?: string | null
  updatedAt: string
}

export type BillingOp = {
  userId: string
  id: string
  email: string
  kind: OpKind
  status: OpStatus
  opRev: number
  requestedBy: string
  requestedAt: string
  updatedAt: string
  subscriptionId?: string | null
  invoiceId?: string | null
  // Values before and after, as shown in the history.
  before: Record<string, string | number | boolean | null>
  target: Record<string, string | number | boolean | null>
  stripeResult?: string | null
  error?: string | null
  history: Array<{ status: OpStatus; at: string; note?: string }>
}

const stateKey = (email: string) => `coaching_billing_${email.trim().toLowerCase()}`
const opKey = (id: string) => `coaching_billing_op_${id}`

export const newOpId = () => `${Date.now().toString(36)}_${randomBytes(6).toString("hex")}`
export const stripeKeyFor = (opId: string) => `lfm-billing-${opId}`

export class BillingBusyError extends Error {
  constructor(public opId: string, public kind: string) {
    super("Another billing change for this client is still being finished.")
    this.name = "BillingBusyError"
  }
}
export class BillingConflictError extends Error {
  constructor() {
    super("The billing record changed while this was being saved. Reload and try again.")
    this.name = "BillingConflictError"
  }
}

const isConditionFailure = (e: unknown) => (e as { name?: string })?.name === "ConditionalCheckFailedException"

export async function readState(db: Sender, email: string): Promise<BillingState | null> {
  const r = (await db.send(new GetCommand({ TableName: TABLE, Key: { userId: stateKey(email) }, ConsistentRead: true }))) as { Item?: BillingState }
  return r.Item ?? null
}

// The mode before any billing record exists is always paid. Complimentary is
// only ever set by the Make Complimentary action; the client record's
// `accessType` field was never reliably written, so it isn't read here.
export function initialMode(): BillingMode {
  return "paid"
}

export type GrantPatch = Partial<Pick<BillingState, "modeSince" | "modeBy" | "compReason" | "compEndsAt" | "compEndReason" | "compEndedAt" | "compEndedBy" | "compEndNote" | "compCommitment">>

async function writeState(db: Sender, next: BillingState, expectedRev: number | null): Promise<void> {
  try {
    await db.send(
      new PutCommand({
        TableName: TABLE,
        Item: next,
        ...(expectedRev == null
          ? { ConditionExpression: "attribute_not_exists(userId)" }
          : { ConditionExpression: "rev = :v", ExpressionAttributeValues: { ":v": expectedRev } }),
      }),
    )
  } catch (e) {
    if (isConditionFailure(e)) throw new BillingConflictError()
    throw e
  }
}

export async function readOp(db: Sender, id: string): Promise<BillingOp | null> {
  const r = (await db.send(new GetCommand({ TableName: TABLE, Key: { userId: opKey(id) }, ConsistentRead: true }))) as { Item?: BillingOp }
  return r.Item ?? null
}

export async function listOps(db: Sender, email: string): Promise<BillingOp[]> {
  const ops = await scanAll<BillingOp>(db as { send(c: ScanCommand): Promise<{ Items?: Record<string, unknown>[] }> }, {
    TableName: TABLE,
    FilterExpression: "begins_with(userId, :p) AND email = :e",
    ExpressionAttributeValues: { ":p": "coaching_billing_op_", ":e": email.trim().toLowerCase() },
  })
  return ops.sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))
}

// Creates the operation and locks the client's billing record to it. A lock
// held by an unfinished operation refuses the new one.
export async function beginOp(
  db: Sender,
  input: { email: string; kind: OpKind; requestedBy: string; subscriptionId?: string | null; invoiceId?: string | null; before: BillingOp["before"]; target: BillingOp["target"]; initial: BillingMode; now?: string },
): Promise<{ op: BillingOp; state: BillingState }> {
  const now = input.now ?? new Date().toISOString()
  const email = input.email.trim().toLowerCase()
  const current = await readState(db, email)
  if (current?.pendingOpId) throw new BillingBusyError(current.pendingOpId, current.pendingKind ?? "")

  const op: BillingOp = {
    userId: "",
    id: newOpId(),
    email,
    kind: input.kind,
    status: "PENDING",
    opRev: 0,
    requestedBy: input.requestedBy,
    requestedAt: now,
    updatedAt: now,
    subscriptionId: input.subscriptionId ?? null,
    invoiceId: input.invoiceId ?? null,
    before: input.before,
    target: input.target,
    history: [{ status: "PENDING", at: now }],
  }
  op.userId = opKey(op.id)
  await db.send(new PutCommand({ TableName: TABLE, Item: op, ConditionExpression: "attribute_not_exists(userId)" }))

  const base: BillingState = current ?? { userId: stateKey(email), email, mode: input.initial, rev: 0, updatedAt: now }
  const locked: BillingState = { ...base, pendingOpId: op.id, pendingKind: op.kind, pendingStatus: "PENDING", pendingAt: now, rev: base.rev + 1, updatedAt: now }
  try {
    await writeState(db, locked, current ? current.rev : null)
  } catch (e) {
    await setOpStatus(db, op, "FAILED", { error: "Another change was saved at the same moment; nothing was sent to Stripe." }).catch(() => {})
    if (e instanceof BillingConflictError) throw new BillingBusyError("", "")
    throw e
  }
  return { op, state: locked }
}

// Moves an operation to a new status. Only forward moves are written, and
// only from the status this caller last saw, so two finishers can't fight.
export async function setOpStatus(
  db: Sender,
  op: BillingOp,
  status: OpStatus,
  extra: { stripeResult?: string | null; error?: string | null; note?: string; now?: string } = {},
): Promise<BillingOp> {
  const now = extra.now ?? new Date().toISOString()
  const next: BillingOp = {
    ...op,
    status,
    opRev: op.opRev + 1,
    updatedAt: now,
    ...(extra.stripeResult !== undefined ? { stripeResult: extra.stripeResult } : {}),
    ...(extra.error !== undefined ? { error: extra.error } : {}),
    history: [...op.history, { status, at: now, ...(extra.note ? { note: extra.note } : {}) }],
  }
  try {
    await db.send(new PutCommand({ TableName: TABLE, Item: next, ConditionExpression: "opRev = :prev", ExpressionAttributeValues: { ":prev": op.opRev } }))
  } catch (e) {
    if (isConditionFailure(e)) throw new BillingConflictError()
    throw e
  }
  return next
}

// Releases the lock this operation holds, optionally setting the new mode.
// Refuses if the lock now belongs to something else.
export async function finishState(
  db: Sender,
  op: BillingOp,
  change: { mode?: BillingMode; referencePriceCents?: number | null; grant?: GrantPatch; now?: string } = {},
): Promise<BillingState> {
  const now = change.now ?? new Date().toISOString()
  const current = await readState(db, op.email)
  if (!current || current.pendingOpId !== op.id) throw new BillingConflictError()
  const next: BillingState = {
    ...current,
    ...(change.mode && change.mode !== current.mode ? { mode: change.mode, modeSince: now, modeBy: op.requestedBy } : {}),
    ...(change.referencePriceCents !== undefined ? { referencePriceCents: change.referencePriceCents } : {}),
    ...(change.grant ?? {}),
    pendingOpId: null,
    pendingKind: null,
    pendingStatus: null,
    pendingAt: null,
    rev: current.rev + 1,
    updatedAt: now,
  }
  await writeState(db, next, current.rev)
  return next
}

// Mirrors the operation's status onto the lock, so the deletion guard sees
// "making complimentary" while Stripe is being asked.
export async function markPending(db: Sender, op: BillingOp, status: OpStatus, now = new Date().toISOString()): Promise<void> {
  const current = await readState(db, op.email)
  if (!current || current.pendingOpId !== op.id) return
  await writeState(db, { ...current, pendingStatus: status, rev: current.rev + 1, updatedAt: now }, current.rev)
}
