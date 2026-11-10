export const TOTP_ISSUER = "Lisa Fit Method"

export const TOTP_PROMPT = "Enter the 6-digit code from your authenticator app."

export const TOTP_WRONG_CODE = "That code didn't work. Please check your authenticator app and enter the newest code."

export const TOTP_SESSION_EXPIRED = "This sign-in timed out. Please start again with your email and password."

// Authenticator apps show codes as "123 456"; people also paste them with spaces.
export function normalizeTotpCode(input: string): string {
  return input.replace(/\D/g, "").slice(0, 6)
}

export function isCompleteTotpCode(code: string): boolean {
  return /^\d{6}$/.test(code)
}

// Groups of four are far easier to type into an app by hand than one long string.
export function formatTotpSecret(secret: string): string {
  return secret.replace(/\s+/g, "").toUpperCase().replace(/(.{4})(?=.)/g, "$1 ")
}

export type SignInStepView = "done" | "new-password" | "totp" | "totp-setup" | "mfa-select" | "unsupported"

export function signInStepView(signInStep: string): SignInStepView {
  switch (signInStep) {
    case "DONE": return "done"
    case "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED": return "new-password"
    case "CONFIRM_SIGN_IN_WITH_TOTP_CODE": return "totp"
    case "CONTINUE_SIGN_IN_WITH_TOTP_SETUP": return "totp-setup"
    case "CONTINUE_SIGN_IN_WITH_MFA_SELECTION": return "mfa-select"
    default: return "unsupported"
  }
}

function errorName(err: unknown): string {
  return err && typeof err === "object" && "name" in err ? String((err as { name: unknown }).name) : ""
}

export function totpErrorMessage(err: unknown, fallback: string): string {
  const name = errorName(err)
  const message = err instanceof Error ? err.message : ""
  if (name === "CodeMismatchException" || name === "EnableSoftwareTokenMFAException" || /code mismatch|invalid code/i.test(message)) {
    return TOTP_WRONG_CODE
  }
  if (name === "NotAuthorizedException" && /session/i.test(message)) return TOTP_SESSION_EXPIRED
  if (/session is expired|invalid session/i.test(message)) return TOTP_SESSION_EXPIRED
  return message || fallback
}
