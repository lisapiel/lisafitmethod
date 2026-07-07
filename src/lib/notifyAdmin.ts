import { Resend } from "resend"

// Where admin notification emails go. Overridable via env for staging.
const ADMIN_NOTIFY_TO = process.env.ADMIN_NOTIFY_EMAIL ?? "lisa.p.mcpherson@gmail.com"
const FROM = "Lisa Fit Method <noreply@lisafitmethod.com>"

type Kind =
  | "application-received"
  | "subscriber-active"
  | "message-received"
  | "check-in-received"

interface NotifyPayload {
  kind: Kind
  subject: string
  headline: string
  body: string
  ctaLabel?: string
  ctaHref?: string
  meta?: Record<string, string | number | null | undefined>
}

// Fire-and-forget helper. Swallows errors so a failing email never breaks the
// originating request (client submitting a check-in shouldn't fail because
// Resend is temporarily unavailable).
export async function notifyAdmin(p: NotifyPayload): Promise<void> {
  try {
    const key = process.env.RESEND_API_KEY
    if (!key) {
      console.warn("notifyAdmin: RESEND_API_KEY missing — skipping", p.subject)
      return
    }
    const resend = new Resend(key)

    const metaRows = Object.entries(p.meta ?? {})
      .filter(([, v]) => v != null && String(v).length > 0)
      .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">${escapeHtml(k)}</td><td style="padding:4px 0;color:#1a1a1a;font-size:14px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">${escapeHtml(String(v))}</td></tr>`)
      .join("")

    const cta = p.ctaLabel && p.ctaHref
      ? `<table cellpadding="0" cellspacing="0" style="margin-top:20px;"><tr><td style="background:#c8a97e;border-radius:2px;"><a href="${p.ctaHref}" style="display:inline-block;padding:14px 26px;font-size:12px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:#0a0a0a;text-decoration:none;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">${escapeHtml(p.ctaLabel)} →</a></td></tr></table>`
      : ""

    await resend.emails.send({
      from: FROM,
      to: ADMIN_NOTIFY_TO,
      subject: p.subject,
      html: `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#f5f2ee;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f2ee;padding:32px 20px;"><tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
      <tr><td align="center" style="padding-bottom:20px;">
        <span style="font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:600;color:#1a1a1a;">Lisa <span style="color:#c8a97e;">Fit Method</span> · Coaching</span>
      </td></tr>
      <tr><td style="background:#fff;padding:32px;border-radius:4px;border-left:4px solid #c8a97e;">
        <p style="margin:0 0 6px;font-size:11px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#c8a97e;">${labelForKind(p.kind)}</p>
        <h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:400;color:#1a1a1a;line-height:1.3;">${escapeHtml(p.headline)}</h1>
        <p style="margin:0 0 18px;font-size:14px;color:#4a4a4a;line-height:1.65;white-space:pre-wrap;">${escapeHtml(p.body)}</p>
        ${metaRows ? `<table cellpadding="0" cellspacing="0" style="margin-top:14px;border-top:1px solid #eee;padding-top:12px;">${metaRows}</table>` : ""}
        ${cta}
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`,
    })
  } catch (err) {
    console.error("notifyAdmin failed", err)
  }
}

function labelForKind(k: Kind): string {
  switch (k) {
    case "application-received": return "New Application"
    case "subscriber-active": return "New Active Client"
    case "message-received": return "New Message"
    case "check-in-received": return "Check-In Received"
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}
