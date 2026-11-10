import { adminMfaSatisfied } from "@/lib/adminBypass"
import type { Metadata } from "next"
import { cookies } from "next/headers"
import { fetchAuthSession } from "aws-amplify/auth/server"
import { runWithAmplifyServerContext } from "@/lib/amplify-server"
import {
  hasTrainingAccess, hasNutritionAccess, hasTrackerAccess,
  hasMasterclassAccess, hasCoachingAccess, isAdminEmail,
  getCoachingClientRecord,
} from "@/lib/authTokens"
import { findCoachingInvitationForAccount } from "@/lib/coachingInvitation"
import { getAccountLink } from "@/lib/accountLinks"
import { AccountClient } from "./page.client"

export const metadata: Metadata = {
  title: "My Account — Lisa Fit Method",
}

export const dynamic = "force-dynamic"

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ enrolled?: string }>
}) {
  // Stripe sends them straight back here. For the few seconds before the
  // webhook lands, the application still reads APPROVED, and without this the
  // dashboard would invite someone who has just paid to pay again.
  const { enrolled } = await searchParams
  const justPaid = enrolled === "1"
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

  const isAdmin = isAdminEmail(emailStr) && (await adminMfaSatisfied(emailStr))

  // An approved-but-unpaid applicant needs a way back into enrolment that
  // does not depend on still having the email. Without this the dashboard
  // showed them nothing at all — or, before they were reviewed, invited them
  // to apply a second time.
  const sessionSub = await runWithAmplifyServerContext({
    nextServerContext: { cookies },
    operation: async (contextSpec): Promise<string> => {
      try {
        const session = await fetchAuthSession(contextSpec)
        const sub = session.tokens?.idToken?.payload?.sub
        return typeof sub === "string" ? sub : ""
      } catch {
        return ""
      }
    },
  })
  const link = sessionSub ? await getAccountLink(sessionSub).catch(() => null) : null
  const invitation = isAdmin
    ? null
    : await findCoachingInvitationForAccount(emailStr, link?.aliasEmails ?? []).catch(() => null)

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
      invitation={invitation}
      justPaid={justPaid}
    />
  )
}
