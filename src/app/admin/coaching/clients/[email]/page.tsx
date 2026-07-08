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
  const [recentWorkouts, setRecentWorkouts] = useState<Array<{ id: string; completedAt: string; dayLabel: string; weekNumber: number; overallRpe: number | null; hasFeedback: boolean }>>([])
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState("")
  const [loading, setLoading] = useState(true)
  const [editingNotes, setEditingNotes] = useState(false)
  const [notes, setNotes] = useState("")
  const [savingNotes, setSavingNotes] = useState(false)
  const [showAssignProgram, setShowAssignProgram] = useState(false)
  const [savingProgram, setSavingProgram] = useState(false)
  const [selectedProgramId, setSelectedProgramId] = useState("")
  // Coach message (shown on client home page)
  const [coachMessage, setCoachMessage] = useState("")
  const [editingCoachMessage, setEditingCoachMessage] = useState(false)
  const [savingCoachMessage, setSavingCoachMessage] = useState(false)
  // Goals
  const [goals, setGoals] = useState<Array<{ id: string; type: string; label: string | null; startValue: number | null; targetValue: number | null; currentValue: number | null; unit: string | null; status: string | null }>>([])
  const [showAddGoal, setShowAddGoal] = useState(false)
  const [newGoal, setNewGoal] = useState({ type: "body-composition", label: "", startValue: "", targetValue: "", currentValue: "", unit: "" })
  const [savingGoal, setSavingGoal] = useState(false)

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
        setCoachMessage(c.coachMessage ?? "")

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

      // Load goals for this client
      const goalsRes = await fetch(`/api/admin/coaching/goals?clientEmail=${encodeURIComponent(emailParam)}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (goalsRes.ok) {
        const data = await goalsRes.json()
        setGoals((data.goals ?? []).map((g: Record<string, unknown>) => ({
          id: g.id as string,
          type: g.type as string,
          label: (g.label as string | null) ?? null,
          startValue: g.startValue != null ? Number(g.startValue) : null,
          targetValue: g.targetValue != null ? Number(g.targetValue) : null,
          currentValue: g.currentValue != null ? Number(g.currentValue) : null,
          unit: (g.unit as string | null) ?? null,
          status: (g.status as string | null) ?? null,
        })))
      }

      // Load recent workouts
      const workoutsRes = await fetch(`/api/admin/coaching/clients/${encodeURIComponent(emailParam)}/workouts`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (workoutsRes.ok) {
        const data = await workoutsRes.json() as { logs?: Array<Record<string, unknown>> }
        setRecentWorkouts((data.logs ?? []).slice(0, 5).map((l) => ({
          id: l.id as string,
          completedAt: l.completedAt as string,
          dayLabel: l.dayLabel as string,
          weekNumber: Number(l.weekNumber ?? 0),
          overallRpe: l.overallRpe != null ? Number(l.overallRpe) : null,
          hasFeedback: Boolean(l.coachFeedback),
        })))
      }
    } catch { /* handled */ }

    setLoading(false)
  }, [emailParam])

  async function saveCoachMessage() {
    setSavingCoachMessage(true)
    await patchClient({ coachMessage: coachMessage.trim() || undefined, coachMessageUpdatedAt: new Date().toISOString() })
    setClient((c) => c ? { ...c, coachMessage: coachMessage.trim() || undefined, coachMessageUpdatedAt: new Date().toISOString() } : c)
    setSavingCoachMessage(false)
    setEditingCoachMessage(false)
  }

  async function handleDeleteClient() {
    if (deleteConfirmText !== "DELETE" || !client) return
    setDeleting(true)
    setDeleteError("")
    try {
      const session = await fetchAuthSession()
      const token = session.tokens?.accessToken?.toString() ?? ""
      const res = await fetch(`/api/admin/coaching/clients/${encodeURIComponent(client.email)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "DELETE" }),
      })
      if (res.ok) {
        router.push("/admin/coaching/clients")
      } else {
        setDeleteError("Delete failed. Try again.")
      }
    } catch {
      setDeleteError("Delete failed. Try again.")
    }
    setDeleting(false)
  }

  async function addGoal() {
    if (!newGoal.label.trim()) return
    setSavingGoal(true)
    const session = await fetchAuthSession()
    const token = session.tokens?.accessToken?.toString() ?? ""
    const res = await fetch("/api/admin/coaching/goals", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        clientEmail: emailParam,
        type: newGoal.type,
        label: newGoal.label.trim(),
        startValue: newGoal.startValue || undefined,
        targetValue: newGoal.targetValue || undefined,
        currentValue: newGoal.currentValue || newGoal.startValue || undefined,
        unit: newGoal.unit.trim() || undefined,
        status: "ON_TRACK",
      }),
    })
    if (res.ok) {
      const data = await res.json()
      const g = data.goal
      setGoals((prev) => [...prev, {
        id: g.id,
        type: g.type,
        label: g.label ?? null,
        startValue: g.startValue != null ? Number(g.startValue) : null,
        targetValue: g.targetValue != null ? Number(g.targetValue) : null,
        currentValue: g.currentValue != null ? Number(g.currentValue) : null,
        unit: g.unit ?? null,
        status: g.status ?? "ON_TRACK",
      }])
      setNewGoal({ type: "body-composition", label: "", startValue: "", targetValue: "", currentValue: "", unit: "" })
      setShowAddGoal(false)
    }
    setSavingGoal(false)
  }

  async function deleteGoal(id: string) {
    if (!confirm("Delete this goal?")) return
    const session = await fetchAuthSession()
    const token = session.tokens?.accessToken?.toString() ?? ""
    const res = await fetch(`/api/admin/coaching/goals/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) setGoals((prev) => prev.filter((g) => g.id !== id))
  }

  async function updateGoalCurrent(id: string, currentValue: string, status: string) {
    const session = await fetchAuthSession()
    const token = session.tokens?.accessToken?.toString() ?? ""
    const updates: Record<string, unknown> = {}
    if (currentValue !== "") updates.currentValue = currentValue
    if (status) updates.status = status
    await fetch(`/api/admin/coaching/goals/${id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    })
    setGoals((prev) => prev.map((g) => g.id === id ? { ...g, currentValue: currentValue !== "" ? Number(currentValue) : g.currentValue, status: status || g.status } : g))
  }

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
      <div className="h-scroll" style={{ display: "flex", gap: 8, marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {[
          { label: "Workouts", href: `/admin/coaching/clients/${encodeURIComponent(client.email)}/workouts` },
          { label: "Nutrition", href: `/admin/coaching/clients/${encodeURIComponent(client.email)}/nutrition` },
          { label: "Program", href: `/admin/coaching/clients/${encodeURIComponent(client.email)}/program` },
          { label: "Progress", href: `/admin/coaching/clients/${encodeURIComponent(client.email)}/progress` },
          { label: "Messages", href: `/admin/coaching/clients/${encodeURIComponent(client.email)}/messages` },
          { label: "Check-Ins", href: `/admin/coaching/check-ins` },
          { label: "Notes", href: `/admin/coaching/clients/${encodeURIComponent(client.email)}/notes` },
        ].map(({ label, href }) => (
          <Link key={label} href={href} style={{ background: "none", border: `1px solid ${border}`, color: "#888", padding: "9px 16px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0 }}>
            {label}
          </Link>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
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

        {/* Recent Workouts */}
        <SectionCard
          title="Recent Workouts"
          action={
            <Link href={`/admin/coaching/clients/${encodeURIComponent(client.email)}/workouts`} style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", color: gold, textDecoration: "none", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              View All
            </Link>
          }
        >
          {recentWorkouts.length === 0 ? (
            <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#444" }}>No workouts logged yet.</p>
          ) : (
            recentWorkouts.map((w) => (
              <Link
                key={w.id}
                href={`/admin/coaching/clients/${encodeURIComponent(client.email)}/workouts`}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, textDecoration: "none" }}
              >
                <div>
                  <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: "#f0e6d3", margin: 0 }}>
                    {formatDate(w.completedAt)} · {w.dayLabel}
                  </p>
                  <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", color: "#555", margin: 0 }}>
                    Week {w.weekNumber}{w.overallRpe ? ` · RPE ${w.overallRpe}` : ""}
                  </p>
                </div>
                <span style={{
                  fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", letterSpacing: "0.08em",
                  color: w.hasFeedback ? "#5c9e6a" : gold,
                }}>
                  {w.hasFeedback ? "✓ FEEDBACK" : "NEEDS FEEDBACK"}
                </span>
              </Link>
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

      {/* Coach Message (shown on client's home page) */}
      <div style={{ marginTop: "1rem" }}>
        <SectionCard
          title="Message to Client (shown on their home)"
          action={
            <button onClick={() => setEditingCoachMessage((v) => !v)} style={{ background: "none", border: "none", color: gold, fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", letterSpacing: "0.1em", cursor: "pointer", textTransform: "uppercase" }}>
              {editingCoachMessage ? "Cancel" : (coachMessage ? "Edit" : "Add")}
            </button>
          }
        >
          {editingCoachMessage ? (
            <div>
              <textarea
                value={coachMessage}
                onChange={(e) => setCoachMessage(e.target.value)}
                placeholder="A personal note this client will see at the top of their portal. Keep it short and motivating, e.g. 'Great work hitting all workouts last week. This week focus on hitting your protein goal every day.'"
                rows={4}
                style={{ width: "100%", background: "#0a0a0a", border: `1px solid ${border}`, color: "#f0e6d3", padding: "10px 12px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.8rem", outline: "none", resize: "vertical", boxSizing: "border-box", marginBottom: 10, lineHeight: 1.5 }}
              />
              <button onClick={saveCoachMessage} disabled={savingCoachMessage} style={{ background: gold, color: "#0a0a0a", border: "none", padding: "8px 18px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer" }}>
                {savingCoachMessage ? "Saving…" : "Save Message"}
              </button>
            </div>
          ) : coachMessage ? (
            <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.85rem", color: "#f0e6d3", lineHeight: 1.6, margin: 0, fontStyle: "italic" }}>
              &ldquo;{coachMessage}&rdquo;
            </p>
          ) : (
            <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#444", margin: 0 }}>
              No message set. Add one to give this client a personal coaching touch on their home page.
            </p>
          )}
        </SectionCard>
      </div>

      {/* Goals */}
      <div style={{ marginTop: "1rem" }}>
        <SectionCard
          title="Goals"
          action={
            <button onClick={() => setShowAddGoal(true)} style={{ background: "none", border: "none", color: gold, fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", letterSpacing: "0.1em", cursor: "pointer", textTransform: "uppercase" }}>
              + Add Goal
            </button>
          }
        >
          {goals.length === 0 && !showAddGoal ? (
            <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#444", margin: 0 }}>
              No goals set. Add a body composition, strength, habit, or custom goal.
            </p>
          ) : (
            <>
              {goals.map((g) => (
                <div key={g.id} style={{ display: "grid", gridTemplateColumns: "1fr 100px 110px 90px 30px", gap: 8, alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${border}` }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", color: gold, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 1px" }}>{(g.type || "").replace(/-/g, " ")}</p>
                    <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.8rem", color: "#f0e6d3", margin: 0, fontWeight: 600 }}>{g.label}</p>
                  </div>
                  <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: "#888", whiteSpace: "nowrap" }}>{g.startValue ?? "—"} → {g.targetValue ?? "—"} {g.unit ?? ""}</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    defaultValue={g.currentValue ?? ""}
                    onBlur={(e) => updateGoalCurrent(g.id, e.target.value, g.status ?? "ON_TRACK")}
                    placeholder="Current"
                    style={{ background: "#0a0a0a", border: `1px solid ${border}`, color: "#f0e6d3", padding: "6px 8px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", outline: "none", borderRadius: 2 }}
                  />
                  <select
                    defaultValue={g.status ?? "ON_TRACK"}
                    onChange={(e) => updateGoalCurrent(g.id, "", e.target.value)}
                    style={{ background: "#0a0a0a", border: `1px solid ${border}`, color: "#f0e6d3", padding: "6px 6px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", outline: "none", borderRadius: 2 }}
                  >
                    <option value="ON_TRACK">On track</option>
                    <option value="NEEDS_ATTENTION">Attention</option>
                    <option value="ACHIEVED">Achieved</option>
                  </select>
                  <button onClick={() => deleteGoal(g.id)} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", padding: "0 4px", fontSize: "1rem" }}>×</button>
                </div>
              ))}

              {showAddGoal && (
                <div style={{ marginTop: 14, padding: "14px", background: "#0a0a0a", border: `1px solid ${border}` }}>
                  <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", color: gold, letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 10px" }}>New Goal</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 8, marginBottom: 8 }}>
                    <select value={newGoal.type} onChange={(e) => setNewGoal({ ...newGoal, type: e.target.value })} style={{ background: "#161616", border: `1px solid ${border}`, color: "#f0e6d3", padding: "7px 8px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", outline: "none" }}>
                      <option value="body-composition">Body Composition</option>
                      <option value="strength">Strength</option>
                      <option value="habit">Habit</option>
                      <option value="custom">Custom</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Goal name (e.g. Lose 15 lbs, Pull-up goal, Hit 110g protein)"
                      value={newGoal.label}
                      onChange={(e) => setNewGoal({ ...newGoal, label: e.target.value })}
                      style={{ background: "#161616", border: `1px solid ${border}`, color: "#f0e6d3", padding: "7px 10px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", outline: "none" }}
                    />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
                    <input placeholder="Start" inputMode="decimal" value={newGoal.startValue} onChange={(e) => setNewGoal({ ...newGoal, startValue: e.target.value })} style={{ background: "#161616", border: `1px solid ${border}`, color: "#f0e6d3", padding: "7px 8px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", outline: "none" }} />
                    <input placeholder="Current" inputMode="decimal" value={newGoal.currentValue} onChange={(e) => setNewGoal({ ...newGoal, currentValue: e.target.value })} style={{ background: "#161616", border: `1px solid ${border}`, color: "#f0e6d3", padding: "7px 8px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", outline: "none" }} />
                    <input placeholder="Target" inputMode="decimal" value={newGoal.targetValue} onChange={(e) => setNewGoal({ ...newGoal, targetValue: e.target.value })} style={{ background: "#161616", border: `1px solid ${border}`, color: "#f0e6d3", padding: "7px 8px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", outline: "none" }} />
                    <input placeholder="Unit (lbs, reps)" value={newGoal.unit} onChange={(e) => setNewGoal({ ...newGoal, unit: e.target.value })} style={{ background: "#161616", border: `1px solid ${border}`, color: "#f0e6d3", padding: "7px 8px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", outline: "none" }} />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={addGoal} disabled={!newGoal.label.trim() || savingGoal} style={{ background: newGoal.label.trim() ? gold : "#333", color: newGoal.label.trim() ? "#0a0a0a" : "#666", border: "none", padding: "8px 18px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", cursor: newGoal.label.trim() ? "pointer" : "not-allowed" }}>
                      {savingGoal ? "Adding…" : "Add Goal"}
                    </button>
                    <button onClick={() => setShowAddGoal(false)} style={{ background: "none", border: `1px solid ${border}`, color: "#888", padding: "8px 14px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", cursor: "pointer" }}>Cancel</button>
                  </div>
                </div>
              )}
            </>
          )}
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

      {/* Danger zone */}
      <div style={{ marginTop: "2.5rem", border: `1px solid #4a1e1e`, background: "#170a0a", padding: "16px 20px" }}>
        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#c14646", margin: "0 0 6px" }}>
          Danger zone
        </p>
        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.72rem", color: "#888", margin: "0 0 12px", lineHeight: 1.5 }}>
          Permanently remove this client and all their coaching data. Their Cognito login account will stay.
        </p>
        <button
          onClick={() => { setDeleteConfirmText(""); setDeleteError(""); setShowDeleteModal(true) }}
          style={{ background: "none", border: `1px solid #4a1e1e`, color: "#c14646", padding: "9px 16px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer" }}
        >
          Delete client
        </button>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div
          onClick={() => setShowDeleteModal(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#111", border: `1px solid ${border}`, borderLeft: `4px solid #c14646`, padding: "1.5rem", maxWidth: 460, width: "100%" }}
          >
            <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#c14646", margin: "0 0 6px" }}>
              Danger zone
            </p>
            <h3 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.35rem", color: "#f0e6d3", margin: "0 0 10px", fontWeight: 500 }}>
              Delete {client.displayName}?
            </h3>
            <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.78rem", color: "#888", margin: "0 0 12px", lineHeight: 1.5 }}>
              This permanently removes their coaching data — client record, workouts, check-ins, progress snapshots, goals, and message thread. Their Cognito login account will stay. This cannot be undone.
            </p>
            <label style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, color: "#888", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
              Type DELETE to confirm
            </label>
            <input
              type="text"
              autoFocus
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              style={{ width: "100%", background: "#0a0a0a", border: `1px solid ${border}`, color: "#f0e6d3", padding: "9px 12px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.85rem", outline: "none", boxSizing: "border-box", marginBottom: 12 }}
            />
            {deleteError && <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: "#c14646", margin: "0 0 10px" }}>{deleteError}</p>}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setShowDeleteModal(false)} style={{ background: "none", border: `1px solid ${border}`, color: "#888", padding: "9px 16px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>
                Cancel
              </button>
              <button
                onClick={handleDeleteClient}
                disabled={deleteConfirmText !== "DELETE" || deleting}
                style={{
                  background: deleteConfirmText === "DELETE" && !deleting ? "#c14646" : "#333",
                  color: "#fff", border: "none", padding: "9px 20px",
                  fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
                  cursor: deleteConfirmText === "DELETE" && !deleting ? "pointer" : "not-allowed",
                }}
              >
                {deleting ? "Deleting…" : "Delete forever"}
              </button>
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
