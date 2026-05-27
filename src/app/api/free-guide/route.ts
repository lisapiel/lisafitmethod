import { NextResponse } from "next/server"
import { Resend } from "resend"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb"

function makeDynamo() {
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

async function saveLead(email: string, source: string) {
  try {
    const db = makeDynamo()
    await db.send(new PutCommand({
      TableName: "lfm-leads",
      Item: {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        email,
        source,
        createdAt: new Date().toISOString(),
      },
    }))
  } catch (err) {
    console.error("[FreeGuide] DB save failed:", err)
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as { email?: string; source?: string }
    const email = body.email?.trim().toLowerCase()
    const source = body.source ?? "free-guide-page"

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 })
    }

    await saveLead(email, source)

    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error: resendError } = await resend.emails.send({
      from: "Lisa Fit Method <hello@lisafitmethod.com>",
      to: email,
      subject: "Your free guide is right here",
      html: `
        <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #1a1a1a; background: #faf8f5;">
          <p style="font-size: 11px; font-weight: 500; letter-spacing: 0.28em; text-transform: uppercase; color: #a8895e; margin-bottom: 28px; font-family: Helvetica Neue, Arial, sans-serif;">Lisa Fit Method</p>
          <h1 style="font-family: Georgia, serif; font-size: 26px; font-weight: 700; margin-bottom: 16px; line-height: 1.2; color: #0a0a0a;">Your free preview is ready</h1>
          <p style="font-size: 15px; line-height: 1.72; margin-bottom: 24px; color: #6b6560; font-family: Helvetica Neue, Arial, sans-serif;">The five foundation movements, exact coaching cues, and a real look inside Day A of the 4-week program are all waiting for you:</p>
          <a href="https://lisafitmethod.com/free-guide?unlocked=1" style="display: inline-block; background: #c8a97e; color: #0a0a0a; text-decoration: none; font-family: Helvetica Neue, Arial, sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; padding: 14px 28px; margin-bottom: 32px;">Read the Free Guide</a>
          <p style="font-size: 13px; line-height: 1.7; color: #9c9590; margin-bottom: 8px; font-family: Helvetica Neue, Arial, sans-serif;">When you are ready to go further, the full 4-week Training Foundations course is $47 right now ($97 regular). One payment, lifetime access.</p>
          <p style="font-size: 15px; font-family: Georgia, serif; font-style: italic; color: #a8895e; margin-top: 28px;">Lisa McPherson, CPT</p>
        </div>
      `,
    })

    if (resendError) {
      console.error("[FreeGuide] Resend error:", resendError)
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[FreeGuide] error:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
