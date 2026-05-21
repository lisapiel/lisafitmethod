"use client"

import { useState } from "react"
import { signIn } from "aws-amplify/auth"
import { useRouter } from "next/navigation"

const gold = "#c9a96e"
const border = "#2a2a2a"

export default function AdminLoginClient() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await signIn({ username: email, password })
      router.push("/admin")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: 360 }}>
        <p
          style={{
            fontFamily: "var(--font-cormorant), serif",
            fontSize: "1.8rem",
            fontWeight: 300,
            color: gold,
            marginBottom: "0.25rem",
          }}
        >
          Lisa Fit Method
        </p>
        <p
          style={{
            fontFamily: "var(--font-montserrat), sans-serif",
            fontSize: "0.65rem",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#555",
            marginBottom: "2.5rem",
          }}
        >
          Admin Access
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label
              style={{
                display: "block",
                fontFamily: "var(--font-montserrat), sans-serif",
                fontSize: "0.6rem",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "#888",
                marginBottom: "0.5rem",
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                background: "#111",
                border: `1px solid ${border}`,
                color: "#f0e6d3",
                fontFamily: "var(--font-montserrat), sans-serif",
                fontSize: "0.85rem",
                padding: "0.75rem 1rem",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontFamily: "var(--font-montserrat), sans-serif",
                fontSize: "0.6rem",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "#888",
                marginBottom: "0.5rem",
              }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                background: "#111",
                border: `1px solid ${border}`,
                color: "#f0e6d3",
                fontFamily: "var(--font-montserrat), sans-serif",
                fontSize: "0.85rem",
                padding: "0.75rem 1rem",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {error && (
            <p style={{ fontSize: "0.75rem", color: "#e07070", fontFamily: "var(--font-montserrat), sans-serif" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? "#555" : gold,
              color: "#0a0a0a",
              border: "none",
              fontFamily: "var(--font-montserrat), sans-serif",
              fontSize: "0.7rem",
              fontWeight: 600,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              padding: "1rem",
              cursor: loading ? "not-allowed" : "pointer",
              marginTop: "0.5rem",
            }}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  )
}
