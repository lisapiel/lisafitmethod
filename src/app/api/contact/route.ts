import { NextResponse } from "next/server"
import { Resend } from "resend"

const APPSYNC_URL = process.env.APPSYNC_URL ?? "https://kcr4zqjknjerveglimvj5ogi2m.appsync-api.us-east-2.amazonaws.com/graphql"
const APPSYNC_API_KEY = process.env.APPSYNC_API_KEY ?? "da2-y44brrwzkncnhcjg6wxr23xnve"

const rateLimitMap = new Map<string, number[]>()
const LIMIT = 3
const WINDOW_MS = 60 * 60 * 1000

function escape(str: string) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

async function saveContactSubmission(name: string, email: string, message: string, type: string) {
  try {
    await fetch(APPSYNC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": APPSYNC_API_KEY },
      body: JSON.stringify({
        query: `mutation Create($input: CreateContactSubmissionInput!) {
          createContactSubmission(input: $input) { id }
        }`,
        variables: { input: { name, email, message, type: type === "coaching" ? "coaching" : "contact", status: "New" } },
      }),
    })
  } catch (err) {
    console.error("[Contact] DB save failed:", err)
  }
}

export async function POST(req: Request) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown"
    const now = Date.now()
    const timestamps = (rateLimitMap.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
    if (timestamps.length >= LIMIT) {
      return NextResponse.json({ error: "Too many submissions. Please try again later." }, { status: 429 })
    }
    rateLimitMap.set(ip, [...timestamps, now])

    const body = await req.json()
    const { name, email, message, website, type } = body

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // honeypot — bots fill this, humans don't see it
    if (website) {
      return NextResponse.json({ ok: true })
    }

    await resend.emails.send({
      from: "Lisa Fit Method <onboarding@resend.dev>",
      to: "lisafitmethod.course@gmail.com",
      replyTo: email,
      subject: `New message from ${escape(name)}`,
      html: `
        <p><strong>Name:</strong> ${escape(name)}</p>
        <p><strong>Email:</strong> <a href="mailto:${escape(email)}">${escape(email)}</a></p>
        <hr />
        <p>${escape(message).replace(/\n/g, "<br>")}</p>
      `,
    })

    await saveContactSubmission(name, email, message, type ?? "contact")

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[Contact] email failed:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
