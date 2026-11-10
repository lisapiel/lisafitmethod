// Who a bundle-credit lookup may answer for. A purchase is private, so the
// lookup only ever answers for the signed-in person's own email.
export type BundleCreditLookup =
  | { ok: true; email: string }
  | { ok: false; status: 401 | 403 }

export function resolveBundleCreditLookup(sessionEmail: string | null, requestedEmail: string | null | undefined): BundleCreditLookup {
  if (!sessionEmail) return { ok: false, status: 401 }
  const own = sessionEmail.trim().toLowerCase()
  const asked = requestedEmail?.trim().toLowerCase()
  if (asked && asked !== own) return { ok: false, status: 403 }
  return { ok: true, email: own }
}
