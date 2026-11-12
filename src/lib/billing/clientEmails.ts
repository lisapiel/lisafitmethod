// Client-facing email for a complimentary client's own cancellation. Kept
// apart from the paid emails, which talk about payments and commitments.
// Copy follows COPY_GUIDELINES.md: Lisa's voice, short, no em dashes.

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!)

export function complimentaryCancellationEmail(input: { firstName: string; effectiveDateLabel: string }): { subject: string; html: string; text: string } {
  const name = escape(input.firstName)
  const date = escape(input.effectiveDateLabel)
  const lines = [
    `Your coaching with me continues through ${date}, and then it will end.`,
    "Your coaching was complimentary, so nothing is charged and there's nothing else you need to do.",
    "If you change your mind or have any questions, just reply to this email.",
  ]
  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#f5f2ee;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f2ee;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
        <tr><td align="center" style="padding-bottom:32px;">
          <span style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:600;color:#1a1a1a;">Lisa <span style="color:#c8a97e;">Fit Method</span></span>
        </td></tr>
        <tr><td style="background:#fff;padding:44px 40px;border-radius:4px;border-left:4px solid #c8a97e;">
          <p style="margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:0.25em;text-transform:uppercase;color:#c8a97e;">1:1 Coaching</p>
          <h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:400;color:#1a1a1a;line-height:1.3;">Got it, ${name}.</h1>
          ${lines.map((l) => `<p style="margin:0 0 16px;font-size:15px;color:#4a4a4a;line-height:1.7;">${l}</p>`).join("\n          ")}
          <p style="margin:8px 0 0;font-size:15px;color:#1a1a1a;">
            <span style="font-family:Georgia,'Times New Roman',serif;font-size:17px;color:#c8a97e;">Lisa</span>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
  return { subject: "Your coaching cancellation is confirmed", html, text: [`Got it, ${input.firstName}.`, ...lines, "Lisa"].join("\n\n") }
}

// The end date as the client's own account page shows it (their time zone),
// so the email and the page always name the same day. Without a valid time
// zone the date is given in UTC and says so, rather than guessing.
export function clientDateLabel(iso: string, timeZone?: string): string {
  const opts = { month: "long", day: "numeric", year: "numeric" } as const
  if (timeZone) {
    try {
      return new Date(iso).toLocaleDateString("en-US", { ...opts, timeZone })
    } catch { /* invalid time zone: fall through */ }
  }
  return `${new Date(iso).toLocaleDateString("en-US", { ...opts, timeZone: "UTC" })} (UTC)`
}
