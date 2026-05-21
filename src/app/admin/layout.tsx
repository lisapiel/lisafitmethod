"use client"

import { useEffect, useState } from "react"
import { getCurrentUser } from "aws-amplify/auth"
import { useRouter } from "next/navigation"
import AdminHeader from "@/components/admin/AdminHeader"

const ADMIN_EMAIL = "lisa.p.mcpherson@gmail.com"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    getCurrentUser()
      .then((user) => {
        if (user.signInDetails?.loginId === ADMIN_EMAIL) {
          setAuthorized(true)
        } else {
          router.replace("/admin/login")
        }
      })
      .catch(() => {
        router.replace("/admin/login")
      })
  }, [router])

  if (!authorized) {
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
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#f0e6d3" }}>
      <AdminHeader />
      <main style={{ padding: "2.5rem 2rem", maxWidth: 1200, margin: "0 auto" }}>{children}</main>
    </div>
  )
}
