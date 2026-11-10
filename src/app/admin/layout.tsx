"use client"

import { useEffect, useState } from "react"
import { getCurrentUser } from "aws-amplify/auth"
import { useRouter, usePathname } from "next/navigation"
import AdminHeader from "@/components/admin/AdminHeader"
import { fetchAdminSecurityStatus } from "@/lib/adminSecurityStatus.client"

const ADMIN_EMAILS = ["lisa.p.mcpherson@gmail.com", "contact@lisafitmethod.com"]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [authorized, setAuthorized] = useState(false)
  const [mfaBlocked, setMfaBlocked] = useState(false)

  const isLoginPage = pathname === "/admin/login"
  const isSecurityPage = pathname === "/admin/security"

  useEffect(() => {
    if (isLoginPage) return
    getCurrentUser()
      .then(async (user) => {
        const loginId = user.signInDetails?.loginId?.toLowerCase() ?? ""
        if (ADMIN_EMAILS.includes(loginId)) {
          // If the status check itself fails, carry on as before: the server
          // still refuses every admin request when two-factor is required.
          const status = await fetchAdminSecurityStatus()
          setMfaBlocked(status?.adminAllowed === false)
          setAuthorized(true)
        } else {
          router.replace("/admin/login")
        }
      })
      .catch(() => {
        router.replace("/admin/login")
      })
  }, [router, isLoginPage])

  // Once blocked, check again on each move away from the security page, so
  // finishing setup there unlocks the rest of the admin area.
  useEffect(() => {
    if (!mfaBlocked || isSecurityPage) return
    let cancelled = false
    fetchAdminSecurityStatus().then((status) => {
      if (cancelled) return
      if (status?.adminAllowed === false) router.replace("/admin/security")
      else setMfaBlocked(false)
    })
    return () => { cancelled = true }
  }, [mfaBlocked, isSecurityPage, router])

  if (isLoginPage) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#f0e6d3" }}>
        {children}
      </div>
    )
  }

  if (!authorized || (mfaBlocked && !isSecurityPage)) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0a0a0a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            border: "2px solid #2a2a2a",
            borderTop: "2px solid #c9a96e",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div data-parent="admin-shell" style={{ minHeight: "100vh", background: "#0a0a0a", color: "#f0e6d3" }}>
      <AdminHeader />
      <main style={{ padding: "2.5rem 2rem", maxWidth: 1200, margin: "0 auto" }}>{children}</main>
    </div>
  )
}
