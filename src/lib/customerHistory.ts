import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb"
import { getBundlePurchase, getBundleCredit, type CoachingClientRecord, BUNDLE_CREDIT_CENTS } from "./authTokens"

// Read-only customer purchase/history summary for a single email address.
// Resolves per-product access records, coaching client record, and bundle
// purchase from the same DynamoDB records that are the source of truth
// for entitlements — no duplication, no cache, no denormalization.
//
// Callers should treat every field as "may be null" — a missing record
// simply means the customer hasn't purchased that product.

const TABLE = process.env.DYNAMODB_TABLE ?? "lfm-user-progress"

function makeDb() {
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

async function readProductAccess(email: string, keyPrefix: string): Promise<{ purchased: true; grantedAt: string | null } | null> {
  const db = makeDb()
  try {
    const r = await db.send(new GetCommand({
      TableName: TABLE,
      Key: { userId: `${keyPrefix}${email.toLowerCase()}` },
    }))
    if (!r.Item) return null
    const grantedAt = typeof r.Item.grantedAt === "string" ? r.Item.grantedAt : null
    return { purchased: true, grantedAt }
  } catch {
    return null
  }
}

async function readCoachingClient(email: string): Promise<Partial<CoachingClientRecord> | null> {
  const db = makeDb()
  try {
    const r = await db.send(new GetCommand({
      TableName: TABLE,
      Key: { userId: `coaching_client_${email.toLowerCase()}` },
    }))
    return (r.Item as Partial<CoachingClientRecord>) ?? null
  } catch {
    return null
  }
}

export interface ProductPurchase {
  purchased: boolean
  grantedAt: string | null
}
export interface BundleCreditSummary {
  purchased: boolean
  purchasedAt: string | null
  expiresAt: string | null
  usedAt: string | null
  usedForSubscriptionId: string | null
  amountCents: number
  available: boolean         // credit is still redeemable (purchased, not used, not expired)
}
export interface CoachingSummary {
  hasEverEnrolled: boolean
  status: string | null
  approvedPriceInCents: number | null
  commitmentType: string | null
  subscriptionStartDate: string | null
  cancellationDate: string | null
}
export interface CustomerHistory {
  email: string
  training: ProductPurchase
  nutrition: ProductPurchase
  tracker: ProductPurchase
  masterclass: ProductPurchase
  coaching: CoachingSummary
  bundle: BundleCreditSummary
}

const EMPTY_PRODUCT: ProductPurchase = { purchased: false, grantedAt: null }

export async function getCustomerHistory(email: string): Promise<CustomerHistory> {
  const lower = email.toLowerCase()
  const [training, nutrition, tracker, masterclass, coachingClient, bundlePurchase, bundleCredit] = await Promise.all([
    readProductAccess(lower, "training_access_"),
    readProductAccess(lower, "nutrition_access_"),
    readProductAccess(lower, "tracker_access_"),
    readProductAccess(lower, "masterclass_access_"),
    readCoachingClient(lower),
    getBundlePurchase(lower).catch(() => null),
    getBundleCredit(lower).catch(() => null),
  ])

  const coaching: CoachingSummary = coachingClient
    ? {
        hasEverEnrolled: true,
        status: (coachingClient.status as string | undefined) ?? null,
        approvedPriceInCents: (coachingClient.approvedPriceInCents as number | undefined) ?? null,
        commitmentType: (coachingClient.commitmentType as string | undefined) ?? null,
        subscriptionStartDate: (coachingClient.subscriptionStartDate as string | undefined) ?? null,
        cancellationDate: (coachingClient.cancellationEffectiveDate as string | undefined)
          ?? (coachingClient.cancellationScheduledAt as string | undefined)
          ?? null,
      }
    : {
        hasEverEnrolled: false,
        status: null,
        approvedPriceInCents: null,
        commitmentType: null,
        subscriptionStartDate: null,
        cancellationDate: null,
      }

  const bundle: BundleCreditSummary = {
    purchased: !!bundlePurchase,
    purchasedAt: bundlePurchase?.purchasedAt ?? null,
    expiresAt: bundleCredit?.expiresAt ?? null,
    usedAt: bundlePurchase?.bundleCreditUsedAt ?? null,
    usedForSubscriptionId: bundlePurchase?.usedForCoachingSubscriptionId ?? null,
    amountCents: BUNDLE_CREDIT_CENTS,
    available: !!bundleCredit?.available,
  }

  return {
    email: lower,
    training:    training    ?? EMPTY_PRODUCT,
    nutrition:   nutrition   ?? EMPTY_PRODUCT,
    tracker:     tracker     ?? EMPTY_PRODUCT,
    masterclass: masterclass ?? EMPTY_PRODUCT,
    coaching,
    bundle,
  }
}
