"use client"

import { useState, useEffect, useCallback } from "react"
import { generateClient } from "aws-amplify/data"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import type { Schema } from "@/lib/amplifyConfig"

const gold = "#c9a96e"
const border = "#2a2a2a"

type ClientData = {
  id: string
  email: string
  displayName: string
  phone: string | null
  status: "ACTIVE" | "PAUSED" | "INACTIVE" | null
  goal: string | null
  currentPhase: string | null
  startDate: string | null
  currentProgramId: string | null
  weightUnit: "LBS" | "KG" | null
  tags: string | null
  privateNotes: string | null
}

type Program = { id: string; name: string; status: string | null }
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
    const db = generateClient<Schema>({ authMode: "userPool" })
    const [clientsRes, checkInsRes, programsRes] = await Promise.allSettled([
      db.models.CoachingClient.list({ authMode: "userPool" }),
      db.models.CoachingCheckIn.list({ authMode: "userPool" }),
      db.models.CoachingProgram.list({ authMode: "userPool" }),
    ])

    if (clientsRes.status === "fulfilled") {
      const found = clientsRes.value.data.find((c) => c.email.toLowerCase() === emailParam.toLowerCase())
      if (found) {
        const c: ClientData = {
          id: found.id, email: found.email, displayName: found.displayName,
          phone: found.phone ?? null, status: (found.status ?? "ACTIVE") as ClientData["status"],
          goal: found.goal ?? null, currentPhase: found.currentPhase ?? null,
          startDate: found.startDate ?? null, currentProgramId: found.currentProgramId ?? null,
          weightUnit: (found.weightUnit ?? "LBS") as ClientData["weightUnit"],
          tags: found.tags ?? null, privateNotes: found.privateNotes ?? null,
        }
        setClient(c)
        setNotes(c.privateNotes ?? "")

        if (programsRes.status === "fulfilled") {
          const progs = programsRes.value.data.map((p) => ({ id: p.id, name: p.name, status: p.status ?? null }))
          setAllPrograms(progs)
          if (c.currentProgramId) {
            setProgram(progs.find((p) => p.id === c.currentProgramId) ?? null)
          }
        }
      }
    }

    if (checkInsRes.status === "fulfilled") {
      const mine = checkInsRes.value.data
        .filter((ci) => ci.clientEmail.toLowerCase() === emailParam.toLowerCase())
        .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
        .slice(0, 5)
      setRecentCheckIns(mine.map((ci) => ({ id: ci.id, submittedAt: ci.submittedAt, status: ci.status ?? null, weight: ci.weight ?? null, weightUnit: ci.weightUnit ?? null })))
    }

    setLoading(false)
  }, [emailParam])

  useEffect(() => { load() }, [load])

  async function saveNotes() {
    if (!client) return
    setSavingNotes(true)
    const db = generateClient<Schema>({ authMode: "userPool" })
    await db.models.CoachingClient.update({ id: client.id, privateNotes: notes })
    setClient((c) => c ? { ...c, privateNotes: notes } : c)
    setSavingNotes(false)
    setEditingNotes(false)
  }

  async function assignProgram() {
    if (!client || !selectedProgramId) return
    setSavingProgram(true)
    const db = generateClient<Schema>({ authMode: "userPool" })
    await db.models.CoachingClient.update({ id: client.id, currentProgramId: selectedProgramId })
    await db.models.CoachingProgram.update({ id: selectedProgramId, status: "ACTIVE", clientEmail: client.email })
    setClient((c) => c ? { ...c, currentProgramId: selectedProgramId } : c)
    setProgram(allPrograms.find((p) => p.id === selectedProgramId) ?? null)
    setSavingProgram(false)
    setShowAssignProgram(false)
  }

  async function updateStatus(newStatus: "ACTIVE" | "PAUSED" | "INACTIVE") {
    if (!client) return
    const db = generateClient<Schema>({ authMode: "userPool" })
    await db.models.CoachingClient.update({ id: client.id, status: newStatus })
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

  const STATUS_COLORS: Record<string, string> = { ACTIVE: "#5c9e6a", PAUSED: "#c9a96e", INACTIVE: "#444" }

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
              {client.status ?? "ACTIVE"}
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
          {(["ACTIVE", "PAUSED", "INACTIVE"] as const).map((s) => (
            <button key={s} onClick={() => updateStatus(s)} style={{ background: client.status === s ? "#1a1a1a" : "none", border: `1px solid ${client.status === s ? "#3a3a3a" : border}`, color: client.status === s ? STATUS_COLORS[s] : "#444", padding: "6px 12px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ display: "flex", gap: 8, marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {[
          { label: "Check-Ins", href: `/admin/coaching/check-ins?client=${encodeURIComponent(client.email)}` },
          { label: "Messages", href: `/admin/coaching/messages?client=${encodeURIComponent(client.email)}` },
          { label: "Progress", href: `/admin/coaching/clients/${encodeURIComponent(client.email)}/program` },
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
              { label: "Phase", value: client.currentPhase ?? "—" },
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
                {allPrograms.filter((p) => p.status !== "ARCHIVED").map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
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
