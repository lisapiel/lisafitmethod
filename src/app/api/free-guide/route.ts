import { NextResponse } from "next/server"
import { Resend } from "resend"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb"

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
    const existing = await db.send(new ScanCommand({
      TableName: "lfm-leads",
      FilterExpression: "email = :e AND #src = :s",
      ExpressionAttributeNames: { "#src": "source" },
      ExpressionAttributeValues: { ":e": email, ":s": source },
    }))
    if ((existing.Items?.length ?? 0) > 0) {
      console.log("[FreeGuide] Duplicate lead skipped:", email, source)
      return
    }
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

const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f2ee;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f2ee;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background:#faf8f5;">

          <!-- Gold top bar -->
          <tr><td style="background:#c8a97e;height:4px;font-size:0;line-height:0;">&nbsp;</td></tr>

          <!-- Header -->
          <tr>
            <td style="padding:36px 40px 28px;border-left:1px solid #e8e0d5;border-right:1px solid #e8e0d5;">
              <p style="margin:0 0 24px;font-family:Helvetica Neue,Arial,sans-serif;font-size:10px;font-weight:600;letter-spacing:0.3em;text-transform:uppercase;color:#c8a97e;">Lisa Fit Method</p>
              <h1 style="margin:0 0 16px;font-family:Georgia,serif;font-size:28px;font-weight:700;color:#0a0a0a;line-height:1.2;letter-spacing:-0.3px;">Your 5 Foundation Movements are inside.</h1>
              <p style="margin:0;font-family:Helvetica Neue,Arial,sans-serif;font-size:15px;line-height:1.75;color:#6b6560;">Hi, glad you are here. Below is a link to read the full free guide online, plus a PDF cheat sheet of all five movement patterns you can keep handy.</p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;border-left:1px solid #e8e0d5;border-right:1px solid #e8e0d5;">
              <div style="border-top:1px solid #e8e0d5;"></div>
            </td>
          </tr>

          <!-- What's inside -->
          <tr>
            <td style="padding:28px 40px;border-left:1px solid #e8e0d5;border-right:1px solid #e8e0d5;">
              <p style="margin:0 0 14px;font-family:Helvetica Neue,Arial,sans-serif;font-size:10px;font-weight:600;letter-spacing:0.25em;text-transform:uppercase;color:#0a0a0a;">What is in the guide</p>
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr><td style="padding:6px 0;font-family:Helvetica Neue,Arial,sans-serif;font-size:13.5px;color:#1a1a1a;line-height:1.5;"><span style="color:#c8a97e;margin-right:10px;">01</span>Goblet Squat: knee dominant</td></tr>
                <tr><td style="padding:6px 0;font-family:Helvetica Neue,Arial,sans-serif;font-size:13.5px;color:#1a1a1a;line-height:1.5;"><span style="color:#c8a97e;margin-right:10px;">02</span>Romanian Deadlift: hip hinge</td></tr>
                <tr><td style="padding:6px 0;font-family:Helvetica Neue,Arial,sans-serif;font-size:13.5px;color:#1a1a1a;line-height:1.5;"><span style="color:#c8a97e;margin-right:10px;">03</span>Dumbbell Row: horizontal pull</td></tr>
                <tr><td style="padding:6px 0;font-family:Helvetica Neue,Arial,sans-serif;font-size:13.5px;color:#1a1a1a;line-height:1.5;"><span style="color:#c8a97e;margin-right:10px;">04</span>Push-Up / DB Press: horizontal push</td></tr>
                <tr><td style="padding:6px 0;font-family:Helvetica Neue,Arial,sans-serif;font-size:13.5px;color:#1a1a1a;line-height:1.5;"><span style="color:#c8a97e;margin-right:10px;">05</span>Pallof Press: core and anti-rotation</td></tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:8px 40px 28px;border-left:1px solid #e8e0d5;border-right:1px solid #e8e0d5;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-right:12px;">
                    <a href="https://lisafitmethod.com/free-guide?unlocked=1" style="display:inline-block;background:#c8a97e;color:#0a0a0a;text-decoration:none;font-family:Helvetica Neue,Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:0.25em;text-transform:uppercase;padding:13px 28px;">Read Online &rarr;</a>
                  </td>
                  <td>
                    <a href="https://lisafitmethod.com/downloads/lisa-fit-method-5-foundations.pdf" style="display:inline-block;background:transparent;color:#c8a97e;text-decoration:none;font-family:Helvetica Neue,Arial,sans-serif;font-size:10px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;padding:13px 24px;border:1px solid #c8a97e;">Download PDF</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr><td style="padding:0 40px;border-left:1px solid #e8e0d5;border-right:1px solid #e8e0d5;"><div style="border-top:1px solid #e8e0d5;"></div></td></tr>

          <!-- Course 1: Training Foundations -->
          <tr>
            <td style="padding:28px 40px 20px;border-left:1px solid #e8e0d5;border-right:1px solid #e8e0d5;">
              <p style="margin:0 0 6px;font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;font-weight:700;letter-spacing:0.25em;text-transform:uppercase;color:#c8a97e;">Training Foundations</p>
              <p style="margin:0 0 12px;font-family:Helvetica Neue,Arial,sans-serif;font-size:13.5px;line-height:1.75;color:#6b6560;">
                The full 4-week program built on these five patterns. Every set, rep, and coaching cue laid out for you, with 50+ exercise videos, built-in workout tracking, and progressive overload built in from day one.
              </p>
              <p style="margin:0 0 10px;font-family:Helvetica Neue,Arial,sans-serif;font-size:13px;color:#9c9590;">
                <strong style="color:#1a1a1a;">$97</strong> founding price (regular $147, limited time). One payment, lifetime access.
              </p>
              <a href="https://lisafitmethod.com/courses" style="font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:#c8a97e;text-decoration:underline;">See Training Foundations &rarr;</a>
            </td>
          </tr>

          <!-- Divider -->
          <tr><td style="padding:0 40px;border-left:1px solid #e8e0d5;border-right:1px solid #e8e0d5;"><div style="border-top:1px solid #e8e0d5;"></div></td></tr>

          <!-- Course 2: Nutrition Foundations -->
          <tr>
            <td style="padding:20px 40px 20px;border-left:1px solid #e8e0d5;border-right:1px solid #e8e0d5;">
              <p style="margin:0 0 6px;font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;font-weight:700;letter-spacing:0.25em;text-transform:uppercase;color:#c8a97e;">Nutrition Foundations (New)</p>
              <p style="margin:0 0 12px;font-family:Helvetica Neue,Arial,sans-serif;font-size:13.5px;line-height:1.75;color:#6b6560;">
                A 4-week nutrition course to go alongside your training. Personalized TDEE calculator, a meal plan that scales to your calorie target, real verified recipes, and science-backed education from a CPT.
              </p>
              <p style="margin:0 0 10px;font-family:Helvetica Neue,Arial,sans-serif;font-size:13px;color:#9c9590;">
                <strong style="color:#1a1a1a;">$77</strong> founding price (regular $127, limited time). One payment, lifetime access.
              </p>
              <a href="https://lisafitmethod.com/nutrition" style="font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:#c8a97e;text-decoration:underline;">See Nutrition Foundations &rarr;</a>
            </td>
          </tr>

          <!-- Divider -->
          <tr><td style="padding:0 40px;border-left:1px solid #e8e0d5;border-right:1px solid #e8e0d5;"><div style="border-top:1px solid #e8e0d5;"></div></td></tr>

          <!-- Bundle -->
          <tr>
            <td style="padding:20px 40px 28px;border-left:1px solid #e8e0d5;border-right:1px solid #e8e0d5;background:#f8f4ef;">
              <p style="margin:0 0 6px;font-family:Helvetica Neue,Arial,sans-serif;font-size:9px;font-weight:700;letter-spacing:0.25em;text-transform:uppercase;color:#c8a97e;">Foundations Bundle (Best Value)</p>
              <p style="margin:0 0 12px;font-family:Helvetica Neue,Arial,sans-serif;font-size:13.5px;line-height:1.75;color:#6b6560;">
                Both courses together. Train the right way and eat to match your effort. $174 if bought separately.
              </p>
              <p style="margin:0 0 12px;font-family:Helvetica Neue,Arial,sans-serif;font-size:13px;color:#9c9590;">
                <strong style="color:#1a1a1a;">$137</strong> for both. You save $37.
              </p>
              <a href="https://lisafitmethod.com/checkout?product=bundle" style="display:inline-block;background:#c8a97e;color:#0a0a0a;text-decoration:none;font-family:Helvetica Neue,Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:0.25em;text-transform:uppercase;padding:12px 24px;">Get Both Courses &rarr;</a>
            </td>
          </tr>

          <!-- Signature -->
          <tr>
            <td style="padding:24px 40px 28px;border-left:1px solid #e8e0d5;border-right:1px solid #e8e0d5;">
              <p style="margin:0 0 2px;font-family:Georgia,serif;font-size:15px;font-style:italic;color:#c8a97e;">Lisa McPherson, CPT</p>
              <p style="margin:0;font-family:Helvetica Neue,Arial,sans-serif;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#bbb4ae;">Lisa Fit Method</p>
            </td>
          </tr>

          <!-- Footer bar -->
          <tr>
            <td style="background:#f0ebe3;padding:16px 40px;border:1px solid #e8e0d5;">
              <p style="margin:0;font-family:Helvetica Neue,Arial,sans-serif;font-size:10px;color:#bbb4ae;line-height:1.6;">
                You received this because you requested the free guide at lisafitmethod.com.<br>
                Questions? Reply to this email and it goes straight to me.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

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
      subject: "Your free guide + PDF cheat sheet",
      html: emailHtml,
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
