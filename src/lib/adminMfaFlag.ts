export const TOTP_MFA = "SOFTWARE_TOKEN_MFA"

// Only the exact string "true" turns enforcement on, so a typo or an empty
// value leaves the admin area working exactly as before.
export function adminMfaRequired(env: Record<string, string | undefined> = process.env): boolean {
  return env.ADMIN_MFA_REQUIRED === "true"
}

export function hasTotp(mfaSettings: string[] | undefined): boolean {
  return (mfaSettings ?? []).includes(TOTP_MFA)
}
