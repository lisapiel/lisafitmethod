import { planComplimentary, voidCheck, collectionView, type BillingMode, type CollectionView, type Commitment, type ComplimentaryPlan } from "./rules"
import {
  BillingBusyError, BillingConflictError, beginOp, finishState, initialMode, listOps, markPending, readOp, readState, setOpStatus, stripeKeyFor,
  type BillingOp, type BillingState, type GrantPatch, type Sender,
} from "./store"
import {
  cancelNow, classifyStripeError, loadBilling, pauseForComplimentary, previewNext, readInvoice, readSubscription, scheduleEndAtPeriodEnd, voidInvoice,
  type LoadedBilling, type StripeLike,
} from "./stripeOps"
import { complimentaryCancellationDate, complimentaryStatus, isComplimentaryActive, parseEndDate, type ComplimentaryStatus } from "./entitlement"
import type { InvoiceSnapshot } from "./snapshot"

export type ClientFacts = {
  stripeSubscriptionId?: string | null
  cancellationScheduledAt?: string | null
  commitment?: Commitment | null
} | null

export type Deps = {
  db: Sender
  stripe: StripeLike
  readClient: (email: string) => Promise<ClientFacts>
  now?: () => Date
}

// An unanswered Stripe request is settled well within this; after it, an
// operation Stripe never applied is closed as failed.
export const SETTLE_AFTER_MS = 15 * 60 * 1000

export const MAX_REASON = 500

const nowDate = (d: Deps) => (d.now ? d.now() : new Date())
const nowIso = (d: Deps) => nowDate(d).toISOString()

export type ActionResult =
  | { ok: true; message: string; opId?: string; effectiveDate?: string }
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

const str = (v: unknown) => (typeof v === "string" && v ? v : null)

// The record change each operation stands for, rebuilt from the operation
// itself so an interrupted change finishes with exactly what was confirmed.
export function targetState(op: BillingOp): { mode?: BillingMode; referencePriceCents?: number | null; grant?: GrantPatch } {
  const t = op.target
  if (op.kind === "MAKE_COMPLIMENTARY") {
    const endsAt = str(t.endsAt)
    return {
      mode: "complimentary",
      referencePriceCents: (t.referencePriceCents as number | null) ?? null,
      grant: {
        modeSince: op.requestedAt,
        modeBy: op.requestedBy,
        compReason: str(t.reason),
        compEndsAt: endsAt,
        compEndReason: endsAt ? "end-date" : null,
        compEndedAt: null,
        compEndedBy: null,
        compEndNote: null,
        compCommitment: str(t.commitmentEndDate) ? { type: str(t.commitmentType), endDate: str(t.commitmentEndDate) } : null,
      },
    }
  }
  if (op.kind === "SET_COMPLIMENTARY_END") {
    const endsAt = str(t.endsAt)
    return { grant: { compEndsAt: endsAt, compEndReason: endsAt ? "end-date" : null } }
  }
  if (op.kind === "END_COMPLIMENTARY") return { grant: { compEndedAt: op.requestedAt, compEndedBy: op.requestedBy, compEndNote: str(t.note) } }
  if (op.kind === "CLIENT_CANCEL_COMPLIMENTARY") return { grant: { compEndsAt: str(t.endsAt), compEndReason: "client-cancelled" } }
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
    if (op.kind === "CLIENT_CANCEL_COMPLIMENTARY") {
      if (!op.subscriptionId) return "yes"
      const sub = await readSubscription(d.stripe, op.subscriptionId)
      return sub.cancelAtPeriodEnd || !!sub.cancelAt || sub.status === "canceled" ? "yes" : "no"
    }
    if (op.kind === "CANCEL_PAUSED_SUBSCRIPTION") {
      if (!op.subscriptionId) return "no"
      return (await readSubscription(d.stripe, op.subscriptionId)).status === "canceled" ? "yes" : "no"
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
  comp: ComplimentaryStatus
  // The paid commitment waived when the client was made complimentary, if any.
  waivedCommitment: Commitment | null
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
  // After complimentary has ended: the paused subscription an admin may choose to cancel.
  cancelPausedSubscription: { subscriptionId: string } | null
}

export async function manageView(d: Deps, email: string): Promise<ManageView> {
  const notice = await reconcile(d, email)
  const client = await d.readClient(email)
  const linkedId = client?.stripeSubscriptionId ?? null
  const [state, loaded, ops] = await Promise.all([readState(d.db, email), loadBilling(d.stripe, email, linkedId), listOps(d.db, email)])
  const mode = state?.mode ?? initialMode()
  const now = nowDate(d)
  const comp = complimentaryStatus(state, now)
  const sub = loaded.subs.linked
  const preview = sub && sub.status !== "canceled" && !sub.pause && mode === "paid" ? await previewNext(d.stripe, sub) : null
  const complimentary = planComplimentary({ mode, grantActive: comp.state === "active", subs: loaded.subs, invoices: loaded.invoices, commitment: client?.commitment ?? null, now })
  return {
    email,
    mode,
    modeSince: state?.modeSince ?? null,
    modeBy: state?.modeBy ?? null,
    comp,
    waivedCommitment: state?.compCommitment ?? null,
    referencePriceCents: state?.referencePriceCents ?? sub?.unitAmountCents ?? null,
    collection: collectionView({ mode, sub, preview, comp }),
    linkedSubscriptionId: linkedId,
    complimentary,
    outstanding: complimentary.outstanding,
    invoices: loaded.invoices,
    pending: state?.pendingOpId ? { opId: state.pendingOpId, kind: state.pendingKind ?? "", status: state.pendingStatus ?? "", since: state.pendingAt ?? "" } : null,
    notice,
    history: ops.map(({ id, kind, status, requestedBy, requestedAt, before, target, stripeResult, error }) => ({ id, kind, status, requestedBy, requestedAt, before, target, stripeResult: stripeResult ?? null, error: error ?? null })),
    linkedCustomerOutsideEmail: loaded.linkedCustomerOutsideEmail,
    cancelPausedSubscription: pausedAfterEnd(comp, sub) ? { subscriptionId: sub!.id } : null,
  }
}

function pausedAfterEnd(comp: ComplimentaryStatus, sub: LoadedBilling["subs"]["linked"]): boolean {
  return comp.state === "ended" && !!sub && sub.status !== "canceled" && sub.status !== "incomplete_expired" && sub.pause?.behavior === "void" && !sub.pause.resumesAt
}

// ── Actions ────────────────────────────────────────────────────────────────

async function freshFacts(d: Deps, email: string): Promise<{ client: ClientFacts; state: BillingState | null; loaded: LoadedBilling; mode: BillingMode }> {
  await reconcile(d, email)
  const client = await d.readClient(email)
  const loaded = await loadBilling(d.stripe, email, client?.stripeSubscriptionId ?? null)
  const state = await readState(d.db, email)
  return { client, state, loaded, mode: state?.mode ?? initialMode() }
}

function busy(e: unknown): ActionResult | null {
  if (e instanceof BillingBusyError) return { ok: false, status: 409, message: "Another billing change for this client is still being finished. Reload in a moment." }
  return null
}

const cleanReason = (v: unknown) => (typeof v === "string" ? v.trim().slice(0, MAX_REASON) : "")

// Make Complimentary. `confirm` is what the admin saw when they confirmed;
// if Stripe now looks different, nothing happens and they review again.
// A reason is required; an end date is optional (none means until changed).
export async function makeComplimentary(
  d: Deps,
  input: { email: string; admin: string; confirm: { subscriptionId: string | null }; reason: string; endsAt?: string | null },
): Promise<ActionResult> {
  const email = input.email.trim().toLowerCase()
  const reason = cleanReason(input.reason)
  if (!reason) return { ok: false, status: 400, message: "Add a short reason, for the record." }
  const end = parseEndDate(input.endsAt, nowDate(d))
  if (!end.ok) return { ok: false, status: 400, message: end.message }

  const { client, state, loaded, mode } = await freshFacts(d, email)
  if (!client) return { ok: false, status: 404, message: "Client not found." }
  const plan = planComplimentary({ mode, grantActive: isComplimentaryActive(state, nowDate(d)), subs: loaded.subs, invoices: loaded.invoices, commitment: client.commitment ?? null, now: nowDate(d) })
  if (plan.kind === "blocked") return { ok: false, status: 409, message: "This client can't be made complimentary yet.", blockers: plan.blockers }

  const subId = plan.kind === "pause" ? plan.subscription.id : null
  if ((input.confirm.subscriptionId ?? null) !== subId) {
    return { ok: false, status: 409, message: "The billing details changed since you opened this. Review them again before confirming." }
  }

  const referencePriceCents = plan.kind === "pause" ? plan.referencePriceCents : loaded.subs.linked?.unitAmountCents ?? null
  const commitment = client.commitment ?? null
  let op: BillingOp
  try {
    ;({ op } = await beginOp(d.db, {
      email,
      kind: "MAKE_COMPLIMENTARY",
      requestedBy: input.admin,
      subscriptionId: subId,
      before: { mode, collectingCents: plan.kind === "pause" ? referencePriceCents : null, commitmentType: commitment?.type ?? null, commitmentEndDate: commitment?.endDate ?? null },
      target: { mode: "complimentary", referencePriceCents, reason, endsAt: end.endsAt, commitmentType: commitment?.type ?? null, commitmentEndDate: commitment?.endDate ?? null },
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
        return { ok: false, status: 502, message: "Stripe didn't pause collection. Nothing was changed.", opId: op.id }
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
    await finishState(d.db, op, { ...targetState(op), now: nowIso(d) })
    await setOpStatus(d.db, op, "COMPLETED", { now: nowIso(d) })
  } catch {
    return { ok: true, opId: op.id, message: "Stripe has stopped collecting. Saving that here didn't finish; it completes automatically the next time billing loads." }
  }
  const until = end.endsAt ? ` until ${end.endsAt.slice(0, 10)}` : " with no end date"
  return {
    ok: true,
    opId: op.id,
    message: plan.kind === "pause"
      ? `Complimentary${until}. Stripe has stopped collecting; the subscription stays active and their coaching is unchanged.`
      : `Recorded as complimentary${until}. Their coaching is unchanged.`,
  }
}

// Record-only change to an active complimentary grant, written through the
// same operation log as every other billing change, so it is audited and
// can't collide with another change.
async function grantChange(
  d: Deps,
  email: string,
  input: { kind: "SET_COMPLIMENTARY_END" | "END_COMPLIMENTARY"; admin: string; before: BillingOp["before"]; target: BillingOp["target"] },
): Promise<{ ok: true; op: BillingOp } | { ok: false; result: ActionResult }> {
  let op: BillingOp
  try {
    ;({ op } = await beginOp(d.db, { email, kind: input.kind, requestedBy: input.admin, before: input.before, target: input.target, initial: "complimentary", now: nowIso(d) }))
  } catch (e) {
    const b = busy(e)
    if (b) return { ok: false, result: b }
    throw e
  }
  op = await setOpStatus(d.db, op, "APPLIED", { stripeResult: "No Stripe change", now: nowIso(d) })
  try {
    await finishState(d.db, op, { ...targetState(op), now: nowIso(d) })
    await setOpStatus(d.db, op, "COMPLETED", { now: nowIso(d) })
  } catch {
    // The change is applied; the record catches up on the next billing load.
  }
  return { ok: true, op }
}

// Change (or remove) the end date of an active complimentary grant.
export async function setComplimentaryEnd(d: Deps, input: { email: string; admin: string; endsAt: string | null }): Promise<ActionResult> {
  const email = input.email.trim().toLowerCase()
  await reconcile(d, email)
  const state = await readState(d.db, email)
  const comp = complimentaryStatus(state, nowDate(d))
  if (comp.state !== "active") return { ok: false, status: 409, message: "This client doesn't have active complimentary coaching." }
  const end = parseEndDate(input.endsAt, nowDate(d))
  if (!end.ok) return { ok: false, status: 400, message: end.message }
  if (comp.endsBecause === "client-cancelled" && (!end.endsAt || Date.parse(end.endsAt) > Date.parse(comp.endsAt ?? ""))) {
    return { ok: false, status: 409, message: "The client cancelled, and their coaching ends on the date they chose. It can be brought forward, not extended." }
  }
  const r = await grantChange(d, email, { kind: "SET_COMPLIMENTARY_END", admin: input.admin, before: { endsAt: comp.endsAt }, target: { endsAt: end.endsAt } })
  if (!r.ok) return r.result
  return { ok: true, opId: r.op.id, message: end.endsAt ? `Complimentary coaching now ends ${end.endsAt.slice(0, 10)}.` : "Complimentary coaching now has no end date." }
}

// End complimentary coaching now. Coaching access ends. Stripe is left as it
// is: collection stays paused and paid billing is never resumed by this.
export async function endComplimentary(d: Deps, input: { email: string; admin: string; note: string }): Promise<ActionResult> {
  const email = input.email.trim().toLowerCase()
  const note = cleanReason(input.note)
  if (!note) return { ok: false, status: 400, message: "Add a short note, for the record." }
  await reconcile(d, email)
  const state = await readState(d.db, email)
  const comp = complimentaryStatus(state, nowDate(d))
  if (comp.state !== "active") return { ok: false, status: 409, message: "This client doesn't have active complimentary coaching." }
  const r = await grantChange(d, email, { kind: "END_COMPLIMENTARY", admin: input.admin, before: { endsAt: comp.endsAt }, target: { note } })
  if (!r.ok) return r.result
  return { ok: true, opId: r.op.id, message: "Complimentary coaching has ended and their coaching access is closed. Stripe stays paused and nothing is charged; paid billing was not resumed." }
}

// A complimentary client cancels their own coaching. No paid commitment
// applies: coaching continues to the end of the current monthly period (or an
// earlier end date Lisa set), and the paused subscription is set to end then.
export async function clientCancelComplimentary(d: Deps, input: { email: string }): Promise<ActionResult> {
  const email = input.email.trim().toLowerCase()
  const { client, state, loaded } = await freshFacts(d, email)
  if (!client) return { ok: false, status: 404, message: "Coaching record not found." }
  const comp = complimentaryStatus(state, nowDate(d))
  if (comp.state !== "active") return { ok: false, status: 409, message: "Complimentary coaching isn't active for this account." }
  if (comp.endsBecause === "client-cancelled") return { ok: true, message: "Your cancellation is already scheduled.", effectiveDate: comp.endsAt ?? undefined }

  const sub = loaded.subs.linked
  const running = !!sub && sub.status !== "canceled" && sub.status !== "incomplete_expired"
  const effective = complimentaryCancellationDate({ periodEnd: running ? sub!.currentPeriodEnd : null, currentEndsAt: comp.endsAt, grantStart: comp.since, now: nowDate(d) })

  let op: BillingOp
  try {
    ;({ op } = await beginOp(d.db, {
      email,
      kind: "CLIENT_CANCEL_COMPLIMENTARY",
      requestedBy: "client",
      subscriptionId: running ? sub!.id : null,
      before: { endsAt: comp.endsAt },
      target: { endsAt: effective },
      initial: "complimentary",
      now: nowIso(d),
    }))
  } catch (e) {
    if (e instanceof BillingBusyError) return { ok: false, status: 409, message: "Your account is being updated. Please try again in a minute." }
    throw e
  }

  if (running && !(sub!.cancelAtPeriodEnd || sub!.cancelAt)) {
    try {
      await scheduleEndAtPeriodEnd(d.stripe, sub!.id, stripeKeyFor(op.id))
    } catch (e) {
      const c = classifyStripeError(e)
      if (c.kind === "definitive") {
        op = await setOpStatus(d.db, op, "FAILED", { error: c.message, now: nowIso(d) })
        await finishState(d.db, op, { now: nowIso(d) })
        return { ok: false, status: 502, message: "We couldn't schedule your cancellation. Nothing was changed. Please try again or message me.", opId: op.id }
      }
      op = await setOpStatus(d.db, op, "UNCERTAIN", { error: c.message, now: nowIso(d) })
      await markPending(d.db, op, "UNCERTAIN", nowIso(d)).catch(() => {})
      return { ok: false, status: 202, uncertain: true, message: "Your cancellation is being confirmed. Please check back in a few minutes.", opId: op.id }
    }
  }
  op = await setOpStatus(d.db, op, "APPLIED", { stripeResult: running ? `cancel_at_period_end on ${sub!.id}` : "No running Stripe subscription", now: nowIso(d) })
  try {
    await finishState(d.db, op, { ...targetState(op), now: nowIso(d) })
    await setOpStatus(d.db, op, "COMPLETED", { now: nowIso(d) })
  } catch {
    // Stripe has it scheduled; the record catches up on the next billing load.
  }
  return { ok: true, opId: op.id, effectiveDate: effective, message: `Your complimentary coaching ends ${effective.slice(0, 10)}.` }
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

// After complimentary has ended, an admin may choose to end the paused Stripe
// subscription. Never automatic, never while a grant is active, and only for
// the exact subscription the admin reviewed. Outstanding invoices are left as
// they are (they're handled separately). Coaching access doesn't change here:
// it already ended with the grant.
export async function cancelPausedSubscription(d: Deps, input: { email: string; admin: string; confirm: { subscriptionId: string } }): Promise<ActionResult> {
  const email = input.email.trim().toLowerCase()
  const { client, state, loaded } = await freshFacts(d, email)
  if (!client) return { ok: false, status: 404, message: "Client not found." }
  const comp = complimentaryStatus(state, nowDate(d))
  if (comp.state !== "ended") return { ok: false, status: 409, message: comp.state === "active" ? "Complimentary coaching is still active. End it first." : "This is only for a client whose complimentary coaching has ended." }
  const sub = loaded.subs.linked
  if (!pausedAfterEnd(comp, sub)) return { ok: false, status: 409, message: "There's no paused Stripe subscription to cancel for this client." }
  if (sub!.id !== input.confirm.subscriptionId) return { ok: false, status: 409, message: "The billing details changed since you opened this. Review them again before confirming." }

  let op: BillingOp
  try {
    ;({ op } = await beginOp(d.db, { email, kind: "CANCEL_PAUSED_SUBSCRIPTION", requestedBy: input.admin, subscriptionId: sub!.id, before: { subscription: sub!.id, status: sub!.status }, target: { status: "canceled" }, initial: "complimentary", now: nowIso(d) }))
  } catch (e) {
    const b = busy(e)
    if (b) return b
    throw e
  }
  try {
    const after = await cancelNow(d.stripe, sub!.id, stripeKeyFor(op.id))
    if (after.status !== "canceled") {
      op = await setOpStatus(d.db, op, "FAILED", { error: `Subscription is ${after.status}, not canceled.`, now: nowIso(d) })
      await finishState(d.db, op, { now: nowIso(d) })
      return { ok: false, status: 502, message: "Stripe didn't cancel the subscription. Nothing was changed.", opId: op.id }
    }
    op = await setOpStatus(d.db, op, "APPLIED", { stripeResult: `subscription ${after.id} canceled`, now: nowIso(d) })
  } catch (e) {
    const c = classifyStripeError(e)
    if (c.kind === "definitive") {
      op = await setOpStatus(d.db, op, "FAILED", { error: c.message, now: nowIso(d) })
      await finishState(d.db, op, { now: nowIso(d) })
      return { ok: false, status: 502, message: `Stripe refused: ${c.message} Nothing was changed.`, opId: op.id }
    }
    op = await setOpStatus(d.db, op, "UNCERTAIN", { error: c.message, now: nowIso(d) })
    await markPending(d.db, op, "UNCERTAIN", nowIso(d)).catch(() => {})
    return { ok: false, status: 202, uncertain: true, message: "Stripe didn't answer in time. Reload billing in a minute to see whether the subscription was cancelled.", opId: op.id }
  }
  try {
    await finishState(d.db, op, { now: nowIso(d) })
    await setOpStatus(d.db, op, "COMPLETED", { now: nowIso(d) })
  } catch {
    // Stripe has cancelled it; the record catches up on the next load.
  }
  return { ok: true, opId: op.id, message: "The paused Stripe subscription is cancelled. Nothing was charged or refunded; any outstanding invoices are unchanged." }
}
