import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { getCoachingApplication } from "@/lib/authTokens"
import { getSessionUser } from "@/lib/sessionUser"
import { applicationOwnerEmail, resolveInvitationAccess } from "@/lib/coachingInvitation"
import AcceptClient from "./page.client"
import AcceptGate from "./AcceptGate.client"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Confirm & continue — 1:1 Coaching | Lisa Fit Method",
  robots: { index: false, follow: false },
}

// The invitation, and the only thing that decides whether it is still good,
// is the application record. It has no expiry: an approved offer stays open
// until it is declined or paid, so an approval email opened weeks later still
// works. What used to gate this page was the presence of a Stripe checkout
// URL minted at approval time, which quietly turned every invitation into a
// 24-hour one.
export default async function AcceptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const application = await getCoachingApplication(id)
  if (!application) notFound()

  if (application.status === "PAID") {
    redirect("/my-coaching")
  }
  if (application.status !== "APPROVED") {
    notFound()
  }

  const invitedEmail = application.email
  const ownerEmail = applicationOwnerEmail(application)
  const firstName = application.name.split(" ")[0] || "there"

  // Signing in is now required before the acknowledgements can be made. They
  // are a legal record naming a person, and this page was reachable by anyone
  // holding the link.
  const user = await getSessionUser()
  if (!user) {
    return (
      <AcceptGate
        variant="signed-out"
        applicationId={id}
        firstName={firstName}
        invitedEmail={invitedEmail}
      />
    )
  }

  const access = await resolveInvitationAccess(application, user)

  if (access === "linkable") {
    return (
      <AcceptGate
        variant="link"
        applicationId={id}
        firstName={firstName}
        invitedEmail={invitedEmail}
        sessionEmail={user.email}
      />
    )
  }

  if (access === "foreign") {
    return (
      <AcceptGate
        variant="foreign"
        applicationId={id}
        firstName={firstName}
        invitedEmail={ownerEmail}
        sessionEmail={user.email}
      />
    )
  }

  return (
    <AcceptClient
      applicationId={application.id}
      applicantName={application.name}
      accountEmail={user.email}
      approvedPriceInCents={application.approvedPriceInCents ?? null}
      approvedCommitmentType={application.approvedCommitmentType ?? null}
    />
  )
}
