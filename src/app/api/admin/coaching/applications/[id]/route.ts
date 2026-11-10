import { NextRequest, NextResponse } from "next/server"
import {
  CognitoIdentityProviderClient,
  GetUserCommand,
} from "@aws-sdk/client-cognito-identity-provider"
import { Resend } from "resend"
import {
  isAdminEmail,
  getCoachingApplication,
  updateCoachingApplication,
  createCoachingClientRecord,
  type CommitmentType,
} from "@/lib/authTokens"
import { adminMfaOk } from "@/lib/adminMfa"
import { generateInvitationToken, storeInvitationToken } from "@/lib/invitationTokens"
import { readBundleCreditChoice, saveBundleCreditChoice } from "@/lib/bundleCreditStore"
import { checkoutTermsKey, retireCheckoutIfTermsChanged } from "@/lib/coachingCheckout"

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

async function verifyAdmin(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) return null
  try {
    const cognito = makeCognito()
    const result = await cognito.send(new GetUserCommand({ AccessToken: auth.slice(7) }))
    const callerEmail = result.UserAttributes?.find((a) => a.Name === "email")?.Value
    return callerEmail != null && isAdminEmail(callerEmail) && adminMfaOk(result) ? callerEmail : null
  } catch {
    return null
  }
}

function approvalEmail(name: string, checkoutUrl: string): string {
  const firstName = name.split(" ")[0]
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f5f2ee;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f2ee;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
        <tr><td align="center" style="padding-bottom:32px;">
          <span style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:600;color:#1a1a1a;letter-spacing:0.04em;">
            Lisa <span style="color:#c8a97e;">Fit Method</span>
          </span>
        </td></tr>
        <tr><td style="background:#fff;padding:44px 40px;border-radius:4px;border-left:4px solid #c8a97e;">
          <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr>
              <td style="width:56px;vertical-align:middle;">
                <img src="https://lisafitmethod.com/lisa-email.jpg" alt="Lisa" width="48" height="48" style="width:48px;height:48px;border-radius:50%;object-fit:cover;display:block;" />
              </td>
              <td style="padding-left:14px;vertical-align:middle;">
                <p style="margin:0;font-size:14px;font-weight:600;color:#1a1a1a;">Lisa McPherson</p>
                <p style="margin:2px 0 0;font-size:12px;color:#888;">Certified Personal Trainer</p>
              </td>
            </tr>
          </table>
          <p style="margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:0.25em;text-transform:uppercase;color:#c8a97e;">Coaching</p>
          <h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:#1a1a1a;line-height:1.3;">
            You're in, ${firstName}!
          </h1>
          <p style="margin:0 0 18px;font-size:15px;color:#4a4a4a;line-height:1.7;">
            I just finished reading your application and I'd love to work with you :)
          </p>
          <p style="margin:0 0 18px;font-size:15px;color:#4a4a4a;line-height:1.7;">
            You already have a goal. My job now is to help you turn it into a plan that actually makes sense for you, your schedule, your experience, your equipment, and where you're starting from.
          </p>
          <p style="margin:0 0 18px;font-size:15px;color:#4a4a4a;line-height:1.7;">
            No random workouts and no guessing what you should be doing next. I'll give your training structure and make sure the work you're putting in is actually moving you forward.
          </p>
          <p style="margin:0 0 32px;font-size:15px;color:#4a4a4a;line-height:1.7;">
            Use the link below to review your coaching details and get everything set up. Once your payment goes through, I'll start building your program and you'll get access to your coaching portal.
          </p>
          <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr>
              <td style="background:#c8a97e;border-radius:2px;">
                <a href="${checkoutUrl}" style="display:inline-block;padding:16px 32px;font-size:12px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#0a0a0a;text-decoration:none;">Complete Enrollment &rarr;</a>
              </td>
            </tr>
          </table>
          <p style="margin:0 0 6px;font-size:14px;color:#4a4a4a;line-height:1.7;">
            If you have any questions before you start, just reply. This inbox comes straight to me.
          </p>
          <p style="margin:20px 0 0;font-size:14px;color:#4a4a4a;font-family:Georgia,'Times New Roman',serif;font-style:italic;">
            Lisa
          </p>
        </td></tr>
        <tr><td align="center" style="padding-top:24px;">
          <p style="margin:0;font-size:11px;color:#aaa;">Lisa Fit Method · lisafitmethod.com</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function declineEmail(name: string): string {
  const firstName = name.split(" ")[0]
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#f5f2ee;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f2ee;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
        <tr><td align="center" style="padding-bottom:32px;">
          <span style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:600;color:#1a1a1a;">
            Lisa <span style="color:#c8a97e;">Fit Method</span>
          </span>
        </td></tr>
        <tr><td style="background:#fff;padding:44px 40px;border-radius:4px;">
          <p style="margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:0.25em;text-transform:uppercase;color:#c8a97e;">1:1 Coaching</p>
          <h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:400;color:#1a1a1a;line-height:1.3;">
            Thank you for applying, ${firstName}
          </h1>
          <p style="margin:0 0 20px;font-size:15px;color:#4a4a4a;line-height:1.7;">
            Thank you so much for your interest in 1:1 coaching. Unfortunately I'm at capacity right now and I'm not able to take on new clients at this time.
          </p>
          <p style="margin:0 0 20px;font-size:15px;color:#4a4a4a;line-height:1.7;">
            I'll keep your application on file and reach out if a spot opens up. In the meantime, my courses are available at
            <a href="https://lisafitmethod.com" style="color:#c8a97e;">lisafitmethod.com</a>.
          </p>
          <p style="margin:0;font-size:15px;color:#1a1a1a;line-height:1.7;">
            <span style="font-family:Georgia,'Times New Roman',serif;font-size:17px;color:#c8a97e;">Lisa</span>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminEmail = await verifyAdmin(req)
  if (!adminEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json() as {
    action: "approve" | "decline"
    priceInCents?: number
    commitmentType?: CommitmentType
    applyBundleCredit?: boolean
  }

  const application = await getCoachingApplication(id)
  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY ?? "")

  if (body.action === "decline") {
    await updateCoachingApplication(id, {
      status: "DECLINED",
      reviewedAt: new Date().toISOString(),
    })
    await resend.emails.send({
      from: "Lisa Fit Method <noreply@lisafitmethod.com>",
      replyTo: "contact@lisafitmethod.com",
      to: application.email,
      subject: "Your coaching application | Lisa Fit Method",
      html: declineEmail(application.name),
    }).catch((err) => console.error("Decline email failed:", err))
    return NextResponse.json({ ok: true, status: "DECLINED" })
  }

  if (body.action === "approve") {
    const priceInCents = body.priceInCents
    if (!priceInCents || priceInCents < 100) {
      return NextResponse.json({ error: "Monthly price is required (minimum $1.00)" }, { status: 400 })
    }
    const commitmentType = body.commitmentType
    if (!commitmentType || !["THREE_MONTH_MINIMUM", "MONTH_TO_MONTH"].includes(commitmentType)) {
      return NextResponse.json({ error: "Commitment type is required" }, { status: 400 })
    }

    // Lisa's bundle-credit tick-box, tied to the price she approved. Checkout
    // re-runs the rules from it, so a credit she turned off is never added and
    // one she turned on is still only applied if the client qualifies. Saved
    // first, so a failure here leaves the application untouched.
    if (typeof body.applyBundleCredit === "boolean") {
      await saveBundleCreditChoice(id, {
        apply: body.applyBundleCredit,
        priceCents: priceInCents,
        decidedAt: new Date().toISOString(),
        decidedBy: adminEmail,
      })
    }

    // A checkout already opened on the previous terms is closed, so the old
    // price or credit can't be paid from a tab left open. Checkout also
    // refuses to reuse it, so a failure here is only logged.
    const creditChoice = await readBundleCreditChoice(id, priceInCents).catch(() => null)
    await retireCheckoutIfTermsChanged(application, checkoutTermsKey({ priceCents: priceInCents, commitmentType, creditChoice }))
      .then((outcome) => {
        if (outcome === "unknown") console.error(`Couldn't close the earlier checkout for application ${id}`)
      })
      .catch((err) => console.error("retireCheckoutIfTermsChanged failed:", err))

    // No account is created here any more. Approval used to silently mint a
    // Cognito user for the application address with a suppressed random
    // password, which produced accounts nobody could ever sign in to — and a
    // second account for anyone who applied under a different address from the
    // one their courses were on. The applicant now chooses how to get a login
    // on the acceptance page: sign in to the account they already have, or ask
    // for a set-password link.

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lisafitmethod.com"

    // The Stripe Checkout Session is NOT created here. Stripe expires a
    // session 24 hours after it is made, and freezing its URL onto the
    // application turned every approval into a 24-hour offer: anyone who paid
    // later landed on "You're all done here", which reads as though they had
    // already paid. The session is minted when someone actually goes to pay,
    // and the approved terms below are what it is built from.

    // Create client record now so admin can see and prep program before payment completes.
    // Store approved business terms immediately so the acceptance interstitial can read them.
    await createCoachingClientRecord({
      email: application.email,
      displayName: application.name,
      status: "PENDING_PAYMENT",
      goal: application.goals || undefined,
      approvedPriceInCents: priceInCents,
      commitmentType,
      commitmentMonths: commitmentType === "THREE_MONTH_MINIMUM" ? 3 : 0,
    }).catch((err) => console.error("createCoachingClientRecord failed:", err))

    await updateCoachingApplication(id, {
      status: "APPROVED",
      reviewedAt: new Date().toISOString(),
      approvedPriceInCents: priceInCents,
      approvedCommitmentType: commitmentType,
    })

    // Send the applicant to our /coaching/accept/[id] interstitial (which
    // collects the two required acknowledgements) rather than directly to
    // Stripe. The interstitial reads the stripeCheckoutUrl we just wrote to
    // the application record and redirects there after acceptance.
    // The link carries a single-use token. That is what lets someone with no
    // account choose a password on the spot instead of being sent a second
    // email, and what proves — to anyone whose courses are under a different
    // address — that they are the person the offer was made to.
    const inviteToken = generateInvitationToken()
    await storeInvitationToken({ token: inviteToken, applicationId: id, email: application.email })
    const acceptUrl = `${baseUrl}/coaching/accept/${id}?t=${inviteToken}`

    await resend.emails.send({
      from: "Lisa Fit Method <noreply@lisafitmethod.com>",
      replyTo: "contact@lisafitmethod.com",
      to: application.email,
      subject: "You're approved for coaching",
      html: approvalEmail(application.name, acceptUrl),
    }).catch((err) => console.error("Approval email failed:", err))

    return NextResponse.json({ ok: true, status: "APPROVED", acceptUrl })
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}
