import { test } from "node:test"
import assert from "node:assert/strict"
import { formatTotpSecret, isCompleteTotpCode, normalizeTotpCode, signInStepView, totpErrorMessage, TOTP_WRONG_CODE, TOTP_SESSION_EXPIRED } from "./totp"

test("codes are trimmed to six digits", () => {
  assert.equal(normalizeTotpCode("123 456"), "123456")
  assert.equal(normalizeTotpCode(" 12-34-567"), "123456")
  assert.equal(isCompleteTotpCode("123456"), true)
  assert.equal(isCompleteTotpCode("12345"), false)
})

test("the secret is shown in groups of four", () => {
  assert.equal(formatTotpSecret("abcdefghijklmnop"), "ABCD EFGH IJKL MNOP")
  assert.equal(formatTotpSecret("ABCDEFGHIJ"), "ABCD EFGH IJ")
  assert.equal(formatTotpSecret("ABCD EFGH"), "ABCD EFGH")
})

test("sign-in steps map to the screens we show", () => {
  assert.equal(signInStepView("DONE"), "done")
  assert.equal(signInStepView("CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED"), "new-password")
  assert.equal(signInStepView("CONFIRM_SIGN_IN_WITH_TOTP_CODE"), "totp")
  assert.equal(signInStepView("CONTINUE_SIGN_IN_WITH_TOTP_SETUP"), "totp-setup")
  assert.equal(signInStepView("CONTINUE_SIGN_IN_WITH_MFA_SELECTION"), "mfa-select")
  assert.equal(signInStepView("CONFIRM_SIGN_IN_WITH_SMS_CODE"), "unsupported")
})

test("wrong and expired codes get plain messages", () => {
  const mismatch = Object.assign(new Error("Invalid code received for user"), { name: "CodeMismatchException" })
  assert.equal(totpErrorMessage(mismatch, "x"), TOTP_WRONG_CODE)
  const enrolMismatch = Object.assign(new Error("Code mismatch"), { name: "EnableSoftwareTokenMFAException" })
  assert.equal(totpErrorMessage(enrolMismatch, "x"), TOTP_WRONG_CODE)
  const expired = Object.assign(new Error("Invalid session for the user, session is expired."), { name: "NotAuthorizedException" })
  assert.equal(totpErrorMessage(expired, "x"), TOTP_SESSION_EXPIRED)
  assert.equal(totpErrorMessage(null, "fallback"), "fallback")
})

test("no em dashes in two-factor copy", () => {
  for (const s of [TOTP_WRONG_CODE, TOTP_SESSION_EXPIRED]) assert.ok(!s.includes("—"))
})
