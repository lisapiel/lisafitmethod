import type { Metadata } from "next"
import { cookies } from "next/headers"
import { fetchAuthSession } from "aws-amplify/auth/server"
import { runWithAmplifyServerContext } from "@/lib/amplify-server"
import {
  hasTrainingAccess, hasNutritionAccess, hasTrackerAccess,
  hasMasterclassAccess, hasCoachingAccess, isAdminEmail,
  getCoachingClientRecord,
} from "@/lib/authTokens"
import { AccountClient } from "./page.client"

export const metadata: Metadata = {
  title: "My Account — Lisa Fit Method",
}

export const dynamic = "force-dynamic"

export default async function AccountPage() {
  const email = await runWithAmplifyServerContext({
    nextServerContext: { cookies },
    operation: async (contextSpec): Promise<string | null> => {
      try {
        const session = await fetchAuthSession(contextSpec)
        return (session.tokens?.idToken?.payload?.email as string | undefined) ?? null
      } catch {
        return null
      }
    },
  })

  if (!email) {
    return null
  }

  const emailStr = email as string

  const [training, nutrition, tracker, masterclass, coaching] = await Promise.all([
    hasTrainingAccess(emailStr),
    hasNutritionAccess(emailStr),
    hasTrackerAccess(emailStr),
    hasMasterclassAccess(emailStr),
    hasCoachingAccess(emailStr),
  ])

  const isAdmin = isAdminEmail(emailStr)

  // Fetch coaching client record for billing display (only if they have coaching access)
  let coachingClient: {
    approvedPriceInCents?: number | null
    commitmentType?: string | null
    commitmentMonths?: number | null
    subscriptionStartDate?: string | null
    commitmentNeedsConfirmation?: boolean | null
    stripeSubscriptionId?: string | null
    cancellationScheduledAt?: string | null
    cancellationEffectiveDate?: string | null
  } | null = null

  if (coaching && !isAdmin) {
    const record = await getCoachingClientRecord(emailStr).catch(() => null)
    if (record && (record.status === "ACTIVE" || record.cancellationScheduledAt)) {
      coachingClient = {
        approvedPriceInCents: record.approvedPriceInCents ?? null,
        commitmentType: record.commitmentType ?? null,
        commitmentMonths: record.commitmentMonths ?? null,
        subscriptionStartDate: record.subscriptionStartDate ?? null,
        commitmentNeedsConfirmation: record.commitmentNeedsConfirmation ?? null,
        stripeSubscriptionId: record.stripeSubscriptionId ?? null,
        cancellationScheduledAt: record.cancellationScheduledAt ?? null,
        cancellationEffectiveDate: record.cancellationEffectiveDate ?? null,
      }
    }
  }

  return (
    <AccountClient
      email={emailStr}
      training={training}
      nutrition={nutrition}
      tracker={tracker}
      masterclass={masterclass}
      coaching={coaching}
      isAdmin={isAdmin}
      coachingClient={coachingClient}
    />
  )
}
