"use client"

import { useState, useEffect, useCallback } from "react"
import { fetchAuthSession } from "aws-amplify/auth"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import type { CoachingClientRecord } from "@/lib/authTokens"

const gold = "#c9a96e"
const border = "#2a2a2a"

type ClientData = CoachingClientRecord

type Program = { id: string; name: string; status: string | null; isTemplate?: boolean; clientEmail?: string | null }
type CheckIn = { id: string; submittedAt: string; status: string | null; weight: number | null; weightUnit: string | null }

function Spinner() {
  return (
    <div style={{ width: 18, height: 18, border: "2px solid #2a2a2a", borderTop: `2px solid ${gold}`, borderRadius: "50%", animation: "spin 0.7s linear infinite" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function SectionCard({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{ background: "#111", border: `1px solid ${border}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: `1px solid ${border}` }}>
        <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "#666" }}>{title}</span>
        {action}
      </div>
      <div style={{ padding: "16px 20px" }}>{children}</div>
    </div>
  )
}

export default function ClientProfilePage() {
  const params = useParams()
  const router = useRouter()
  const emailParam = decodeURIComponent(params.email as string)

  const [client, setClient] = useState<ClientData | null>(null)
  const [program, setProgram] = useState<Program | null>(null)
  const [allPrograms, setAllPrograms] = useState<Program[]>([])
  const [recentCheckIns, setRecentCheckIns] = useState<CheckIn[]>([])
  const [loading, setLoading] = useState(true)
  const [editingNotes, setEditingNotes] = useState(false)
  const [notes, setNotes] = useState("")
  const [savingNotes, setSavingNotes] = useState(false)
  const [showAssignProgram, setShowAssignProgram] = useState(false)
  const [savingProgram, setSavingProgram] = useState(false)
  const [selectedProgramId, setSelectedProgramId] = useState("")

  const load = useCallback(async () => {
    try {
      const session = await fetchAuthSession()
      const token = session.tokens?.accessToken?.toString() ?? ""

      const [clientRes, checkInsRes, programsRes] = await Promise.allSettled([
        fetch(`/api/admin/coaching/clients/${encodeURIComponent(emailParam)}`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => r.json() as Promise<{ client?: ClientData; error?: string }>),
        fetch("/api/admin/coaching/check-ins", {
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => r.json() as Promise<{ checkIns?: Array<Record<string, unknown>> }>),
        fetch("/api/admin/coaching/programs", {
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => r.json() as Promise<{ programs?: Array<Record<string, unknown>> }>),
      ])

      if (clientRes.status === "fulfilled" && clientRes.value.client) {
        const c = clientRes.value.client
        setClient(c)
        setNotes(c.privateNotes ?? "")

        if (programsRes.status === "fulfilled") {
          const progs = (programsRes.value.programs ?? []).map((p) => ({
            id: p.id as string,
            name: p.name as string,
            status: (p.status as string | null) ?? null,
            isTemplate: (p.isTemplate as boolean | undefined) ?? false,
            clientEmail: (p.clientEmail as string | null) ?? null,
          }))
          setAllPrograms(progs)
          if (c.currentProgramId) {
            setProgram(progs.find((p) => p.id === c.currentProgramId) ?? null)
          }
        }
      }

      if (checkInsRes.status === "fulfilled") {
        const mine = (checkInsRes.value.checkIns ?? [])
          .filter((ci) => (ci.clientEmail as string).toLowerCase() === emailParam.toLowerCase())
          .sort((a, b) => (b.submittedAt as string).localeCompare(a.submittedAt as string))
          .slice(0, 5)
        setRecentCheckIns(mine.map((ci) => ({
          id: ci.id as string,
          submittedAt: ci.submittedAt as string,
          status: (ci.status as string | null) ?? null,
          weight: ci.weight != null ? Number(ci.weight) : null,
          weightUnit: (ci.weightUnit as string | null) ?? null,
        })))
      }
    } catch { /* handled */ }

    setLoading(false)
  }, [emailParam])

  useEffect(() => { load() }, [load])

  async function patchClient(updates: Partial<ClientData>) {
    const session = await fetchAuthSession()
    const token = session.tokens?.accessToken?.toString() ?? ""
    await fetch(`/api/admin/coaching/clients/${encodeURIComponent(emailParam)}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    })
  }

  async function saveNotes() {
    if (!client) return
    setSavingNotes(true)
    await patchClient({ privateNotes: notes })
    setClient((c) => c ? { ...c, privateNotes: notes } : c)
    setSavingNotes(false)
    setEditingNotes(false)
  }

  async function assignProgram() {
    if (!client || !selectedProgramId) return
    setSavingProgram(true)
    try {
      const session = await fetchAuthSession()
      const token = session.tokens?.accessToken?.toString() ?? ""
      const res = await fetch(`/api/admin/coaching/clients/${encodeURIComponent(client.email)}/assign-program`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ programId: selectedProgramId }),
      })
      if (res.ok) {
        const data = await res.json()
        const assignedId = data.programId
        setClient((c) => c ? { ...c, currentProgramId: assignedId } : c)
        // Reload programs list to include the new copy
        const progsRes = await fetch("/api/admin/coaching/programs", { headers: { Authorization: `Bearer ${token}` } })
        if (progsRes.ok) {
          const pData = await progsRes.json()
          const progs = (pData.programs ?? []).map((p: Record<string, unknown>) => ({
            id: p.id as string,
            name: p.name as string,
            status: (p.status as string | null) ?? null,
          }))
          setAllPrograms(progs)
          setProgram(progs.find((p: Program) => p.id === assignedId) ?? null)
        }
      }
    } catch { /* ignore */ }
    setSavingProgram(false)
    setShowAssignProgram(false)
  }

  async function updateStatus(newStatus: "ACTIVE" | "PAUSED" | "INACTIVE" | "PENDING_PAYMENT") {
    if (!client) return
    await patchClient({ status: newStatus })
    setClient((c) => c ? { ...c, status: newStatus } : c)
  }

  if (loading) {
    return <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "3rem", color: "#555" }}><Spinner /><span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem" }}>Loading client…</span></div>
  }

  if (!client) {
    return (
      <div style={{ padding: "3rem", textAlign: "center" }}>
        <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.5rem", color: "#444" }}>Client not found</p>
        <Link href="/admin/coaching/clients" style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: gold, textDecoration: "none" }}>← Back to Clients</Link>
      </div>
    )
  }

  const STATUS_COLORS: Record<string, string> = { ACTIVE: "#5c9e6a", PAUSED: "#c9a96e", INACTIVE: "#444", PENDING_PAYMENT: "#d97460" }
  const STATUS_LABELS: Record<string, string> = { ACTIVE: "ACTIVE", PAUSED: "PAUSED", INACTIVE: "INACTIVE", PENDING_PAYMENT: "AWAITING PAYMENT" }

  return (
    <div style={{ maxWidth: 900 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <Link href="/admin/coaching/clients" style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", color: "#666", textDecoration: "none", letterSpacing: "0.08em" }}>← Clients</Link>
      </div>

      {/* Client hero */}
      <div style={{ background: "#111", border: `1px solid ${border}`, padding: "24px", marginBottom: "1.5rem", display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#1a1a1a", border: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.3rem", fontWeight: 600, color: gold }}>{initials(client.displayName)}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6, flexWrap: "wrap" }}>
            <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.8rem", fontWeight: 300, color: "#f0e6d3", margin: 0 }}>{client.displayName}</h1>
            <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", letterSpacing: "0.12em", color: STATUS_COLORS[client.status ?? "ACTIVE"] }}>
              {STATUS_LABELS[client.status ?? "ACTIVE"] ?? client.status ?? "ACTIVE"}
            </span>
          </div>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: "#555" }}>{client.email}</span>
            {client.phone && <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: "#555" }}>{client.phone}</span>}
            {client.startDate && <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: "#555" }}>Started {formatDate(client.startDate)}</span>}
          </div>
          {client.goal && (
            <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#888", marginTop: 8 }}>
              <span style={{ color: "#444" }}>Goal: </span>{client.goal}
            </p>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(["PENDING_PAYMENT", "ACTIVE", "PAUSED", "INACTIVE"] as const).map((s) => (
            <button key={s} onClick={() => updateStatus(s)} style={{ background: client.status === s ? "#1a1a1a" : "none", border: `1px solid ${client.status === s ? "#3a3a3a" : border}`, color: client.status === s ? STATUS_COLORS[s] : "#444", padding: "6px 12px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ display: "flex", gap: 8, marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {[
          { label: "Program", href: `/admin/coaching/clients/${encodeURIComponent(client.email)}/program` },
          { label: "Progress", href: `/admin/coaching/clients/${encodeURIComponent(client.email)}/progress` },
          { label: "Messages", href: `/admin/coaching/clients/${encodeURIComponent(client.email)}/messages` },
          { label: "Check-Ins", href: `/admin/coaching/check-ins` },
          { label: "Notes", href: `/admin/coaching/clients/${encodeURIComponent(client.email)}/notes` },
        ].map(({ label, href }) => (
          <Link key={label} href={href} style={{ background: "none", border: `1px solid ${border}`, color: "#888", padding: "9px 16px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", textDecoration: "none" }}>
            {label}
          </Link>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        {/* Current Program */}
        <SectionCard
          title="Current Program"
          action={
            <button onClick={() => setShowAssignProgram(true)} style={{ background: "none", border: "none", color: gold, fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", letterSpacing: "0.1em", cursor: "pointer", textTransform: "uppercase" }}>
              {program ? "Change" : "Assign"}
            </button>
          }
        >
          {program ? (
            <div>
              <Link href={`/admin/coaching/programs/${program.id}`} style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.85rem", fontWeight: 600, color: "#f0e6d3", textDecoration: "none", display: "block", marginBottom: 4 }}>
                {program.name}
              </Link>
              <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", color: "#5c9e6a", letterSpacing: "0.08em" }}>{program.status ?? "ACTIVE"}</span>
              <div style={{ marginTop: 12 }}>
                <Link href={`/admin/coaching/programs/${program.id}`} style={{ display: "inline-block", background: gold, color: "#0a0a0a", padding: "7px 14px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", textDecoration: "none" }}>
                  Edit Program
                </Link>
              </div>
            </div>
          ) : (
            <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#444" }}>No program assigned yet.</p>
          )}
        </SectionCard>

        {/* Recent Check-Ins */}
        <SectionCard
          title="Recent Check-Ins"
          action={
            <Link href={`/admin/coaching/check-ins?client=${encodeURIComponent(client.email)}`} style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", color: gold, textDecoration: "none", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              View All
            </Link>
          }
        >
          {recentCheckIns.length === 0 ? (
            <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#444" }}>No check-ins yet.</p>
          ) : (
            recentCheckIns.map((ci) => (
              <div key={ci.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div>
                  <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: "#f0e6d3", margin: 0 }}>{formatDate(ci.submittedAt)}</p>
                  {ci.weight && <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", color: "#555", margin: 0 }}>{ci.weight} {ci.weightUnit ?? "LBS"}</p>}
                </div>
                <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", color: ci.status === "PENDING" ? gold : "#5c9e6a", letterSpacing: "0.1em" }}>
                  {ci.status ?? "PENDING"}
                </span>
              </div>
            ))
          )}
        </SectionCard>

        {/* Private Notes */}
        <SectionCard
          title="Private Notes"
          action={
            <button onClick={() => setEditingNotes(!editingNotes)} style={{ background: "none", border: "none", color: gold, fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", letterSpacing: "0.1em", cursor: "pointer", textTransform: "uppercase" }}>
              {editingNotes ? "Cancel" : "Edit"}
            </button>
          }
        >
          {editingNotes ? (
            <div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={5}
                placeholder="Private notes about this client (never shown to them)…"
                style={{ width: "100%", background: "#0a0a0a", border: `1px solid ${border}`, color: "#f0e6d3", padding: "9px 12px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", outline: "none", resize: "vertical", boxSizing: "border-box", marginBottom: 10 }}
              />
              <button onClick={saveNotes} disabled={savingNotes} style={{ background: gold, color: "#0a0a0a", border: "none", padding: "8px 18px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer" }}>
                {savingNotes ? "Saving…" : "Save"}
              </button>
            </div>
          ) : (
            <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: notes ? "#888" : "#333", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
              {notes || "No notes yet."}
            </p>
          )}
        </SectionCard>

        {/* Client Details */}
        <SectionCard title="Details">
          <div style={{ display: "grid", gap: 12 }}>
            {[
              { label: "Weight unit", value: client.weightUnit ?? "LBS" },
              { label: "Start date", value: formatDate(client.startDate) },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", color: "#444", letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</span>
                <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#888" }}>{value}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Assign program modal */}
      {showAssignProgram && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setShowAssignProgram(false)}>
          <div style={{ background: "#161616", border: `1px solid ${border}`, borderRadius: 2, width: "100%", maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: "20px 24px", borderBottom: `1px solid ${border}` }}>
              <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.3rem", color: "#f0e6d3", margin: 0 }}>Assign Program</p>
            </div>
            <div style={{ padding: "20px 24px" }}>
              <select
                value={selectedProgramId}
                onChange={(e) => setSelectedProgramId(e.target.value)}
                style={{ width: "100%", background: "#111", border: `1px solid ${border}`, color: "#f0e6d3", padding: "10px 12px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", outline: "none", marginBottom: 16 }}
              >
                <option value="">Select a program…</option>
                {allPrograms
                  .filter((p) => p.status !== "ARCHIVED")
                  // Show templates + this client's own program copies; hide other clients' copies
                  .filter((p) => p.isTemplate !== false || !p.clientEmail || p.clientEmail.toLowerCase() === client.email.toLowerCase())
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}{p.clientEmail && p.clientEmail.toLowerCase() === client.email.toLowerCase() ? " (this client's copy)" : ""}
                    </option>
                  ))}
              </select>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={assignProgram} disabled={!selectedProgramId || savingProgram} style={{ background: selectedProgramId ? gold : "#333", color: "#0a0a0a", border: "none", padding: "10px 22px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", cursor: selectedProgramId ? "pointer" : "not-allowed" }}>
                  {savingProgram ? "Assigning…" : "Assign Program"}
                </button>
                <button onClick={() => setShowAssignProgram(false)} style={{ background: "none", border: `1px solid ${border}`, color: "#888", padding: "10px 18px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", cursor: "pointer" }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Back to list */}
      <div style={{ marginTop: "2rem" }}>
        <button onClick={() => router.push("/admin/coaching/clients")} style={{ background: "none", border: "none", color: "#555", padding: 0, fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", cursor: "pointer", letterSpacing: "0.08em" }}>
          ← Back to all clients
        </button>
      </div>
    </div>
  )
}
