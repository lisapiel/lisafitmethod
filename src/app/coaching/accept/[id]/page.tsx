import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import {
  CognitoIdentityProviderClient,
  AdminGetUserCommand,
} from "@aws-sdk/client-cognito-identity-provider"
import { getCoachingApplication } from "@/lib/authTokens"
import { getSessionUser } from "@/lib/sessionUser"
import { applicationOwnerEmail, resolveInvitationAccess } from "@/lib/coachingInvitation"
import { checkInvitationToken } from "@/lib/invitationTokens"
import AcceptClient from "./page.client"
import AcceptGate from "./AcceptGate.client"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Complete your enrolment — 1:1 Coaching | Lisa Fit Method",
  robots: { index: false, follow: false },
}

// Does this address already have a password it can sign in with? Decides
// between offering sign-in and offering to set one.
async function hasConfirmedLogin(email: string): Promise<boolean> {
  try {
    const cognito = new CognitoIdentityProviderClient({
      region: process.env.COGNITO_REGION ?? "us-east-2",
      credentials: {
        accessKeyId: process.env.COGNITO_AWS_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.COGNITO_AWS_SECRET_ACCESS_KEY ?? "",
      },
    })
    const user = await cognito.send(new AdminGetUserCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID ?? "",
      Username: email,
    }))
    return user.UserStatus === "CONFIRMED"
  } catch {
    return false
  }
}

// The invitation is the application record, and it does not expire: an
// approved offer stays open until it is declined or paid, so an approval email
// opened weeks later still works. What the link carries alongside it is a
// single-use token, and that is only ever needed to do one of two things —
// set a first password, or attach the invitation to a different account.
export default async function AcceptPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ t?: string }>
}) {
  const { id } = await params
  const { t } = await searchParams
  const application = await getCoachingApplication(id)
  if (!application) notFound()

  if (application.status === "PAID") {
    redirect("/account?enrolled=1")
  }
  if (application.status !== "APPROVED") {
    notFound()
  }

  const invitedEmail = application.email
  const ownerEmail = applicationOwnerEmail(application)
  const firstName = application.name.split(" ")[0] || "there"
  const tokenState = await checkInvitationToken(t, id)
  const hasToken = tokenState.valid

  const user = await getSessionUser()

  if (!user) {
    // No account yet and they came from the email: let them choose a password
    // here rather than sending them back to their inbox for a second message.
    const confirmed = await hasConfirmedLogin(ownerEmail)
    return (
      <AcceptGate
        variant={hasToken && !confirmed ? "set-password" : "signed-out"}
        applicationId={id}
        firstName={firstName}
        invitedEmail={ownerEmail}
        token={hasToken ? t : undefined}
        hasAccount={confirmed}
      />
    )
  }

  const access = await resolveInvitationAccess(application, user)

  if (access === "linkable") {
    return (
      <AcceptGate
        variant={hasToken ? "link" : "link-needs-token"}
        applicationId={id}
        firstName={firstName}
        invitedEmail={invitedEmail}
        sessionEmail={user.email}
        token={hasToken ? t : undefined}
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
