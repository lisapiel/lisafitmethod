"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { RecoveryGuidance } from "@/components/admin/security/RecoveryGuidance"
import { TotpDisable } from "@/components/admin/security/TotpDisable.client"
import { TotpEnrol } from "@/components/admin/security/TotpEnrol.client"
import { bodyStyle, cardStyle, cream, gold, muted } from "@/components/admin/security/styles"
import { fetchAdminSecurityStatus, type AdminSecurityStatus } from "@/lib/adminSecurityStatus.client"

export function AdminSecurityClient() {
  const [status, setStatus] = useState<AdminSecurityStatus | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const load = useCallback(async () => {
    setStatus(await fetchAdminSecurityStatus())
    setLoaded(true)
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div style={{ maxWidth: 720 }}>
      <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase", color: muted, margin: "0 0 0.5rem" }}>
        Admin
      </p>
      <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "2.2rem", fontWeight: 300, color: cream, margin: "0 0 1.5rem" }}>
        Two-factor sign-in
      </h1>

      {!loaded && <p style={bodyStyle}>Loading…</p>}

      {loaded && !status && (
        <section style={cardStyle}>
          <p style={bodyStyle}>
            I couldn&apos;t check this account&apos;s sign-in settings. Please refresh the page, or <Link href="/admin/login" style={{ color: gold }}>sign in again</Link>.
          </p>
        </section>
      )}

      {status && (
        <>
          {status.mfaRequired && !status.mfaEnabled && (
            <section role="alert" style={{ ...cardStyle, borderColor: gold }}>
              <p style={{ ...bodyStyle, color: cream, margin: 0 }}>
                Turn on two-factor to use the admin area. Set it up below and the rest of the admin area opens again straight away.
              </p>
            </section>
          )}

          <section style={cardStyle} aria-live="polite">
            <p data-testid="mfa-status" data-enabled={status.mfaEnabled ? "true" : "false"} style={{ ...bodyStyle, margin: 0 }}>
              Two-factor is <strong style={{ color: status.mfaEnabled ? gold : cream }}>{status.mfaEnabled ? "on" : "off"}</strong> for {status.email}.
            </p>
            {notice && <p style={{ ...bodyStyle, color: gold, margin: "0.75rem 0 0" }}>{notice}</p>}
          </section>

          {status.mfaEnabled ? (
            <TotpDisable
              email={status.email}
              mfaRequired={status.mfaRequired}
              onDisabled={async () => { setNotice("Two-factor is now off for this account."); await load() }}
            />
          ) : (
            <TotpEnrol
              email={status.email}
              onEnabled={async () => { setNotice("Two-factor is now on. You'll be asked for a code each time you sign in."); await load() }}
            />
          )}

          <RecoveryGuidance />
        </>
      )}
    </div>
  )
}
