import { mergePeopleData } from "./people-merge"
import type { CustomerRecord, UserRecord, LeadRecord, CoachingClientRecord } from "./people-merge"

const C = (overrides: Partial<CustomerRecord> = {}): CustomerRecord => ({
  email: "a@test.com",
  product: "training",
  grantedAt: "2026-11-01T00:00:00.000Z",
  grantType: "purchase",
  ...overrides,
})
const U = (overrides: Partial<UserRecord> = {}): UserRecord => ({
  email: "a@test.com",
  createdAt: "2026-10-01T00:00:00.000Z",
  status: "CONFIRMED",
  ...overrides,
})
const L = (overrides: Partial<LeadRecord> = {}): LeadRecord => ({
  id: "lead-1",
  email: "a@test.com",
  source: "free-guide",
  createdAt: "2026-09-01T00:00:00.000Z",
  ...overrides,
})
const CC = (overrides: Partial<CoachingClientRecord> = {}): CoachingClientRecord => ({
  email: "a@test.com",
  name: "Test Client",
  startedAt: "2026-10-15T00:00:00.000Z",
  ...overrides,
})

describe("mergePeopleData", () => {
  it("returns empty array for empty inputs", () => {
    expect(mergePeopleData([], [], [])).toEqual([])
  })

  it("customer with grantType purchase qualifies for Purchasers filter", () => {
    const rows = mergePeopleData([C({ grantType: "purchase" })], [], [])
    expect(rows[0].products[0].grantType).toBe("purchase")
    expect(rows[0].products.some((p) => p.grantType === "purchase")).toBe(true)
  })

  it("customer with grantType admin does not qualify for Purchasers filter", () => {
    const rows = mergePeopleData([C({ grantType: "admin" })], [], [])
    expect(rows[0].products[0].grantType).toBe("admin")
    expect(rows[0].products.some((p) => p.grantType === "purchase")).toBe(false)
  })

  it("customer with undefined grantType gets unknown", () => {
    const rows = mergePeopleData([C({ grantType: undefined as unknown as string })], [], [])
    expect(rows[0].products[0].grantType).toBe("unknown")
  })

  it("customer alone has hasCognitoAccount false", () => {
    const rows = mergePeopleData([C()], [], [])
    expect(rows[0].hasCognitoAccount).toBe(false)
  })

  it("user alone has empty products and hasCognitoAccount true", () => {
    const rows = mergePeopleData([], [U({ email: "u@test.com" })], [])
    expect(rows[0].products).toHaveLength(0)
    expect(rows[0].hasCognitoAccount).toBe(true)
  })

  it("lead alone has empty products and hasCognitoAccount false", () => {
    const rows = mergePeopleData([], [], [L({ email: "l@test.com" })])
    expect(rows[0].products).toHaveLength(0)
    expect(rows[0].hasCognitoAccount).toBe(false)
    expect(rows[0].leadSource).toBe("free-guide")
  })

  it("customer + user for same email sets hasCognitoAccount true", () => {
    const rows = mergePeopleData([C()], [U()], [])
    expect(rows[0].hasCognitoAccount).toBe(true)
    expect(rows[0].products).toHaveLength(1)
  })

  it("merges all three sources for the same email into one row", () => {
    const rows = mergePeopleData([C()], [U()], [L()])
    expect(rows).toHaveLength(1)
    expect(rows[0].hasCognitoAccount).toBe(true)
    expect(rows[0].products[0].product).toBe("training")
    expect(rows[0].leadSource).toBe("free-guide")
  })

  it("deduplicates product entries: second record for same product is dropped", () => {
    const rows = mergePeopleData(
      [C({ grantType: "purchase" }), C({ grantType: "admin" })],
      [],
      []
    )
    expect(rows[0].products).toHaveLength(1)
  })

  it("normalizes email case for deduplication", () => {
    const rows = mergePeopleData(
      [C({ email: "X@TEST.COM" })],
      [U({ email: "x@test.com" })],
      []
    )
    expect(rows).toHaveLength(1)
    expect(rows[0].hasCognitoAccount).toBe(true)
  })

  it("sorts results by createdAt descending", () => {
    const rows = mergePeopleData(
      [],
      [
        U({ email: "early@test.com", createdAt: "2026-09-01T00:00:00.000Z" }),
        U({ email: "late@test.com", createdAt: "2026-11-01T00:00:00.000Z" }),
      ],
      []
    )
    expect(rows[0].email).toBe("late@test.com")
    expect(rows[1].email).toBe("early@test.com")
  })

  it("multi-product customer gets separate ProductAccess per product", () => {
    const rows = mergePeopleData(
      [C({ product: "training" }), C({ product: "nutrition" })],
      [],
      []
    )
    expect(rows[0].products).toHaveLength(2)
    expect(rows[0].products.map((p) => p.product).sort()).toEqual(["nutrition", "training"])
  })

  it("customer alone has isCoachingClient false by default", () => {
    const rows = mergePeopleData([C()], [], [])
    expect(rows[0].isCoachingClient).toBe(false)
  })

  it("coaching client alone has isCoachingClient true", () => {
    const rows = mergePeopleData([], [], [], [CC({ email: "coach@test.com" })])
    expect(rows[0].isCoachingClient).toBe(true)
    expect(rows[0].email).toBe("coach@test.com")
  })

  it("coaching client merged with existing customer sets isCoachingClient true", () => {
    const rows = mergePeopleData([C()], [], [], [CC()])
    expect(rows).toHaveLength(1)
    expect(rows[0].isCoachingClient).toBe(true)
    expect(rows[0].products).toHaveLength(1)
  })

  it("coaching client name fills in when existing row has no name", () => {
    const rows = mergePeopleData([C()], [], [], [CC({ name: "Jane Smith" })])
    expect(rows[0].name).toBe("Jane Smith")
  })

  it("coaching client name does not overwrite existing name", () => {
    const rows = mergePeopleData([], [], [L({ name: "Existing Name" })], [CC({ name: "Other Name" })])
    expect(rows[0].name).toBe("Existing Name")
  })

  it("coaching client uses startedAt as createdAt when no prior record", () => {
    const rows = mergePeopleData([], [], [], [CC({ email: "new@test.com", startedAt: "2026-11-01T00:00:00.000Z" })])
    expect(rows[0].createdAt).toBe("2026-11-01T00:00:00.000Z")
  })

  it("empty coaching clients arg leaves all rows with isCoachingClient false", () => {
    const rows = mergePeopleData([C()], [U()], [L()])
    expect(rows.every((r) => r.isCoachingClient === false)).toBe(true)
  })
})
