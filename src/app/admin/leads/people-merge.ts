export type Product = "training" | "nutrition" | "tracker"

export interface ProductAccess {
  product: Product
  grantType: string
}

export interface CoachingClientRecord {
  email: string
  name?: string | null
  startedAt?: string | null
}

export interface MergedRow {
  email: string
  name?: string
  products: ProductAccess[]
  hasCognitoAccount: boolean
  isCoachingClient: boolean
  leadSource: string | null
  leadId: string | null
  createdAt: string
}

export interface CustomerRecord {
  email: string
  product: Product
  grantedAt: string
  grantType: string
}

export interface UserRecord {
  email: string
  createdAt: string
  status: string
}

export interface LeadRecord {
  id: string
  email: string
  name?: string
  source: string
  createdAt: string
}

export function mergePeopleData(
  customers: CustomerRecord[],
  users: UserRecord[],
  leads: LeadRecord[],
  coachingClients: CoachingClientRecord[] = []
): MergedRow[] {
  const map = new Map<string, MergedRow>()

  for (const c of customers) {
    const key = c.email.toLowerCase()
    const access: ProductAccess = { product: c.product, grantType: c.grantType ?? "unknown" }
    const existing = map.get(key)
    if (existing) {
      if (!existing.products.some((p) => p.product === c.product)) {
        existing.products.push(access)
      }
    } else {
      map.set(key, {
        email: c.email,
        products: [access],
        hasCognitoAccount: false,
        isCoachingClient: false,
        leadSource: null,
        leadId: null,
        createdAt: c.grantedAt,
      })
    }
  }

  for (const u of users) {
    const key = u.email.toLowerCase()
    const existing = map.get(key)
    if (existing) {
      existing.hasCognitoAccount = true
      if (!existing.createdAt) existing.createdAt = u.createdAt
    } else {
      map.set(key, {
        email: u.email,
        products: [],
        hasCognitoAccount: true,
        isCoachingClient: false,
        leadSource: null,
        leadId: null,
        createdAt: u.createdAt,
      })
    }
  }

  for (const l of leads) {
    const key = l.email.toLowerCase()
    const existing = map.get(key)
    if (existing) {
      if (!existing.leadSource) {
        existing.leadSource = l.source
        existing.leadId = l.id
        if (l.name) existing.name = l.name
      }
    } else {
      map.set(key, {
        email: l.email,
        name: l.name,
        products: [],
        hasCognitoAccount: false,
        isCoachingClient: false,
        leadSource: l.source,
        leadId: l.id,
        createdAt: l.createdAt,
      })
    }
  }

  for (const c of coachingClients) {
    const key = c.email.toLowerCase()
    const existing = map.get(key)
    if (existing) {
      existing.isCoachingClient = true
      if (c.name && !existing.name) existing.name = c.name
    } else {
      map.set(key, {
        email: c.email,
        name: c.name ?? undefined,
        products: [],
        hasCognitoAccount: false,
        isCoachingClient: true,
        leadSource: null,
        leadId: null,
        createdAt: c.startedAt ?? "",
      })
    }
  }

  return [...map.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}
