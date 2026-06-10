"use client"

import { useState } from "react"
import { generateClient } from "aws-amplify/data"
import { fetchAuthSession } from "aws-amplify/auth"
import { useRouter } from "next/navigation"
import Link from "next/link"
import type { Schema } from "@/lib/amplifyConfig"

const gold = "#c9a96e"
const border = "#2a2a2a"

function Spinner() {
  return (
    <div style={{ width: 18, height: 18, border: "2px solid #2a2a2a", borderTop: `2px solid ${gold}`, borderRadius: "50%", animation: "spin 0.7s linear infinite" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#888", display: "block", marginBottom: 6 }}>
      {children}{required && <span style={{ color: gold }}> *</span>}
    </label>
  )
}

export default function NewClientPage() {
  const router = useRouter()
  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [goal, setGoal] = useState("")
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0])
  const [weightUnit, setWeightUnit] = useState<"LBS" | "KG">("LBS")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState<{ accountCreated: boolean; email: string } | null>(null)

  async function handleSave() {
    if (!displayName.trim() || !email.trim()) { setError("Name and email are required"); return }
    const emailVal = email.trim().toLowerCase()
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)
    if (!emailOk) { setError("Please enter a valid email address"); return }

    setSaving(true); setError("")

    try {
      const session = await fetchAuthSession()
      const token = session.tokens?.accessToken?.toString() ?? ""

      // Grant coaching access + create/notify Cognito user
      const grantRes = await fetch("/api/admin/coaching/grant-access", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: emailVal, displayName: displayName.trim(), startDate }),
      })
      const grantData = await grantRes.json() as { ok?: boolean; accountCreated?: boolean; error?: string }
      if (!grantRes.ok) throw new Error(grantData.error ?? "Failed to grant access")

      // Create CoachingClient record
      const client = generateClient<Schema>({ authMode: "userPool" })
      await client.models.CoachingClient.create({
        email: emailVal,
        displayName: displayName.trim(),
        phone: phone.trim() || undefined,
        goal: goal.trim() || undefined,
        startDate,
        status: "ACTIVE",
        weightUnit,
      })

      setResult({ accountCreated: grantData.accountCreated ?? false, email: emailVal })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
    }
    setSaving(false)
  }

  if (result) {
    return (
      <div style={{ maxWidth: 560 }}>
        <div style={{ background: "#111", border: `1px solid ${border}`, padding: "32px 28px", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "2rem", color: gold, marginBottom: 12 }}>Client Added ✓</p>
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#888", marginBottom: 8, lineHeight: 1.6 }}>
            <strong style={{ color: "#f0e6d3" }}>{displayName}</strong> ({result.email}) is now in your coaching roster.
          </p>
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: "#555", marginBottom: 28 }}>
            {result.accountCreated
              ? "A new account was created and a setup email with a password link has been sent."
              : "They already had an account. A portal access notification email was sent."}
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <Link
              href={`/admin/coaching/clients/${encodeURIComponent(result.email)}`}
              style={{ background: gold, color: "#0a0a0a", padding: "11px 24px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none" }}
            >
              View Client Profile →
            </Link>
            <button
              onClick={() => { setResult(null); setDisplayName(""); setEmail(""); setPhone(""); setGoal("") }}
              style={{ background: "none", border: `1px solid ${border}`, color: "#888", padding: "11px 20px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}
            >
              Add Another
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
        <Link href="/admin/coaching/clients" style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", color: "#666", textDecoration: "none", letterSpacing: "0.08em" }}>← Clients</Link>
        <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.8rem", fontWeight: 300, color: "#f0e6d3", margin: 0 }}>Add Client</h1>
      </div>

      <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#555", marginBottom: "1.5rem", lineHeight: 1.6 }}>
        Adding a client grants them coaching portal access and sends them an email. If they don&apos;t have an account yet, a new one will be created automatically.
      </p>

      <div style={{ display: "grid", gap: "1.25rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <FieldLabel required>Full Name</FieldLabel>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Sarah Johnson"
              style={{ width: "100%", background: "#111", border: `1px solid ${border}`, color: "#f0e6d3", padding: "9px 12px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.8rem", outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <div>
            <FieldLabel required>Email</FieldLabel>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sarah@example.com"
              style={{ width: "100%", background: "#111", border: `1px solid ${border}`, color: "#f0e6d3", padding: "9px 12px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.8rem", outline: "none", boxSizing: "border-box" }}
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <FieldLabel>Phone</FieldLabel>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 555 000 0000"
              style={{ width: "100%", background: "#111", border: `1px solid ${border}`, color: "#f0e6d3", padding: "9px 12px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <div>
            <FieldLabel>Start Date</FieldLabel>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ width: "100%", background: "#111", border: `1px solid ${border}`, color: "#f0e6d3", padding: "9px 12px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", outline: "none", boxSizing: "border-box", colorScheme: "dark" }}
            />
          </div>
        </div>

        <div>
          <FieldLabel>Goal</FieldLabel>
          <input
            type="text"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g. Lose 10kg and build strength"
            style={{ width: "100%", background: "#111", border: `1px solid ${border}`, color: "#f0e6d3", padding: "9px 12px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", outline: "none", boxSizing: "border-box" }}
          />
        </div>

        <div>
          <FieldLabel>Preferred Weight Unit</FieldLabel>
          <div style={{ display: "flex", gap: 8 }}>
            {(["LBS", "KG"] as const).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setWeightUnit(u)}
                style={{ background: weightUnit === u ? gold : "#111", border: `1px solid ${weightUnit === u ? gold : border}`, color: weightUnit === u ? "#0a0a0a" : "#888", padding: "8px 20px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", fontWeight: weightUnit === u ? 700 : 400, cursor: "pointer", letterSpacing: "0.08em" }}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        {error && <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: "#e07070" }}>{error}</p>}

        <div style={{ display: "flex", gap: 12, alignItems: "center", paddingTop: 8 }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ background: saving ? "#555" : gold, color: "#0a0a0a", border: "none", padding: "12px 28px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", cursor: saving ? "wait" : "pointer", display: "flex", alignItems: "center", gap: 8 }}
          >
            {saving && <Spinner />}
            {saving ? "Adding Client…" : "Add Client & Send Email"}
          </button>
          <button onClick={() => router.push("/admin/coaching/clients")} style={{ background: "none", border: "none", color: "#555", padding: "12px 16px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", cursor: "pointer" }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
