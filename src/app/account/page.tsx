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

  // Fetch coaching client record for billing section and former-client restart flow.
  // Run for all non-admin users so inactive former clients can see the restart CTA.
  let coachingClient: {
    status?: string | null
    approvedPriceInCents?: number | null
    commitmentType?: string | null
    commitmentMonths?: number | null
    subscriptionStartDate?: string | null
    commitmentNeedsConfirmation?: boolean | null
    stripeSubscriptionId?: string | null
    cancellationScheduledAt?: string | null
    cancellationEffectiveDate?: string | null
    cancellationReason?: string | null
    displayName?: string | null
  } | null = null

  if (!isAdmin) {
    const record = await getCoachingClientRecord(emailStr).catch(() => null)
    if (record) {
      coachingClient = {
        status: record.status ?? null,
        approvedPriceInCents: record.approvedPriceInCents ?? null,
        commitmentType: record.commitmentType ?? null,
        commitmentMonths: record.commitmentMonths ?? null,
        subscriptionStartDate: record.subscriptionStartDate ?? null,
        commitmentNeedsConfirmation: record.commitmentNeedsConfirmation ?? null,
        stripeSubscriptionId: record.stripeSubscriptionId ?? null,
        cancellationScheduledAt: record.cancellationScheduledAt ?? null,
        cancellationEffectiveDate: record.cancellationEffectiveDate ?? null,
        cancellationReason: record.cancellationReason ?? null,
        displayName: record.displayName ?? null,
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
