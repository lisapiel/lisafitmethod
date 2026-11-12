import { planComplimentary, voidCheck, collectionView, type BillingMode, type CollectionView, type ComplimentaryPlan } from "./rules"
import {
  BillingBusyError, BillingConflictError, beginOp, finishState, initialMode, listOps, markPending, readOp, readState, setOpStatus, stripeKeyFor,
  type BillingOp, type BillingState, type Sender,
} from "./store"
import { classifyStripeError, loadBilling, pauseForComplimentary, previewNext, readInvoice, readSubscription, voidInvoice, type LoadedBilling, type StripeLike } from "./stripeOps"
import type { InvoiceSnapshot } from "./snapshot"

export type ClientFacts = { stripeSubscriptionId?: string | null; accessType?: string | null; cancellationScheduledAt?: string | null } | null

export type Deps = {
  db: Sender
  stripe: StripeLike
  readClient: (email: string) => Promise<ClientFacts>
  now?: () => Date
}

// An unanswered Stripe request is settled well within this; after it, an
// operation Stripe never applied is closed as failed.
export const SETTLE_AFTER_MS = 15 * 60 * 1000

const nowIso = (d: Deps) => (d.now ? d.now() : new Date()).toISOString()

export type ActionResult =
  | { ok: true; message: string; opId?: string }
  | { ok: false; status: number; message: string; blockers?: { code: string; message: string }[]; uncertain?: boolean; opId?: string }

// ── Reconciliation ─────────────────────────────────────────────────────────

// Finishes or fails an operation interrupted part-way, using Stripe as the
// record of what happened. Never calls Stripe to change anything.
export async function reconcile(d: Deps, email: string): Promise<string | null> {
  const state = await readState(d.db, email)
  if (!state?.pendingOpId) return null
  let op = await readOp(d.db, state.pendingOpId)
  if (!op) return null
  const now = nowIso(d)
  const age = Date.parse(now) - Date.parse(op.requestedAt)

  try {
    if (op.status === "PENDING" || op.status === "UNCERTAIN") {
      const applied = await stripeShowsApplied(d, op)
      if (applied === "yes") {
        op = await setOpStatus(d.db, op, "APPLIED", { note: "Confirmed from Stripe after an interruption", now })
      } else if (applied === "no" && age > SETTLE_AFTER_MS) {
        op = await setOpStatus(d.db, op, "FAILED", { error: "Stripe never applied this change.", note: "Closed after checking Stripe", now })
        await finishState(d.db, op, { now })
        return "An earlier change didn't reach Stripe and was closed. Nothing was changed."
      } else {
        return "A billing change is still being confirmed with Stripe."
      }
    }
    if (op.status === "APPLIED") {
      await finishState(d.db, op, { ...targetState(op), now })
      await setOpStatus(d.db, op, "COMPLETED", { now })
      return "An earlier change was confirmed by Stripe and has now been recorded here."
    }
    // COMPLETED or FAILED with the lock still held: only the release is missing.
    await finishState(d.db, op, op.status === "COMPLETED" ? { ...targetState(op), now } : { now })
    return null
  } catch (e) {
    if (e instanceof BillingConflictError) return null
    throw e
  }
}

function targetState(op: BillingOp): { mode?: BillingMode; referencePriceCents?: number | null } {
  if (op.kind === "MAKE_COMPLIMENTARY") return { mode: "complimentary", referencePriceCents: (op.target.referencePriceCents as number | null) ?? null }
  if (op.kind === "RECORD_PAID") return { mode: "paid" }
  return {}
}

async function stripeShowsApplied(d: Deps, op: BillingOp): Promise<"yes" | "no" | "unknown"> {
  try {
    if (op.kind === "MAKE_COMPLIMENTARY") {
      if (!op.subscriptionId) return "yes"
      const sub = await readSubscription(d.stripe, op.subscriptionId)
      return sub.pause?.behavior === "void" && !sub.pause.resumesAt ? "yes" : "no"
    }
    if (op.kind === "VOID_INVOICE") {
      if (!op.invoiceId) return "no"
      return (await readInvoice(d.stripe, op.invoiceId)).status === "void" ? "yes" : "no"
    }
    return "yes"
  } catch {
    return "unknown"
  }
}

// ── The management view ────────────────────────────────────────────────────

export type ManageView = {
  email: string
  mode: BillingMode
  modeSince: string | null
  modeBy: string | null
  referencePriceCents: number | null
  collection: CollectionView
  linkedSubscriptionId: string | null
  complimentary: ComplimentaryPlan
  outstanding: InvoiceSnapshot[]
  invoices: InvoiceSnapshot[]
  pending: { opId: string; kind: string; status: string; since: string } | null
  notice: string | null
  history: Array<Pick<BillingOp, "id" | "kind" | "status" | "requestedBy" | "requestedAt" | "before" | "target" | "stripeResult" | "error">>
  linkedCustomerOutsideEmail: string | null
}

export async function manageView(d: Deps, email: string): Promise<ManageView> {
  const notice = await reconcile(d, email)
  const client = await d.readClient(email)
  const linkedId = client?.stripeSubscriptionId ?? null
  const [state, loaded, ops] = await Promise.all([readState(d.db, email), loadBilling(d.stripe, email, linkedId), listOps(d.db, email)])
  const mode = state?.mode ?? initialMode(client)
  const sub = loaded.subs.linked
  const preview = sub && sub.status !== "canceled" && !sub.pause && mode === "paid" ? await previewNext(d.stripe, sub) : null
  const complimentary = planComplimentary({ mode, subs: loaded.subs, invoices: loaded.invoices })
  return {
    email,
    mode,
    modeSince: state?.modeSince ?? null,
    modeBy: state?.modeBy ?? null,
    referencePriceCents: state?.referencePriceCents ?? sub?.unitAmountCents ?? null,
    collection: collectionView({ mode, sub, preview }),
    linkedSubscriptionId: linkedId,
    complimentary,
    outstanding: complimentary.outstanding,
    invoices: loaded.invoices,
    pending: state?.pendingOpId ? { opId: state.pendingOpId, kind: state.pendingKind ?? "", status: state.pendingStatus ?? "", since: state.pendingAt ?? "" } : null,
    notice,
    history: ops.map(({ id, kind, status, requestedBy, requestedAt, before, target, stripeResult, error }) => ({ id, kind, status, requestedBy, requestedAt, before, target, stripeResult: stripeResult ?? null, error: error ?? null })),
    linkedCustomerOutsideEmail: loaded.linkedCustomerOutsideEmail,
  }
}

// ── Actions ────────────────────────────────────────────────────────────────

async function freshFacts(d: Deps, email: string): Promise<{ client: ClientFacts; state: BillingState | null; loaded: LoadedBilling; mode: BillingMode }> {
  await reconcile(d, email)
  const client = await d.readClient(email)
  const loaded = await loadBilling(d.stripe, email, client?.stripeSubscriptionId ?? null)
  const state = await readState(d.db, email)
  return { client, state, loaded, mode: state?.mode ?? initialMode(client) }
}

function busy(e: unknown): ActionResult | null {
  if (e instanceof BillingBusyError) return { ok: false, status: 409, message: "Another billing change for this client is still being finished. Reload in a moment." }
  return null
}

// Make Complimentary. `confirm` is what the admin saw when they confirmed;
// if Stripe now looks different, nothing happens and they review again.
export async function makeComplimentary(d: Deps, input: { email: string; admin: string; confirm: { subscriptionId: string | null } }): Promise<ActionResult> {
  const email = input.email.trim().toLowerCase()
  const { client, loaded, mode } = await freshFacts(d, email)
  if (!client) return { ok: false, status: 404, message: "Client not found." }
  const plan = planComplimentary({ mode, subs: loaded.subs, invoices: loaded.invoices })
  if (plan.kind === "blocked") return { ok: false, status: 409, message: "This client can't be made complimentary yet.", blockers: plan.blockers }

  const subId = plan.kind === "pause" ? plan.subscription.id : null
  if ((input.confirm.subscriptionId ?? null) !== subId) {
    return { ok: false, status: 409, message: "The billing details changed since you opened this. Review them again before confirming." }
  }

  const referencePriceCents = plan.kind === "pause" ? plan.referencePriceCents : loaded.subs.linked?.unitAmountCents ?? null
  let op: BillingOp
  try {
    ;({ op } = await beginOp(d.db, {
      email,
      kind: "MAKE_COMPLIMENTARY",
      requestedBy: input.admin,
      subscriptionId: subId,
      before: { mode, collectingCents: plan.kind === "pause" ? referencePriceCents : null },
      target: { mode: "complimentary", referencePriceCents },
      initial: mode,
      now: nowIso(d),
    }))
  } catch (e) {
    const b = busy(e)
    if (b) return b
    throw e
  }

  if (plan.kind === "pause") {
    try {
      const after = await pauseForComplimentary(d.stripe, plan.subscription.id, op.id, referencePriceCents, stripeKeyFor(op.id))
      if (after.pause?.behavior !== "void" || after.pause.resumesAt) {
        op = await setOpStatus(d.db, op, "FAILED", { error: "Stripe answered without pausing collection.", now: nowIso(d) })
        await finishState(d.db, op, { now: nowIso(d) })
        return { ok: false, status: 502, message: "Stripe didn't pause collection. Nothing was changed here.", opId: op.id }
      }
      op = await setOpStatus(d.db, op, "APPLIED", { stripeResult: `pause_collection=void on ${after.id}, status ${after.status}`, now: nowIso(d) })
    } catch (e) {
      const c = classifyStripeError(e)
      if (c.kind === "definitive") {
        op = await setOpStatus(d.db, op, "FAILED", { error: c.message, now: nowIso(d) })
        await finishState(d.db, op, { now: nowIso(d) })
        return { ok: false, status: 502, message: `Stripe refused the change: ${c.message} Nothing was changed.`, opId: op.id }
      }
      op = await setOpStatus(d.db, op, "UNCERTAIN", { error: c.message, now: nowIso(d) })
      await markPending(d.db, op, "UNCERTAIN", nowIso(d)).catch(() => {})
      return { ok: false, status: 202, uncertain: true, message: "Stripe didn't answer in time, so it isn't confirmed yet. Reload billing in a minute; it checks Stripe and finishes or cancels the change. Their coaching access isn't affected either way.", opId: op.id }
    }
  } else {
    op = await setOpStatus(d.db, op, "APPLIED", { stripeResult: plan.reason === "already-paused" ? "Stripe collection was already paused" : "No running Stripe subscription", now: nowIso(d) })
  }

  try {
    await finishState(d.db, op, { mode: "complimentary", referencePriceCents, now: nowIso(d) })
    await setOpStatus(d.db, op, "COMPLETED", { now: nowIso(d) })
  } catch {
    return { ok: true, opId: op.id, message: "Stripe has stopped collecting. Saving that here didn't finish; it completes automatically the next time billing loads." }
  }
  return {
    ok: true,
    opId: op.id,
    message: plan.kind === "pause"
      ? "Complimentary. Stripe has stopped collecting; the subscription stays active and their coaching is unchanged."
      : "Recorded as complimentary. Their coaching is unchanged.",
  }
}

export async function voidOutstandingInvoice(d: Deps, input: { email: string; admin: string; invoiceId: string; confirmAmountCents: number }): Promise<ActionResult> {
  const email = input.email.trim().toLowerCase()
  const { client, loaded, mode } = await freshFacts(d, email)
  if (!client) return { ok: false, status: 404, message: "Client not found." }
  const inv = loaded.invoices.find((i) => i.id === input.invoiceId) ?? null
  const check = voidCheck(inv, loaded.subs.linkedId)
  if (!check.ok) return { ok: false, status: 409, message: check.message }
  if (inv!.amountRemainingCents !== input.confirmAmountCents) {
    return { ok: false, status: 409, message: "The invoice amount changed since you opened this. Review it again before confirming." }
  }

  let op: BillingOp
  try {
    ;({ op } = await beginOp(d.db, {
      email,
      kind: "VOID_INVOICE",
      requestedBy: input.admin,
      subscriptionId: loaded.subs.linkedId,
      invoiceId: inv!.id,
      before: { invoice: inv!.number ?? inv!.id, status: inv!.status, amountRemainingCents: inv!.amountRemainingCents },
      target: { status: "void" },
      initial: mode,
      now: nowIso(d),
    }))
  } catch (e) {
    const b = busy(e)
    if (b) return b
    throw e
  }

  try {
    const after = await voidInvoice(d.stripe, inv!.id, stripeKeyFor(op.id))
    if (after.status !== "void") {
      op = await setOpStatus(d.db, op, "FAILED", { error: `Invoice is ${after.status}, not void.`, now: nowIso(d) })
      await finishState(d.db, op, { now: nowIso(d) })
      return { ok: false, status: 502, message: "Stripe didn't void the invoice. Nothing was changed.", opId: op.id }
    }
    op = await setOpStatus(d.db, op, "APPLIED", { stripeResult: `invoice ${after.id} void`, now: nowIso(d) })
  } catch (e) {
    const c = classifyStripeError(e)
    if (c.kind === "definitive") {
      op = await setOpStatus(d.db, op, "FAILED", { error: c.message, now: nowIso(d) })
      await finishState(d.db, op, { now: nowIso(d) })
      return { ok: false, status: 502, message: `Stripe refused: ${c.message} Nothing was changed.`, opId: op.id }
    }
    op = await setOpStatus(d.db, op, "UNCERTAIN", { error: c.message, now: nowIso(d) })
    await markPending(d.db, op, "UNCERTAIN", nowIso(d)).catch(() => {})
    return { ok: false, status: 202, uncertain: true, message: "Stripe didn't answer in time. Reload billing in a minute to see whether the invoice was voided.", opId: op.id }
  }
  try {
    await finishState(d.db, op, { now: nowIso(d) })
    await setOpStatus(d.db, op, "COMPLETED", { now: nowIso(d) })
  } catch {
    // Stripe has voided it; the record catches up on the next load.
  }
  return { ok: true, opId: op.id, message: `Invoice ${inv!.number ?? inv!.id} is void. Nothing was refunded.` }
}

// Recovery only: the record says complimentary but Stripe is collecting, and
// the admin confirms that paid is correct. Nothing is sent to Stripe.
export async function recordPaid(d: Deps, input: { email: string; admin: string }): Promise<ActionResult> {
  const email = input.email.trim().toLowerCase()
  const { client, loaded, mode } = await freshFacts(d, email)
  if (!client) return { ok: false, status: 404, message: "Client not found." }
  const sub = loaded.subs.linked
  if (mode !== "complimentary") return { ok: false, status: 409, message: "This client is already recorded as paid." }
  if (!sub || sub.status === "canceled" || sub.pause) {
    return { ok: false, status: 409, message: "Stripe isn't collecting from this client, so they can't be recorded as paid. Use Resume Paid Coaching instead." }
  }
  let op: BillingOp
  try {
    ;({ op } = await beginOp(d.db, { email, kind: "RECORD_PAID", requestedBy: input.admin, subscriptionId: sub.id, before: { mode }, target: { mode: "paid" }, initial: mode, now: nowIso(d) }))
  } catch (e) {
    const b = busy(e)
    if (b) return b
    throw e
  }
  op = await setOpStatus(d.db, op, "APPLIED", { stripeResult: "No Stripe change (Stripe was already collecting)", now: nowIso(d) })
  await finishState(d.db, op, { mode: "paid", now: nowIso(d) })
  await setOpStatus(d.db, op, "COMPLETED", { now: nowIso(d) })
  return { ok: true, opId: op.id, message: "Recorded as paid, matching Stripe." }
}
