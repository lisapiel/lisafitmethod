import { NextRequest, NextResponse } from "next/server"
import {
  CognitoIdentityProviderClient,
  AdminGetUserCommand,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  UsernameExistsException,
} from "@aws-sdk/client-cognito-identity-provider"
import { getCoachingApplication } from "@/lib/authTokens"
import { checkInvitationToken, consumeInvitationToken } from "@/lib/invitationTokens"
import { applicationOwnerEmail } from "@/lib/coachingInvitation"

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

// Turns "I opened the approval email" into a login, in one step and without
// sending anything else to the inbox.
//
// The account is created here rather than at approval time. Approval used to
// create one for the application address and suppress the message, which left
// accounts nobody had credentials for — and a second account for anyone whose
// courses were under a different address. Nothing exists until the person
// actually arrives and sets a password.
export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const b = body as { applicationId?: string; token?: string; password?: string }
  const applicationId = b.applicationId?.trim() ?? ""
  const token = b.token?.trim() ?? ""
  const password = b.password ?? ""

  if (!applicationId || !token) {
    return NextResponse.json({ error: "Missing invitation details" }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 })
  }

  const application = await getCoachingApplication(applicationId)
  if (!application) return NextResponse.json({ error: "Application not found" }, { status: 404 })
  if (application.status !== "APPROVED") {
    return NextResponse.json({ error: "This application is not open for enrolment" }, { status: 403 })
  }

  const email = applicationOwnerEmail(application)
  // Check the link before saying anything about the account, so an application id
  // alone never reveals whether this address already has a login.
  const peek = await checkInvitationToken(token, applicationId)
  if (!peek.valid || peek.token.email !== email) {
    return NextResponse.json({ error: "This setup link has already been used or has expired." }, { status: 403 })
  }
  const cognito = makeCognito()
  const pool = process.env.COGNITO_USER_POOL_ID ?? ""

  // A confirmed account already has a password; this route must never be a way
  // to overwrite one. Those visitors sign in instead.
  let existingStatus: string | undefined
  try {
    const user = await cognito.send(new AdminGetUserCommand({ UserPoolId: pool, Username: email }))
    existingStatus = user.UserStatus
  } catch {
    existingStatus = undefined
  }
  if (existingStatus === "CONFIRMED") {
    return NextResponse.json(
      { error: "This address already has a login. Please sign in instead.", signInInstead: true },
      { status: 409 },
    )
  }

  // Spend the token before touching the account, so a racing second request
  // cannot also set a password.
  const spent = await consumeInvitationToken(token, applicationId, "password-setup")
  if (!spent.valid) {
    return NextResponse.json({ error: "This setup link has already been used or has expired.", reason: spent.reason }, { status: 403 })
  }
  if (spent.token.email !== email) {
    return NextResponse.json({ error: "This link does not match the invitation" }, { status: 403 })
  }

  if (!existingStatus) {
    try {
      await cognito.send(new AdminCreateUserCommand({
        UserPoolId: pool,
        Username: email,
        UserAttributes: [
          { Name: "email", Value: email },
          { Name: "email_verified", Value: "true" },
        ],
        MessageAction: "SUPPRESS",
      }))
    } catch (err) {
      if (!(err instanceof UsernameExistsException)) {
        console.error("claim: AdminCreateUser failed", err)
        return NextResponse.json({ error: "Could not create the account" }, { status: 500 })
      }
    }
  }

  try {
    await cognito.send(new AdminSetUserPasswordCommand({
      UserPoolId: pool,
      Username: email,
      Password: password,
      Permanent: true,
    }))
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("claim: AdminSetUserPassword failed", msg)
    return NextResponse.json(
      { error: "Password must be at least 8 characters and include an uppercase and a lowercase letter." },
      { status: 400 },
    )
  }

  return NextResponse.json({ ok: true, email })
}
