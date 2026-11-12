/**
 * Tests for the billing overview API and link-subscription endpoint.
 * Covers: multiple-sub display, admin auth enforcement, and link-only side effects.
 * Uses mocked Stripe SDK — no live API calls.
 */
import { NextRequest } from "next/server"

// Module-level mocks shared across all Stripe instances
const mockCustomersList = jest.fn()
const mockSubsList = jest.fn()
const mockSubsRetrieve = jest.fn()
const mockInvoicesList = jest.fn()
jest.mock("stripe", () => {
  return jest.fn().mockImplementation(() => ({
    customers: { list: mockCustomersList },
    subscriptions: { list: mockSubsList, retrieve: mockSubsRetrieve },
    invoices: { list: mockInvoicesList },
  }))
})

const mockGetClient = jest.fn()
const mockUpdateClient = jest.fn()
const mockIsAdmin = jest.fn(() => true)
const mockGrantAccess = jest.fn()
const mockCreateClient = jest.fn()
const mockSendEmail = jest.fn()

jest.mock("@/lib/authTokens", () => ({
  isAdminEmail: mockIsAdmin,
  getCoachingClientRecord: mockGetClient,
  updateCoachingClientRecord: mockUpdateClient,
  grantCoachingAccess: mockGrantAccess,
  createCoachingClientRecord: mockCreateClient,
}))

jest.mock("@/lib/adminMfa", () => ({ adminMfaOk: jest.fn(() => true) }))

jest.mock("@aws-sdk/client-cognito-identity-provider", () => ({
  CognitoIdentityProviderClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({
      UserAttributes: [{ Name: "email", Value: "lisa@ambrisa.com" }],
    }),
  })),
  GetUserCommand: jest.fn(),
}))

import { GET } from "@/app/api/admin/coaching/billing/route"
import { POST as LinkSubscription } from "@/app/api/admin/coaching/billing/link-subscription/route"

function makeGetReq(email: string, authorized = true) {
  return new NextRequest(`http://localhost/api/admin/coaching/billing?email=${encodeURIComponent(email)}`, {
    method: "GET",
    headers: authorized ? { Authorization: "Bearer faketoken" } : {},
  })
}

function makeLinkReq(email: string, authorized = true) {
  return new NextRequest("http://localhost/api/admin/coaching/billing/link-subscription", {
    method: "POST",
    headers: {
      ...(authorized ? { Authorization: "Bearer faketoken" } : {}),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  })
}

// Minimal Stripe subscription fixture
function makeStripeSub(overrides: {
  id: string
  status: string
  productMeta?: boolean
  unitAmount?: number
  periodEnd?: number
}): object {
  return {
    id: overrides.id,
    status: overrides.status,
    cancel_at_period_end: false,
    cancel_at: null,
    trial_end: null,
    metadata: overrides.productMeta !== false ? { product: "coaching" } : {},
    discounts: [],
    items: {
      data: [{
        id: `si_${overrides.id}`,
        price: { unit_amount: overrides.unitAmount ?? 45000, recurring: { interval: "month" } },
        current_period_end: overrides.periodEnd ?? 1800000000,
      }],
    },
  }
}

describe("GET /api/admin/coaching/billing", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsAdmin.mockReturnValue(true)
    mockCustomersList.mockResolvedValue({ data: [] })
    mockSubsList.mockResolvedValue({ data: [], has_more: false })
    mockSubsRetrieve.mockResolvedValue(null)
    mockInvoicesList.mockResolvedValue({ data: [] })
  })

  it("returns 401 when no Authorization header is present", async () => {
    const res = await GET(makeGetReq("client@test.com", false))
    expect(res.status).toBe(401)
  })

  it("returns 401 when caller is not an admin email", async () => {
    mockIsAdmin.mockReturnValue(false)
    const res = await GET(makeGetReq("client@test.com", true))
    expect(res.status).toBe(401)
  })

  it("returns 400 when email param is missing", async () => {
    const req = new NextRequest("http://localhost/api/admin/coaching/billing", {
      headers: { Authorization: "Bearer faketoken" },
    })
    const res = await GET(req)
    expect(res.status).toBe(400)
  })

  it("displays multiple active subscriptions with multipleActiveWarning true", async () => {
    mockGetClient.mockResolvedValue({
      email: "client@test.com",
      stripeSubscriptionId: "sub_primary",
    })
    mockCustomersList.mockResolvedValue({ data: [{ id: "cus_123" }] })
    mockSubsList.mockResolvedValue({
      data: [
        makeStripeSub({ id: "sub_primary", status: "active" }),
        makeStripeSub({ id: "sub_duplicate", status: "active" }),
      ],
      has_more: false,
    })

    const res = await GET(makeGetReq("client@test.com"))
    const body = await res.json() as { ok?: boolean; billing?: { subscriptions: Array<{ id: string; warning?: string }>; multipleActiveWarning: boolean } }

    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.billing?.multipleActiveWarning).toBe(true)
    expect(body.billing?.subscriptions).toHaveLength(2)
    // Both active subs should have warnings
    body.billing?.subscriptions.forEach((s) => {
      expect(s.warning).toBeDefined()
    })
  })

  it("lists subscriptions with correct status and amounts", async () => {
    mockGetClient.mockResolvedValue({
      email: "client@test.com",
      stripeSubscriptionId: "sub_abc",
    })
    mockCustomersList.mockResolvedValue({ data: [{ id: "cus_xyz" }] })
    mockSubsList.mockResolvedValue({
      data: [makeStripeSub({ id: "sub_abc", status: "active", unitAmount: 45000 })],
      has_more: false,
    })

    const res = await GET(makeGetReq("client@test.com"))
    const body = await res.json() as { billing?: { subscriptions: Array<{ id: string; status: string; unitAmountCents: number; isPrimary: boolean }> } }

    expect(res.status).toBe(200)
    const sub = body.billing?.subscriptions[0]
    expect(sub?.id).toBe("sub_abc")
    expect(sub?.status).toBe("active")
    expect(sub?.unitAmountCents).toBe(45000)
    expect(sub?.isPrimary).toBe(true)
  })

  it("applies discount percentage and computes effectiveAmountCents", async () => {
    const subWithDiscount = {
      ...makeStripeSub({ id: "sub_disc", status: "active", unitAmount: 45000 }),
      discounts: [{ coupon: { percent_off: 20 } }],
    }
    mockGetClient.mockResolvedValue({ email: "client@test.com", stripeSubscriptionId: "sub_disc" })
    mockCustomersList.mockResolvedValue({ data: [{ id: "cus_111" }] })
    mockSubsList.mockResolvedValue({ data: [subWithDiscount], has_more: false })

    const res = await GET(makeGetReq("client@test.com"))
    const body = await res.json() as { billing?: { subscriptions: Array<{ discountPercent: number | null; effectiveAmountCents: number | null }> } }

    expect(res.status).toBe(200)
    const sub = body.billing?.subscriptions[0]
    expect(sub?.discountPercent).toBe(20)
    expect(sub?.effectiveAmountCents).toBe(36000) // 45000 * 0.80
  })

  it("returns 404 when client record does not exist", async () => {
    mockGetClient.mockResolvedValue(null)
    const res = await GET(makeGetReq("nobody@test.com"))
    expect(res.status).toBe(404)
  })
})

describe("POST /api/admin/coaching/billing/link-subscription", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsAdmin.mockReturnValue(true)
    mockCustomersList.mockResolvedValue({ data: [] })
    mockSubsList.mockResolvedValue({ data: [], has_more: false })
    mockUpdateClient.mockResolvedValue(undefined)
  })

  it("stores stripeSubscriptionId without triggering onboarding side effects", async () => {
    mockGetClient.mockResolvedValue({ email: "client@test.com" })
    mockCustomersList.mockResolvedValue({ data: [{ id: "cus_link" }] })
    mockSubsList.mockResolvedValue({
      data: [makeStripeSub({ id: "sub_link", status: "active" })],
      has_more: false,
    })

    const res = await LinkSubscription(makeLinkReq("client@test.com"))
    const body = await res.json() as { ok?: boolean; subscriptionId?: string; message?: string }

    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.subscriptionId).toBe("sub_link")

    // Only updateCoachingClientRecord should be called — with just the subscription ID
    expect(mockUpdateClient).toHaveBeenCalledWith("client@test.com", { stripeSubscriptionId: "sub_link" })

    // No onboarding side effects
    expect(mockGrantAccess).not.toHaveBeenCalled()
    expect(mockCreateClient).not.toHaveBeenCalled()
    expect(mockSendEmail).not.toHaveBeenCalled()
  })

  it("returns 401 without admin token", async () => {
    const res = await LinkSubscription(makeLinkReq("client@test.com", false))
    expect(res.status).toBe(401)
    expect(mockUpdateClient).not.toHaveBeenCalled()
  })

  it("returns 404 when no client record exists", async () => {
    mockGetClient.mockResolvedValue(null)
    const res = await LinkSubscription(makeLinkReq("ghost@test.com"))
    expect(res.status).toBe(404)
    expect(mockUpdateClient).not.toHaveBeenCalled()
  })

  it("returns 404 when no active coaching subscription found in Stripe", async () => {
    mockGetClient.mockResolvedValue({ email: "client@test.com" })
    mockCustomersList.mockResolvedValue({ data: [{ id: "cus_xyz" }] })
    // Active subscription exists but without coaching product metadata
    mockSubsList.mockResolvedValue({
      data: [makeStripeSub({ id: "sub_other", status: "active", productMeta: false })],
      has_more: false,
    })

    const res = await LinkSubscription(makeLinkReq("client@test.com"))
    expect(res.status).toBe(404)
    expect(mockUpdateClient).not.toHaveBeenCalled()
  })
})
