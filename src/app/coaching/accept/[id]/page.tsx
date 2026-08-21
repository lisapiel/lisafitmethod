import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { getCoachingApplication } from "@/lib/authTokens"
import AcceptClient from "./page.client"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Confirm & continue — 1:1 Coaching | Lisa Fit Method",
  robots: { index: false, follow: false },
}

export default async function AcceptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const application = await getCoachingApplication(id)
  if (!application) notFound()

  // Already-paid: the interstitial has served its purpose. Send the client
  // to their coaching portal so a click on the original approval email
  // after payment can't dead-end at a 404. /my-coaching's layout will
  // route the client through /login?redirect=/my-coaching if they aren't
  // signed in yet, then straight into the portal after auth.
  if (application.status === "PAID") {
    redirect("/my-coaching")
  }

  // Only APPROVED applications with a live Stripe checkout URL can proceed.
  // DECLINED / PENDING applications shouldn't land here.
  if (application.status !== "APPROVED" || !application.stripeCheckoutUrl) {
    notFound()
  }

  return (
    <AcceptClient
      applicationId={application.id}
      applicantName={application.name}
      applicantEmail={application.email}
      coachingOption={application.coachingOption ?? null}
      checkoutUrl={application.stripeCheckoutUrl}
      approvedPriceInCents={application.approvedPriceInCents ?? null}
      approvedCommitmentType={application.approvedCommitmentType ?? null}
    />
  )
}
