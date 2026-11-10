import { fetchAuthSession } from "aws-amplify/auth"

export type AdminSecurityStatus = {
  email: string
  mfaEnabled: boolean
  mfaRequired: boolean
  adminAllowed: boolean
}

export async function fetchAdminSecurityStatus(): Promise<AdminSecurityStatus | null> {
  try {
    const session = await fetchAuthSession()
    const token = session.tokens?.accessToken?.toString()
    if (!token) return null
    const res = await fetch("/api/admin/security/status", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" })
    if (!res.ok) return null
    const data: unknown = await res.json()
    if (!data || typeof data !== "object") return null
    const d = data as Record<string, unknown>
    return {
      email: typeof d.email === "string" ? d.email : "",
      mfaEnabled: d.mfaEnabled === true,
      mfaRequired: d.mfaRequired === true,
      adminAllowed: d.adminAllowed !== false,
    }
  } catch {
    return null
  }
}
