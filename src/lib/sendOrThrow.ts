import type { Resend } from "resend"
import { sendOncePerEvent } from "./stripeEventLedger"

type SendPayload = Parameters<Resend["emails"]["send"]>[0]

export interface EmailSender {
  emails: { send(payload: SendPayload): Promise<{ error?: { message?: string; name?: string } | null }> }
}

// Resend reports most failures in the result instead of throwing, so an unread
// result turns a failed email into a silent success.
// Inside a Stripe webhook event the email is also sent at most once per event,
// so a retry after a later failure does not repeat it.
export async function sendOrThrow(resend: EmailSender, payload: SendPayload): Promise<void> {
  const recipient = Array.isArray(payload.to) ? payload.to.join(",") : String(payload.to ?? "")
  await sendOncePerEvent(recipient, String(payload.subject ?? ""), async () => {
    const result = await resend.emails.send(payload)
    if (result?.error) {
      const err = new Error(`Email not sent (${payload.subject ?? "no subject"}): ${result.error.message ?? result.error.name ?? "unknown error"}`)
      err.name = "EmailNotSentError"
      throw err
    }
  })
}
