/**
 * Tests for the client deletion Stripe safeguard.
 * Uses mocked Stripe SDK — no live API calls.
 */
import { NextRequest } from "next/server"

// Module-level Stripe mocks shared across all Stripe instances created within a test
const mockCustomersList = jest.fn()
const mockSubsRetrieve = jest.fn()
const mockSubsList = jest.fn()

jest.mock("stripe", () => {
  return jest.fn().mockImplementation(() => ({
    subscriptions: { retrieve: mockSubsRetrieve, list: mockSubsList },
    customers: { list: mockCustomersList },
  }))
})

jest.mock("@/lib/authTokens", () => ({
  isAdminEmail: jest.fn(() => true),
  getCoachingClientRecord: jest.fn(),
  updateCoachingClientRecord: jest.fn(),
  listCoachingClientRecords: jest.fn(() => []),
  deleteCoachingClientCascade: jest.fn(() => ({
    clientRecord: true, accessGrant: true,
    workoutLogs: 0, checkIns: 0, snapshots: 0, goals: 0, messages: 0,
  })),
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

import { DELETE } from "@/app/api/admin/coaching/clients/[email]/route"
import { getCoachingClientRecord, deleteCoachingClientCascade } from "@/lib/authTokens"

const mockGetClient = getCoachingClientRecord as jest.Mock
const mockDelete = deleteCoachingClientCascade as jest.Mock

function makeReq(email: string) {
  return new NextRequest(`http://localhost/api/admin/coaching/clients/${encodeURIComponent(email)}`, {
    method: "DELETE",
    headers: { Authorization: "Bearer faketoken", "Content-Type": "application/json" },
    body: JSON.stringify({ confirm: "DELETE" }),
  })
}

function makeParams(email: string) {
  return { params: Promise.resolve({ email: encodeURIComponent(email) }) }
}

describe("DELETE /api/admin/coaching/clients/[email]", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Safe defaults: no customers, no subscriptions
    mockCustomersList.mockResolvedValue({ data: [] })
    mockSubsRetrieve.mockResolvedValue(null)
    mockSubsList.mockResolvedValue({ data: [], has_more: false })
  })

  it("blocks deletion when linked stripeSubscriptionId is active", async () => {
    mockGetClient.mockResolvedValue({ email: "client@test.com", stripeSubscriptionId: "sub_active123" })
    mockSubsRetrieve.mockResolvedValue({ id: "sub_active123", status: "active", metadata: {} })

    const res = await DELETE(makeReq("client@test.com"), makeParams("client@test.com"))
    const body = await res.json() as { code?: string; subscriptionIds?: string[] }

    expect(res.status).toBe(409)
    expect(body.code).toBe("active_stripe_subscription")
    expect(body.subscriptionIds).toContain("sub_active123")
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it("blocks deletion when active coaching sub found via email search (no stored ID)", async () => {
    mockGetClient.mockResolvedValue({ email: "client@test.com", stripeSubscriptionId: undefined })
    mockCustomersList.mockResolvedValue({ data: [{ id: "cus_abc" }] })
    mockSubsList.mockResolvedValue({
      data: [{ id: "sub_found", status: "active", metadata: { product: "coaching" } }],
      has_more: false,
    })

    const res = await DELETE(makeReq("client@test.com"), makeParams("client@test.com"))
    const body = await res.json() as { code?: string }

    expect(res.status).toBe(409)
    expect(body.code).toBe("active_stripe_subscription")
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it("blocks deletion when linked subscription status is past_due", async () => {
    mockGetClient.mockResolvedValue({ email: "client@test.com", stripeSubscriptionId: "sub_past_due" })
    mockSubsRetrieve.mockResolvedValue({ id: "sub_past_due", status: "past_due", metadata: {} })

    const res = await DELETE(makeReq("client@test.com"), makeParams("client@test.com"))
    expect(res.status).toBe(409)
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it("blocks deletion when linked subscription status is paused", async () => {
    mockGetClient.mockResolvedValue({ email: "client@test.com", stripeSubscriptionId: "sub_paused" })
    mockSubsRetrieve.mockResolvedValue({ id: "sub_paused", status: "paused", metadata: {} })

    const res = await DELETE(makeReq("client@test.com"), makeParams("client@test.com"))
    expect(res.status).toBe(409)
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it("blocks deletion and returns 503 when Stripe is unreachable", async () => {
    mockGetClient.mockResolvedValue({ email: "client@test.com", stripeSubscriptionId: "sub_abc" })
    mockSubsRetrieve.mockRejectedValue(new Error("Network error"))
    // customers.list must also reject to trigger the outer catch
    mockCustomersList.mockRejectedValue(new Error("Network error"))

    const res = await DELETE(makeReq("client@test.com"), makeParams("client@test.com"))
    const body = await res.json() as { code?: string }

    expect(res.status).toBe(503)
    expect(body.code).toBe("stripe_check_failed")
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it("permits deletion when linked subscription is fully canceled", async () => {
    mockGetClient.mockResolvedValue({ email: "client@test.com", stripeSubscriptionId: "sub_canceled" })
    mockSubsRetrieve.mockResolvedValue({ id: "sub_canceled", status: "canceled", metadata: {} })

    const res = await DELETE(makeReq("client@test.com"), makeParams("client@test.com"))
    expect(res.status).toBe(200)
    expect(mockDelete).toHaveBeenCalledWith("client@test.com")
  })

  it("permits deletion when no Stripe subscription exists", async () => {
    mockGetClient.mockResolvedValue({ email: "client@test.com", stripeSubscriptionId: undefined })

    const res = await DELETE(makeReq("client@test.com"), makeParams("client@test.com"))
    expect(res.status).toBe(200)
    expect(mockDelete).toHaveBeenCalledWith("client@test.com")
  })

  it("requires confirm: DELETE in body", async () => {
    const req = new NextRequest("http://localhost/api/admin/coaching/clients/client@test.com", {
      method: "DELETE",
      headers: { Authorization: "Bearer faketoken", "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: "yes" }),
    })
    const res = await DELETE(req, makeParams("client@test.com"))
    expect(res.status).toBe(400)
    expect(mockDelete).not.toHaveBeenCalled()
  })
})
