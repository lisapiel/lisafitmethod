import { test, describe } from "node:test"
import assert from "node:assert/strict"
import { decideCheckout, type CheckoutFacts } from "./coachingCheckout"
import { resolveInvitationAccess, applicationOwnerEmail, findCoachingInvitationForAccount } from "./coachingInvitation"
import type { CoachingApplication } from "./authTokens"
import type { SessionUser } from "./sessionUser"

const NOW = Date.UTC(2026, 9, 30, 12, 0, 0)
const HOUR = 60 * 60 * 1000

function facts(over: Partial<CheckoutFacts> = {}): CheckoutFacts {
  return {
    applicationStatus: "APPROVED",
    clientStatus: "PENDING_PAYMENT",
    liveSubscriptionId: null,
    existingSession: null,
    now: NOW,
    ...over,
  }
}

function application(over: Partial<CoachingApplication> = {}): CoachingApplication {
  return {
    userId: "coaching_app_x",
    id: "x",
    email: "applicant@example.com",
    name: "Test Person",
    goals: "",
    currentFitnessLevel: "",
    whyCoaching: "",
    status: "APPROVED",
    applicationDate: "2026-09-01T00:00:00.000Z",
    ...over,
  }
}

const user = (email: string, sub = "sub-1"): SessionUser => ({ email, sub })
const noLinks = async (email: string) => email

describe("Checkout decision — payment safety", () => {
  test("an approved applicant with nothing outstanding gets a new session", () => {
    assert.deepEqual(decideCheckout(facts()), { action: "create" })
  })

  test("an expired session is replaced, not replayed (Alanna's failure)", () => {
    const decision = decideCheckout(facts({
      existingSession: { status: "expired", paymentStatus: "unpaid", url: null, expiresAtMs: NOW - 20 * 24 * HOUR },
    }))
    assert.deepEqual(decision, { action: "create" })
  })

  test("an open session is reused, so a second click cannot open a competing one", () => {
    const decision = decideCheckout(facts({
      existingSession: { status: "open", paymentStatus: "unpaid", url: "https://checkout.stripe.com/live", expiresAtMs: NOW + 6 * HOUR },
    }))
    assert.deepEqual(decision, { action: "reuse", url: "https://checkout.stripe.com/live" })
  })

  test("a session about to expire is replaced rather than handed out", () => {
    const decision = decideCheckout(facts({
      existingSession: { status: "open", paymentStatus: "unpaid", url: "https://checkout.stripe.com/live", expiresAtMs: NOW + 30_000 },
    }))
    assert.deepEqual(decision, { action: "create" })
  })

  test("a completed session means they paid — never send them to pay again", () => {
    const decision = decideCheckout(facts({
      existingSession: { status: "complete", paymentStatus: "paid", url: null, expiresAtMs: NOW + HOUR },
    }))
    assert.deepEqual(decision, { action: "awaiting-activation" })
  })

  test("paid but webhook not yet processed is caught by payment_status alone", () => {
    const decision = decideCheckout(facts({
      existingSession: { status: "open", paymentStatus: "paid", url: "https://checkout.stripe.com/live", expiresAtMs: NOW + HOUR },
    }))
    assert.deepEqual(decision, { action: "awaiting-activation" })
  })

  test("a live Stripe subscription blocks a second subscription", () => {
    const decision = decideCheckout(facts({ liveSubscriptionId: "sub_live_1" }))
    assert.deepEqual(decision, { action: "already-active", subscriptionId: "sub_live_1" })
  })

  test("an already-active client record short-circuits before Stripe", () => {
    const decision = decideCheckout(facts({ clientStatus: "ACTIVE", clientSubscriptionId: "sub_abc" }))
    assert.deepEqual(decision, { action: "already-active", subscriptionId: "sub_abc" })
  })

  test("a PAID application never produces another checkout", () => {
    const decision = decideCheckout(facts({
      applicationStatus: "PAID",
      applicationSubscriptionId: "sub_paid",
      existingSession: { status: "open", paymentStatus: "unpaid", url: "https://x", expiresAtMs: NOW + HOUR },
    }))
    assert.deepEqual(decision, { action: "already-active", subscriptionId: "sub_paid" })
  })

  test("an abandoned-then-returned applicant can retry", () => {
    const abandoned = decideCheckout(facts({
      existingSession: { status: "expired", paymentStatus: "unpaid", url: null, expiresAtMs: NOW - HOUR },
    }))
    assert.equal(abandoned.action, "create")
  })
})

describe("Invitation access — identity", () => {
  test("the invited address owns its own invitation", async () => {
    const access = await resolveInvitationAccess(application(), user("applicant@example.com"), noLinks)
    assert.equal(access, "owner")
  })

  test("case and whitespace do not change ownership", async () => {
    const access = await resolveInvitationAccess(application(), user("  Applicant@Example.com  ".trim().toLowerCase()), noLinks)
    assert.equal(access, "owner")
  })

  test("a different signed-in account may claim an unclaimed invitation", async () => {
    const access = await resolveInvitationAccess(application(), user("courses@example.com"), noLinks)
    assert.equal(access, "linkable")
  })

  test("an already-linked alias resolves to the owner", async () => {
    const linked = async (email: string) =>
      email === "applicant@example.com" ? "courses@example.com" : email
    const app = application({ ownerEmail: "courses@example.com" })
    const access = await resolveInvitationAccess(app, user("applicant@example.com"), linked)
    assert.equal(access, "owner")
  })

  test("an invitation already claimed by someone else is closed to a third party", async () => {
    const app = application({ ownerEmail: "courses@example.com" })
    const access = await resolveInvitationAccess(app, user("stranger@example.com"), noLinks)
    assert.equal(access, "foreign")
  })

  test("ownership follows ownerEmail once linked, and falls back to the applicant address", () => {
    assert.equal(applicationOwnerEmail(application()), "applicant@example.com")
    assert.equal(applicationOwnerEmail(application({ ownerEmail: "Courses@Example.com" })), "courses@example.com")
  })
})

describe("Dashboard enrolment state", () => {
  const apps = (over: Partial<CoachingApplication>[]): CoachingApplication[] =>
    over.map((o, i) => application({ id: `app${i}`, ...o }))

  test("an approved application surfaces for the applicant address", async () => {
    const found = await findCoachingInvitationForAccount(
      "applicant@example.com", [], async () => apps([{ status: "APPROVED" }]))
    assert.equal(found?.status, "APPROVED")
  })

  test("it follows ownership, not the address applied under", async () => {
    const found = await findCoachingInvitationForAccount(
      "courses@example.com", [], async () =>
        apps([{ status: "APPROVED", ownerEmail: "courses@example.com", email: "other@example.com" }]))
    assert.equal(found?.applicantEmail, "other@example.com")
  })

  test("a linked second address still finds it", async () => {
    const found = await findCoachingInvitationForAccount(
      "courses@example.com", ["applicant@example.com"], async () => apps([{ status: "APPROVED" }]))
    assert.equal(found?.status, "APPROVED")
  })

  test("someone else's application is not shown", async () => {
    const found = await findCoachingInvitationForAccount(
      "stranger@example.com", [], async () => apps([{ status: "APPROVED" }]))
    assert.equal(found, null)
  })

  test("a declined application shows nothing rather than a dead state", async () => {
    const found = await findCoachingInvitationForAccount(
      "applicant@example.com", [], async () => apps([{ status: "DECLINED" }]))
    assert.equal(found, null)
  })

  test("the furthest-along application wins, so an old one cannot mask a live one", async () => {
    const found = await findCoachingInvitationForAccount(
      "applicant@example.com", [], async () =>
        apps([{ status: "PENDING", applicationDate: "2026-10-01T00:00:00.000Z" },
              { status: "APPROVED", applicationDate: "2026-09-01T00:00:00.000Z" }]))
    assert.equal(found?.status, "APPROVED")
  })

  test("a paid application reports PAID so the dashboard can say 'finalising'", async () => {
    const found = await findCoachingInvitationForAccount(
      "applicant@example.com", [], async () => apps([{ status: "PAID" }]))
    assert.equal(found?.status, "PAID")
  })
})
