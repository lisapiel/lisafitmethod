"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { signOut } from "aws-amplify/auth"

const gold = "#c9a96e"
const border = "#2a2a2a"

export default function AdminHeader() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    await signOut()
    router.push("/admin/login")
  }

  const navItems = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/videos", label: "Videos" },
    { href: "/admin/photos", label: "Photos" },
    { href: "/admin/design", label: "Design" },
  ]

  return (
    <header
      style={{
        background: "#111111",
        borderBottom: `1px solid ${border}`,
        padding: "0 2rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 60,
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "2.5rem" }}>
        <span
          style={{
            fontFamily: "var(--font-cormorant), serif",
            fontSize: "1.1rem",
            color: gold,
            letterSpacing: "0.05em",
          }}
        >
          LFM Admin
        </span>
        <nav style={{ display: "flex", gap: "1.5rem" }}>
          {navItems.map((item) => {
            const isActive = item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  fontFamily: "var(--font-montserrat), sans-serif",
                  fontSize: "0.7rem",
                  fontWeight: 500,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  color: isActive ? gold : "#888888",
                  borderBottom: isActive ? `1px solid ${gold}` : "1px solid transparent",
                  paddingBottom: 2,
                }}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
      <button
        onClick={handleSignOut}
        style={{
          background: "none",
          border: `1px solid ${border}`,
          color: "#888888",
          fontFamily: "var(--font-montserrat), sans-serif",
          fontSize: "0.65rem",
          fontWeight: 500,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          padding: "0.4rem 1rem",
          cursor: "pointer",
        }}
      >
        Sign Out
      </button>
    </header>
  )
}
