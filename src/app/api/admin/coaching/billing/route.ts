import { NextRequest, NextResponse } from "next/server"
import { CognitoIdentityProviderClient, GetUserCommand } from "@aws-sdk/client-cognito-identity-provider"
import Stripe from "stripe"
import { isAdminEmail, getCoachingClientRecord } from "@/lib/authTokens"
import { adminMfaOk } from "@/lib/adminMfa"

export const dynamic = "force-dynamic"

function makeCognito() {
  return new CognitoIdentityProviderClient({
    region: process.env.COGNITO_REGION ?? "us-east-2",
    credentials: {
      accessKeyId: process.env.COGNITO_AWS_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.COGNITO_AWS_SECRET_ACCESS_KEY ?? "",
    },
  })
}

function makeStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY ?? "")
}

async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const auth = req.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) return false
  try {
    const cognito = makeCognito()
    const result = await cognito.send(new GetUserCommand({ AccessToken: auth.slice(7) }))
    const callerEmail = result.UserAttributes?.find((a) => a.Name === "email")?.Value
    return callerEmail != null && isAdminEmail(callerEmail) && adminMfaOk(result)
  } catch {
    return false
  }
}

export interface BillingSubscription {
  id: string
  status: string
  unitAmountCents: number
  interval: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  cancelAt: string | null
  trialEnd: string | null
  source: "checkout" | "manual" | "unknown"
  isPrimary: boolean
  // Discount applied to this subscription (percentage off, 0-100), if any
  discountPercent: number | null
  // The actual amount the next invoice will charge, after any coupon
  effectiveAmountCents: number | null
  warning?: string
}

export interface BillingInvoice {
  id: string
  amountPaidCents: number
  status: string
  paidAt: string | null
  hostedInvoiceUrl: string | null
  number: string | null
}

export interface BillingOverview {
  email: string
  accessType: "paid" | "complimentary" | "unknown"
  stripeCustomerId: string | null
  subscriptions: BillingSubscription[]
  multipleActiveWarning: boolean
  invoices: BillingInvoice[]
  linkedSubscriptionId: string | null
  approvedPriceInCents: number | null
  commitmentType: string | null
  commitmentMonths: number | null
  subscriptionStartDate: string | null
  cancellationScheduledAt: string | null
  cancellationEffectiveDate: string | null
  // When the linked subscription was under a different Stripe customer than the
  // email search, we note it here so the UI can show it clearly.
  invoiceCoverageNote?: string
}

function extractDiscount(sub: Stripe.Subscription): { discountPercent: number | null; effectiveAmountCents: number | null } {
  const item = sub.items.data[0]
  const baseAmount = item?.price?.unit_amount ?? 0

  // Stripe v22: discounts are an array on the subscription
  const discounts = (sub as { discounts?: Array<{ coupon?: { percent_off?: number } }> }).discounts
  if (discounts && discounts.length > 0) {
    const pct = discounts[0]?.coupon?.percent_off ?? null
    if (pct != null && pct > 0) {
      return {
        discountPercent: pct,
        effectiveAmountCents: Math.round(baseAmount * (1 - pct / 100)),
      }
    }
  }
  return { discountPercent: null, effectiveAmountCents: null }
}

function subFromStripe(
  sub: Stripe.Subscription,
  isPrimary: boolean,
  source: "checkout" | "manual" | "unknown"
): BillingSubscription {
  const item = sub.items.data[0]
  const unitAmount = item?.price?.unit_amount ?? 0
  const interval = item?.price?.recurring?.interval ?? "month"
  // current_period_end is on SubscriptionItem in Stripe v22, not on Subscription
  const periodEnd = item?.current_period_end ?? 0
  const { discountPercent, effectiveAmountCents } = extractDiscount(sub)

  return {
    id: sub.id,
    status: sub.status,
    unitAmountCents: unitAmount,
    interval,
    currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : new Date().toISOString(),
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    cancelAt: sub.cancel_at ? new Date(sub.cancel_at * 1000).toISOString() : null,
    trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
    source,
    isPrimary,
    discountPercent,
    effectiveAmountCents,
  }
}

async function fetchInvoicesForCustomer(
  stripe: Stripe,
  customerId: string,
  subIds: Set<string>
): Promise<BillingInvoice[]> {
  const result: BillingInvoice[] = []
  const invoiceList = await stripe.invoices.list({ customer: customerId, limit: 10 }).catch(() => ({ data: [] }))

  for (const inv of invoiceList.data) {
    // Stripe v22: subscription ID is under parent.subscription_details.subscription
    const invSubId =
      (typeof inv.parent?.subscription_details?.subscription === "string"
        ? inv.parent.subscription_details.subscription
        : (inv.parent?.subscription_details?.subscription as { id?: string } | null | undefined)?.id) ?? null

    // Only include invoices that belong to one of our known coaching subscriptions,
    // or invoices with no subscription association (e.g. one-time charges)
    if (invSubId && !subIds.has(invSubId)) continue

    result.push({
      id: inv.id,
      amountPaidCents: inv.amount_paid,
      status: inv.status ?? "unknown",
      paidAt: inv.status_transitions?.paid_at
        ? new Date(inv.status_transitions.paid_at * 1000).toISOString()
        : null,
      hostedInvoiceUrl: inv.hosted_invoice_url ?? null,
      number: inv.number ?? null,
    })
  }
  return result
}

// GET /api/admin/coaching/billing?email=xxx
export async function GET(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase() ?? ""
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 })

  const client = await getCoachingClientRecord(email).catch(() => null)
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 })

  const stripe = makeStripe()

  // Find Stripe customers by email. There may be more than one due to manual creation.
  const customerList = await stripe.customers.list({ email, limit: 10 }).catch(() => ({ data: [] }))
  const emailCustomerIds = new Set(customerList.data.map((c) => c.id))
  const stripeCustomerId = customerList.data[0]?.id ?? null

  const allSubscriptions: BillingSubscription[] = []
  // Track which customer IDs own subscriptions we've found — for invoice fetching
  const subToCustomer = new Map<string, string>()

  // 1. Search all customers matching this email, paginating through subscriptions
  for (const customer of customerList.data) {
    let startingAfter: string | undefined
    do {
      const page = await stripe.subscriptions.list({
        customer: customer.id,
        status: "all",
        limit: 100,
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      })

      for (const sub of page.data) {
        if (sub.metadata?.product !== "coaching") continue
        // Skip cleanly cancelled subs (canceled, no pending cancel_at)
        if (sub.status === "canceled" && !sub.cancel_at) continue

        const source: "checkout" | "manual" | "unknown" =
          sub.metadata?.customerEmail ? "checkout"
          : sub.id === client.stripeSubscriptionId ? "manual"
          : "unknown"

        const isPrimary =
          sub.id === client.stripeSubscriptionId ||
          (!client.stripeSubscriptionId && allSubscriptions.length === 0)

        allSubscriptions.push(subFromStripe(sub, isPrimary, source))
        subToCustomer.set(sub.id, customer.id)
      }

      startingAfter = page.has_more ? page.data[page.data.length - 1]?.id : undefined
    } while (startingAfter)
  }

  // 2. Direct lookup for the stored stripeSubscriptionId — catches manually linked subs
  //    that belong to a Stripe customer with a different email address.
  //    We do NOT require metadata.product === "coaching" here because we explicitly
  //    stored this ID ourselves. If the metadata is missing (older manual sub), we still
  //    want to surface it rather than silently ignore a billing relationship we know about.
  let linkedSubCustomerId: string | null = null
  let invoiceCoverageNote: string | undefined
  if (client.stripeSubscriptionId) {
    const alreadyFound = allSubscriptions.some((s) => s.id === client.stripeSubscriptionId)
    if (!alreadyFound) {
      const sub = await stripe.subscriptions.retrieve(client.stripeSubscriptionId).catch(() => null)
      if (sub) {
        allSubscriptions.push(subFromStripe(sub, true, "manual"))
        // The customer owning this sub is different from the email-matched customers
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id
        subToCustomer.set(sub.id, customerId)
        linkedSubCustomerId = customerId
        if (!emailCustomerIds.has(customerId)) {
          invoiceCoverageNote = `Linked subscription (${sub.id}) is under Stripe customer ${customerId}, which does not match the email search. Invoices shown include both customers.`
        }
      }
    }
  }

  // Sort: primary first, then by status priority, then by period end desc
  allSubscriptions.sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1
    const statusOrder = ["active", "trialing", "past_due", "unpaid", "paused", "canceled"]
    const ai = statusOrder.indexOf(a.status), bi = statusOrder.indexOf(b.status)
    if (ai !== bi) return ai - bi
    return b.currentPeriodEnd.localeCompare(a.currentPeriodEnd)
  })

  const activeSubs = allSubscriptions.filter((s) =>
    ["active", "trialing", "past_due", "unpaid"].includes(s.status)
  )
  const multipleActiveWarning = activeSubs.length > 1
  if (multipleActiveWarning) {
    activeSubs.forEach((s) => { s.warning = "Multiple active subscriptions — only one should be active at a time" })
  }

  // 3. Fetch invoices from all relevant Stripe customers.
  //    - All email-matched customers
  //    - The customer owning the linked subscription (if different)
  const subIds = new Set(allSubscriptions.map((s) => s.id))
  const invoiceCustomers = new Set([...emailCustomerIds])
  if (linkedSubCustomerId) invoiceCustomers.add(linkedSubCustomerId)

  const invoiceMap = new Map<string, BillingInvoice>()
  for (const customerId of invoiceCustomers) {
    const batch = await fetchInvoicesForCustomer(stripe, customerId, subIds)
    for (const inv of batch) {
      if (!invoiceMap.has(inv.id)) invoiceMap.set(inv.id, inv)
    }
  }
  const invoices = Array.from(invoiceMap.values())
    .sort((a, b) => (b.paidAt ?? "").localeCompare(a.paidAt ?? ""))

  const overview: BillingOverview = {
    email,
    accessType: (client as { accessType?: "paid" | "complimentary" }).accessType ?? "unknown",
    stripeCustomerId,
    subscriptions: allSubscriptions,
    multipleActiveWarning,
    invoices,
    linkedSubscriptionId: client.stripeSubscriptionId ?? null,
    approvedPriceInCents: client.approvedPriceInCents ?? null,
    commitmentType: client.commitmentType ?? null,
    commitmentMonths: client.commitmentMonths ?? null,
    subscriptionStartDate: client.subscriptionStartDate ?? null,
    cancellationScheduledAt: client.cancellationScheduledAt ?? null,
    cancellationEffectiveDate: client.cancellationEffectiveDate ?? null,
    ...(invoiceCoverageNote ? { invoiceCoverageNote } : {}),
  }

  return NextResponse.json({ ok: true, billing: overview })
}
