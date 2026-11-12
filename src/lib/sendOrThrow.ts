import type { Resend } from "resend"

type SendPayload = Parameters<Resend["emails"]["send"]>[0]

export interface EmailSender {
  emails: { send(payload: SendPayload): Promise<{ error?: { message?: string; name?: string } | null }> }
}

// Resend reports most failures in the result instead of throwing, so an unread
// result turns a failed email into a silent success.
export async function sendOrThrow(resend: EmailSender, payload: SendPayload): Promise<void> {
  const result = await resend.emails.send(payload)
  if (result?.error) {
    const err = new Error(`Email not sent (${payload.subject ?? "no subject"}): ${result.error.message ?? result.error.name ?? "unknown error"}`)
    err.name = "EmailNotSentError"
    throw err
  }
}
