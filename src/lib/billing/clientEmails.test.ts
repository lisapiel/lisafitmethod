import { test } from "node:test"
import assert from "node:assert/strict"
import { clientDateLabel, complimentaryCancellationEmail, paidCancellationEmail } from "./clientEmails"

// A Stripe period ending 01:04 UTC on 8 Dec is still 7 Dec in New York.
const END = "2026-12-08T01:04:51.000Z"

test("the email names the same day the client's page shows, in their time zone", () => {
  assert.equal(clientDateLabel(END, "America/New_York"), "December 7, 2026")
  assert.equal(clientDateLabel(END, "Europe/London"), "December 8, 2026")
})

test("without a valid time zone the date is given in UTC and labelled, never guessed", () => {
  assert.equal(clientDateLabel(END), "December 8, 2026 (UTC)")
  assert.equal(clientDateLabel(END, "Not/AZone"), "December 8, 2026 (UTC)")
})

test("the cancellation email uses Lisa's approved wording and subject, with no em dashes", () => {
  const m = complimentaryCancellationEmail({ firstName: "Cora", effectiveDateLabel: "December 7, 2026" })
  assert.equal(m.subject, "Your coaching cancellation is confirmed")
  assert.equal(m.text, [
    "Got it, Cora.",
    "Your coaching with me continues through December 7, 2026, and then it will end.",
    "Your coaching was complimentary, so nothing is charged and there's nothing else you need to do.",
    "If you change your mind or have any questions, just reply to this email.",
    "Lisa",
  ].join("\n\n"))
  assert.ok(!m.html.includes("\u2014") && !m.text.includes("\u2014"))
  assert.ok(m.html.includes("Got it, Cora."))
})

// The exact paid confirmation copy shown to Lisa for review on 12 Nov 2026.
test("paid cancellation email, month-to-month: exact copy", () => {
  const m = paidCancellationEmail({ firstName: "Pat", effectiveDateLabel: "December 7, 2026", remainingPayments: [] })
  assert.equal(m.subject, "Your coaching cancellation is confirmed")
  assert.equal(m.text, [
    "Got it, Pat.",
    "Your coaching with me continues through December 7, 2026, and then it will end.",
    "That time is already paid for. Your subscription won't renew and nothing more will be charged.",
    "If you change your mind before then, you can keep your coaching from your account page, or just reply to this email.",
    "Lisa",
  ].join("\n\n"))
})

test("paid cancellation email, inside a 3-month minimum: each remaining payment, exact copy", () => {
  const m = paidCancellationEmail({ firstName: "Mia", effectiveDateLabel: "February 7, 2027", remainingPayments: [{ dateLabel: "December 7, 2026", amountCents: 39700 }, { dateLabel: "January 7, 2027", amountCents: 39700 }] })
  assert.equal(m.text.split("\n\n")[2], "Because you started with a 3-month minimum, your remaining committed payments will still be charged: $397 on December 7, 2026 and $397 on January 7, 2027.")
  assert.equal(m.text.split("\n\n")[3], "After that, your subscription won't renew and nothing more will be charged.")
  const one = paidCancellationEmail({ firstName: "Mia", effectiveDateLabel: "January 7, 2027", remainingPayments: [{ dateLabel: "December 7, 2026", amountCents: 39700 }] })
  assert.match(one.text, /your last committed payment will still be charged: \$397 on December 7, 2026\./)
  assert.ok(!/—/.test(m.html + m.text), "no em dashes")
  const unknownAmount = paidCancellationEmail({ firstName: "Mia", effectiveDateLabel: "January 7, 2027", remainingPayments: [{ dateLabel: "December 7, 2026", amountCents: null }] })
  assert.match(unknownAmount.text, /the amount on your invoice on December 7, 2026/)
})
