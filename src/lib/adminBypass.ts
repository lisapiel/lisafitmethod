import { AdminGetUserCommand, CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider"
import { adminMfaRequired, hasTotp } from "./adminMfaFlag"

type Lookup = (email: string) => Promise<string[] | null>

// Admin emails get into client areas (courses, trackers, My Coaching, /my-plan)
// without buying anything. When ADMIN_MFA_REQUIRED is on, that free pass only
// applies to an admin account with an authenticator app set up, the same rule
// the admin area uses. Cognito asks enrolled accounts for a code at every
// sign-in, so a password alone can't use the pass. Without the pass an admin is
// treated like any other visitor. With enforcement off nothing changes.
export async function adminMfaSatisfied(email: string, lookup: Lookup = lookupMfaSettings, env: Record<string, string | undefined> = process.env): Promise<boolean> {
  if (!adminMfaRequired(env)) return true
  const key = email.toLowerCase()
  const cached = cache.get(key)
  if (cached && cached.until > Date.now()) return cached.ok
  const settings = await lookup(key).catch(() => null)
  const ok = hasTotp(settings ?? [])
  cache.set(key, { ok, until: Date.now() + 30_000 })
  return ok
}

const cache = new Map<string, { ok: boolean; until: number }>()

export function clearAdminMfaCache() {
  cache.clear()
}

async function lookupMfaSettings(email: string): Promise<string[] | null> {
  const pool = process.env.COGNITO_USER_POOL_ID ?? ""
  if (!pool) return null
  const cognito = new CognitoIdentityProviderClient({
    region: process.env.COGNITO_REGION ?? "us-east-2",
    credentials: {
      accessKeyId: process.env.COGNITO_AWS_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.COGNITO_AWS_SECRET_ACCESS_KEY ?? "",
    },
  })
  const user = await cognito.send(new AdminGetUserCommand({ UserPoolId: pool, Username: email }))
  return user.UserMFASettingList ?? []
}
