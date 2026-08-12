import type { Metadata } from "next"
import { notFound } from "next/navigation"
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

  // Only APPROVED applications with a live Stripe checkout URL can proceed.
  // DECLINED / PENDING / already-PAID applications should not land here.
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
    />
  )
}
