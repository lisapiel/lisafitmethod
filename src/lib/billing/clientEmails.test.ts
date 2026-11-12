import { test } from "node:test"
import assert from "node:assert/strict"
import { clientDateLabel, complimentaryCancellationEmail } from "./clientEmails"

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
