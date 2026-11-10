import { isAdminEmail } from "./authTokens"

export type AdminRefusal = "signed-out" | "not-admin" | "mfa-required"

export type AdminAccess =
  | { ok: true; email: string; mfaEnabled: boolean }
  | { ok: false; reason: AdminRefusal; email?: string }

export type AdminUserFacts = {
  email: string | null
  mfaSettings: string[]
}

import { TOTP_MFA, adminMfaRequired, hasTotp } from "./adminMfaFlag"

export { TOTP_MFA, adminMfaRequired, hasTotp }

export function decideAdminAccess(
  facts: AdminUserFacts | null,
  options: { required: boolean; exempt: boolean },
): AdminAccess {
  if (!facts) return { ok: false, reason: "signed-out" }
  if (!facts.email || !isAdminEmail(facts.email)) return { ok: false, reason: "not-admin" }
  const mfaEnabled = hasTotp(facts.mfaSettings)
  if (options.required && !options.exempt && !mfaEnabled) {
    return { ok: false, reason: "mfa-required", email: facts.email }
  }
  return { ok: true, email: facts.email, mfaEnabled }
}

// For admin routes that already call GetUser themselves: keeps their own
// status codes and adds only the two-factor rule.
export function adminMfaOk(
  user: { UserMFASettingList?: string[] },
  env: Record<string, string | undefined> = process.env,
): boolean {
  return !adminMfaRequired(env) || hasTotp(user.UserMFASettingList)
}
