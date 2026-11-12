"use client"

import { useState, useEffect, useCallback } from "react"
import { fetchAuthSession } from "aws-amplify/auth"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import type { CoachingClientRecord } from "@/lib/authTokens"
import { IntakeCard } from "@/components/coaching/admin/IntakeCard"
import { PaymentSummaryPanel } from "@/components/coaching/admin/PaymentSummary.client"
import { BillingPanel } from "@/components/coaching/admin/BillingPanel.client"
import GoalForm, { EMPTY_GOAL, type GoalFormValues } from "@/components/coaching/admin/GoalForm"

const gold = "var(--ca-accent-mark)"
type AdminGoal = { id: string; type: string; label: string | null; startValue: number | null; targetValue: number | null; currentValue: number | null; unit: string | null; status: string | null; targetDate: string | null; notes: string | null }
const toAdminGoal = (g: Record<string, unknown>): AdminGoal => ({
  id: g.id as string,
  type: g.type as string,
  label: (g.label as string | null) ?? null,
  startValue: g.startValue != null ? Number(g.startValue) : null,
  targetValue: g.targetValue != null ? Number(g.targetValue) : null,
  currentValue: g.currentValue != null ? Number(g.currentValue) : null,
  unit: (g.unit as string | null) ?? null,
  status: (g.status as string | null) ?? null,
  targetDate: typeof g.targetDate === "string" && g.targetDate ? g.targetDate : null,
  notes: typeof g.notes === "string" && g.notes ? g.notes : null,
})
const goalToForm = (g: AdminGoal): GoalFormValues => ({
  type: g.type || "custom", label: g.label ?? "", unit: g.unit ?? "", notes: g.notes ?? "", targetDate: (g.targetDate ?? "").slice(0, 10),
  startValue: g.startValue != null ? String(g.startValue) : "", currentValue: g.currentValue != null ? String(g.currentValue) : "", targetValue: g.targetValue != null ? String(g.targetValue) : "",
})
const formToBody = (v: GoalFormValues) => ({
  type: v.type, label: v.label.trim(), unit: v.unit.trim(), notes: v.notes.trim(), targetDate: v.targetDate,
  startValue: v.startValue.trim(), currentValue: v.currentValue.trim(), targetValue: v.targetValue.trim(),
})
const border = "var(--ca-line)"

type ClientData = CoachingClientRecord

type Program = { id: string; name: string; status: string | null; isTemplate?: boolean; clientEmail?: string | null }
type CheckIn = { id: string; submittedAt: string; status: string | null; weight: number | null; weightUnit: string | null }

function Spinner() {
  return (
    <div style={{ width: 18, height: 18, border: "2px solid var(--ca-line)", borderTop: `2px solid ${gold}`, borderRadius: "50%", animation: "spin 0.7s linear infinite" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function SectionCard({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{ background: "var(--ca-surface)", border: `1px solid ${border}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: `1px solid ${border}` }}>
        <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--ca-muted)" }}>{title}</span>
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
  const [linkingSubscription, setLinkingSubscription] = useState(false)
  const [linkSubError, setLinkSubError] = useState("")
  const [linkSubDone, setLinkSubDone] = useState(false)
  const [savingProgram, setSavingProgram] = useState(false)
  const [selectedProgramId, setSelectedProgramId] = useState("")
  // Coach message (shown on client home page)
  const [coachMessage, setCoachMessage] = useState("")
  const [editingCoachMessage, setEditingCoachMessage] = useState(false)
  const [savingCoachMessage, setSavingCoachMessage] = useState(false)
  // Goals
  const [goals, setGoals] = useState<AdminGoal[]>([])
  const [showAddGoal, setShowAddGoal] = useState(false)
  const [editingGoal, setEditingGoal] = useState<string | null>(null)
  // Commitment confirmation (for legacy clients)
  const [commitmentForm, setCommitmentForm] = useState({ commitmentType: "", approvedPriceInCents: "", subscriptionStartDate: "" })
  const [savingCommitment, setSavingCommitment] = useState(false)
  const [commitmentError, setCommitmentError] = useState("")
  // Admin cancellation
  const [cancelPreview, setCancelPreview] = useState<{ effectiveDateDisplay: string; effectiveDate: string; stripeSubId: string } | null>(null)
  const [loadingCancelPreview, setLoadingCancelPreview] = useState(false)
  const [cancelPreviewError, setCancelPreviewError] = useState("")
  const [cancelReason, setCancelReason] = useState("")
  const [submittingCancel, setSubmittingCancel] = useState(false)
  const [cancelDone, setCancelDone] = useState<string | null>(null)

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
          ...toAdminGoal(g),
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
        const errData = await res.json().catch(() => ({})) as { error?: string; code?: string }
        if (errData.code === "active_stripe_subscription") {
          setDeleteError(errData.error ?? "Cannot delete — active Stripe subscription exists.")
        } else if (errData.code === "stripe_check_failed") {
          setDeleteError("Cannot verify Stripe billing status. Check Stripe manually before deleting.")
        } else {
          setDeleteError(errData.error ?? "Delete failed. Try again.")
        }
      }
    } catch {
      setDeleteError("Delete failed. Try again.")
    }
    setDeleting(false)
  }

  async function handleLinkSubscription() {
    if (!client) return
    setLinkingSubscription(true)
    setLinkSubError("")
    try {
      const session = await fetchAuthSession()
      const token = session.tokens?.accessToken?.toString() ?? ""
      // Use the safe link-only endpoint — this stores only the subscription ID and
      // does NOT create Cognito accounts, send emails, change access, or update applications.
      const res = await fetch("/api/admin/coaching/billing/link-subscription", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ email: client.email }),
      })
      const data = await res.json() as { ok?: boolean; subscriptionId?: string; error?: string }
      if (!res.ok || !data.ok) {
        setLinkSubError(data.error ?? "Could not link subscription")
      } else {
        setLinkSubDone(true)
        setClient((c) => c ? { ...c, stripeSubscriptionId: data.subscriptionId } : c)
      }
    } catch {
      setLinkSubError("Request failed")
    }
    setLinkingSubscription(false)
  }

  async function goalRequest(url: string, method: "POST" | "PATCH", body: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    const session = await fetchAuthSession()
    const token = session.tokens?.accessToken?.toString() ?? ""
    const res = await fetch(url, { method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(body) })
    if (!res.ok) return null
    return await res.json().catch(() => ({}))
  }

  async function addGoal(v: GoalFormValues): Promise<boolean> {
    const b = formToBody(v)
    const data = await goalRequest("/api/admin/coaching/goals", "POST", {
      clientEmail: emailParam,
      type: b.type,
      label: b.label,
      startValue: b.startValue || undefined,
      targetValue: b.targetValue || undefined,
      currentValue: b.currentValue || b.startValue || undefined,
      unit: b.unit || undefined,
      targetDate: b.targetDate || undefined,
      notes: b.notes || undefined,
      status: "ON_TRACK",
    })
    if (!data?.goal) return false
    setGoals((prev) => [...prev, toAdminGoal(data.goal as Record<string, unknown>)])
    setShowAddGoal(false)
    return true
  }

  async function saveGoalEdit(id: string, v: GoalFormValues): Promise<boolean> {
    const data = await goalRequest(`/api/admin/coaching/goals/${id}`, "PATCH", formToBody(v))
    if (!data?.goal) return false
    setGoals((prev) => prev.map((g) => g.id === id ? toAdminGoal(data.goal as Record<string, unknown>) : g))
    setEditingGoal(null)
    return true
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

  async function loadCancelPreview() {
    setLoadingCancelPreview(true)
    setCancelPreviewError("")
    try {
      const session = await fetchAuthSession()
      const token = session.tokens?.accessToken?.toString() ?? ""
      const res = await fetch(`/api/admin/coaching/cancel?email=${encodeURIComponent(emailParam)}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json() as { ok?: boolean; effectiveDateDisplay?: string; effectiveDate?: string; stripeSubId?: string; error?: string }
      if (!res.ok || !data.ok) {
        setCancelPreviewError(data.error ?? "Could not load cancellation preview")
      } else {
        setCancelPreview({ effectiveDateDisplay: data.effectiveDateDisplay ?? "", effectiveDate: data.effectiveDate ?? "", stripeSubId: data.stripeSubId ?? "" })
      }
    } catch {
      setCancelPreviewError("Request failed")
    }
    setLoadingCancelPreview(false)
  }

  async function submitCancel() {
    if (!cancelPreview) return
    setSubmittingCancel(true)
    setCancelPreviewError("")
    try {
      const session = await fetchAuthSession()
      const token = session.tokens?.accessToken?.toString() ?? ""
      const res = await fetch("/api/admin/coaching/cancel", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailParam, reason: cancelReason || undefined }),
      })
      const data = await res.json() as { ok?: boolean; effectiveDateDisplay?: string; error?: string }
      if (!res.ok || !data.ok) {
        setCancelPreviewError(data.error ?? "Cancellation failed")
      } else {
        setCancelDone(data.effectiveDateDisplay ?? cancelPreview.effectiveDateDisplay)
        setCancelPreview(null)
        setClient((c) => c ? { ...c, cancellationScheduledAt: new Date().toISOString() } : c)
      }
    } catch {
      setCancelPreviewError("Request failed")
    }
    setSubmittingCancel(false)
  }

  async function saveCommitment() {
    if (!commitmentForm.commitmentType) return
    setSavingCommitment(true)
    setCommitmentError("")
    try {
      const session = await fetchAuthSession()
      const token = session.tokens?.accessToken?.toString() ?? ""
      const body: Record<string, unknown> = {
        email: emailParam,
        commitmentType: commitmentForm.commitmentType,
      }
      if (commitmentForm.approvedPriceInCents) body.approvedPriceInCents = Number(commitmentForm.approvedPriceInCents)
      if (commitmentForm.subscriptionStartDate) body.subscriptionStartDate = new Date(commitmentForm.subscriptionStartDate).toISOString()
      const res = await fetch("/api/admin/coaching/set-commitment", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json() as { ok?: boolean; error?: string }
      if (!res.ok || !data.ok) {
        setCommitmentError(data.error ?? "Failed to save commitment")
      } else {
        setClient((c) => c ? {
          ...c,
          commitmentType: commitmentForm.commitmentType as "THREE_MONTH_MINIMUM" | "MONTH_TO_MONTH",
          commitmentMonths: commitmentForm.commitmentType === "THREE_MONTH_MINIMUM" ? 3 : 0,
          commitmentNeedsConfirmation: false,
          ...(commitmentForm.approvedPriceInCents ? { approvedPriceInCents: Number(commitmentForm.approvedPriceInCents) } : {}),
          ...(commitmentForm.subscriptionStartDate ? { subscriptionStartDate: new Date(commitmentForm.subscriptionStartDate).toISOString() } : {}),
        } : c)
      }
    } catch {
      setCommitmentError("Request failed")
    }
    setSavingCommitment(false)
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
    return <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "3rem", color: "var(--ca-muted)" }}><Spinner /><span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem" }}>Loading client…</span></div>
  }

  if (!client) {
    return (
      <div style={{ padding: "3rem", textAlign: "center" }}>
        <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.5rem", color: "var(--ca-muted)" }}>Client not found</p>
        <Link href="/admin/coaching/clients" style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: gold, textDecoration: "none" }}>← Back to Clients</Link>
      </div>
    )
  }

  const STATUS_COLORS: Record<string, string> = { ACTIVE: "var(--ca-ok)", PAUSED: "var(--ca-accent-mark)", INACTIVE: "var(--ca-muted)", PENDING_PAYMENT: "var(--ca-warn)" }
  const STATUS_LABELS: Record<string, string> = { ACTIVE: "ACTIVE", PAUSED: "PAUSED", INACTIVE: "INACTIVE", PENDING_PAYMENT: "AWAITING PAYMENT" }

  return (
    <div style={{ maxWidth: 900 }}>
      {/* Client hero */}
      <div style={{ background: "var(--ca-surface)", border: `1px solid ${border}`, padding: "24px", marginBottom: "1.5rem", display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6, flexWrap: "wrap" }}>
            <h2 style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ca-muted)", margin: 0 }}>Details and status</h2>
            <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", letterSpacing: "0.12em", color: STATUS_COLORS[client.status ?? "ACTIVE"] }}>
              {STATUS_LABELS[client.status ?? "ACTIVE"] ?? client.status ?? "ACTIVE"}
            </span>
          </div>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "var(--ca-muted)" }}>{client.email}</span>
            {client.phone && <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "var(--ca-muted)" }}>{client.phone}</span>}
            {client.startDate && <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "var(--ca-muted)" }}>Started {formatDate(client.startDate)}</span>}
          </div>
          {client.goal && (
            <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "var(--ca-muted)", marginTop: 8 }}>
              <span style={{ color: "var(--ca-muted)" }}>Goal: </span>{client.goal}
            </p>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(["PENDING_PAYMENT", "ACTIVE", "PAUSED", "INACTIVE"] as const).map((s) => (
            <button key={s} onClick={() => updateStatus(s)} style={{ background: client.status === s ? "var(--ca-raised)" : "none", border: `1px solid ${client.status === s ? "var(--ca-line)" : border}`, color: client.status === s ? STATUS_COLORS[s] : "var(--ca-muted)", padding: "6px 12px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>


      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
        {/* Current Program */}
        <SectionCard
          title="Current Program"
          action={
            <button onClick={() => setShowAssignProgram(true)} style={{ background: "none", border: "none", color: gold, fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", letterSpacing: "0.1em", cursor: "pointer", textTransform: "uppercase" }}>
              {program ? "Change" : "Assign"}
            </button>
          }
        >
          {program ? (
            <div>
              <Link href={`/admin/coaching/programs/${program.id}`} style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.85rem", fontWeight: 600, color: "var(--ca-text)", textDecoration: "none", display: "block", marginBottom: 4 }}>
                {program.name}
              </Link>
              <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "var(--ca-ok)", letterSpacing: "0.08em" }}>{program.status ?? "ACTIVE"}</span>
              <div style={{ marginTop: 12 }}>
                <Link href={`/admin/coaching/programs/${program.id}`} style={{ display: "inline-block", background: gold, color: "var(--ca-on-accent)", padding: "7px 14px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", textDecoration: "none" }}>
                  Edit Program
                </Link>
              </div>
            </div>
          ) : (
            <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "var(--ca-muted)" }}>No program assigned yet.</p>
          )}
        </SectionCard>

        <IntakeCard email={client.email} />

        {/* Recent Check-Ins */}
        <SectionCard
          title="Recent Check-Ins"
          action={
            <Link href={`/admin/coaching/clients/${encodeURIComponent(client.email)}/check-ins`} style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: gold, textDecoration: "none", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              View All
            </Link>
          }
        >
          {recentCheckIns.length === 0 ? (
            <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "var(--ca-muted)" }}>No check-ins yet.</p>
          ) : (
            recentCheckIns.map((ci) => (
              <div key={ci.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div>
                  <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "var(--ca-text)", margin: 0 }}>{formatDate(ci.submittedAt)}</p>
                  {ci.weight && <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "var(--ca-muted)", margin: 0 }}>{ci.weight} {ci.weightUnit ?? "LBS"}</p>}
                </div>
                <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: ci.status === "PENDING" ? gold : "var(--ca-ok)", letterSpacing: "0.1em" }}>
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
            <Link href={`/admin/coaching/clients/${encodeURIComponent(client.email)}/workouts`} style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: gold, textDecoration: "none", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              View All
            </Link>
          }
        >
          {recentWorkouts.length === 0 ? (
            <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "var(--ca-muted)" }}>No workouts logged yet.</p>
          ) : (
            recentWorkouts.map((w) => (
              <Link
                key={w.id}
                href={`/admin/coaching/clients/${encodeURIComponent(client.email)}/workouts`}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, textDecoration: "none" }}
              >
                <div>
                  <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "var(--ca-text)", margin: 0 }}>
                    {formatDate(w.completedAt)} · {w.dayLabel}
                  </p>
                  <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "var(--ca-muted)", margin: 0 }}>
                    Week {w.weekNumber}{w.overallRpe ? ` · RPE ${w.overallRpe}` : ""}
                  </p>
                </div>
                <span style={{
                  fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", letterSpacing: "0.08em",
                  color: w.hasFeedback ? "var(--ca-ok)" : gold,
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
            <button onClick={() => setEditingNotes(!editingNotes)} style={{ background: "none", border: "none", color: gold, fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", letterSpacing: "0.1em", cursor: "pointer", textTransform: "uppercase" }}>
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
                style={{ width: "100%", background: "var(--ca-bg)", border: `1px solid ${border}`, color: "var(--ca-text)", padding: "9px 12px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", outline: "none", resize: "vertical", boxSizing: "border-box", marginBottom: 10 }}
              />
              <button onClick={saveNotes} disabled={savingNotes} style={{ background: gold, color: "var(--ca-on-accent)", border: "none", padding: "8px 18px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer" }}>
                {savingNotes ? "Saving…" : "Save"}
              </button>
            </div>
          ) : (
            <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: notes ? "var(--ca-muted)" : "var(--ca-line)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
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
                <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "var(--ca-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</span>
                <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "var(--ca-muted)" }}>{value}</span>
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
            <button onClick={() => setEditingCoachMessage((v) => !v)} style={{ background: "none", border: "none", color: gold, fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", letterSpacing: "0.1em", cursor: "pointer", textTransform: "uppercase" }}>
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
                style={{ width: "100%", background: "var(--ca-bg)", border: `1px solid ${border}`, color: "var(--ca-text)", padding: "10px 12px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.8rem", outline: "none", resize: "vertical", boxSizing: "border-box", marginBottom: 10, lineHeight: 1.5 }}
              />
              <button onClick={saveCoachMessage} disabled={savingCoachMessage} style={{ background: gold, color: "var(--ca-on-accent)", border: "none", padding: "8px 18px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer" }}>
                {savingCoachMessage ? "Saving…" : "Save Message"}
              </button>
            </div>
          ) : coachMessage ? (
            <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.85rem", color: "var(--ca-text)", lineHeight: 1.6, margin: 0, fontStyle: "italic" }}>
              &ldquo;{coachMessage}&rdquo;
            </p>
          ) : (
            <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "var(--ca-muted)", margin: 0 }}>
              No message set. Add one to give this client a personal coaching touch on their home page.
            </p>
          )}
        </SectionCard>
      </div>

      {/* Goals */}
      <div id="goals" style={{ marginTop: "1rem", scrollMarginTop: 80 }}>
        <SectionCard
          title="Goals"
          action={
            <button onClick={() => setShowAddGoal(true)} style={{ background: "none", border: "none", color: gold, fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", letterSpacing: "0.1em", cursor: "pointer", textTransform: "uppercase" }}>
              + Add Goal
            </button>
          }
        >
          {goals.length === 0 && !showAddGoal ? (
            <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "var(--ca-muted)", margin: 0 }}>
              No goals set. Add a body composition, strength, habit, or custom goal.
            </p>
          ) : (
            <>
              {goals.map((g) => (
                <div key={g.id} style={{ padding: "10px 0", borderBottom: `1px solid ${border}` }}>
                  {/* Header row */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: gold, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 2px" }}>
                        {(g.type || "").replace(/-/g, " ")}
                      </p>
                      <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.82rem", color: "var(--ca-text)", margin: 0, fontWeight: 600 }}>{g.label}</p>
                      <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "var(--ca-muted)", margin: "3px 0 0" }}>
                        {g.startValue ?? "—"} → {g.targetValue ?? "—"} {g.unit ?? ""}
                        {g.targetDate ? ` · by ${new Date(`${g.targetDate.slice(0, 10)}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}` : ""}
                      </p>
                      {g.notes && <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "var(--ca-text)", margin: "4px 0 0", whiteSpace: "pre-wrap" }}>{g.notes}</p>}
                    </div>
                    <button onClick={() => setEditingGoal(editingGoal === g.id ? null : g.id)} aria-label={`Edit ${g.label ?? "goal"}`} style={{ background: "none", border: "none", color: gold, cursor: "pointer", padding: "2px 6px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", flexShrink: 0 }}>Edit</button>
                    <button onClick={() => deleteGoal(g.id)} style={{ background: "none", border: "none", color: "var(--ca-muted)", cursor: "pointer", padding: "2px 6px", fontSize: "1rem", flexShrink: 0 }}>×</button>
                  </div>
                  {/* Current + status row — wraps on mobile */}
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, flex: "1 1 130px" }}>
                      <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "var(--ca-muted)", letterSpacing: "0.08em", textTransform: "uppercase", flexShrink: 0 }}>Current:</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        key={`cur-${g.id}-${g.currentValue ?? ""}`}
                        defaultValue={g.currentValue ?? ""}
                        onBlur={(e) => updateGoalCurrent(g.id, e.target.value, g.status ?? "ON_TRACK")}
                        placeholder="—"
                        style={{ flex: 1, minWidth: 0, background: "var(--ca-bg)", border: `1px solid ${border}`, color: "var(--ca-text)", padding: "6px 8px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", outline: "none", borderRadius: 2, boxSizing: "border-box" }}
                      />
                    </div>
                    <select
                      defaultValue={g.status ?? "ON_TRACK"}
                      onChange={(e) => updateGoalCurrent(g.id, "", e.target.value)}
                      style={{ flex: "1 1 130px", minWidth: 0, background: "var(--ca-bg)", border: `1px solid ${border}`, color: "var(--ca-text)", padding: "6px 8px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", outline: "none", borderRadius: 2, boxSizing: "border-box" }}
                    >
                      <option value="ON_TRACK">On track</option>
                      <option value="NEEDS_ATTENTION">Needs attention</option>
                      <option value="ACHIEVED">Achieved</option>
                    </select>
                  </div>
                  {editingGoal === g.id && (
                    <GoalForm key={`edit-${g.id}`} heading="Edit goal" initial={goalToForm(g)} saveLabel="Save goal" onSave={(v) => saveGoalEdit(g.id, v)} onCancel={() => setEditingGoal(null)} />
                  )}
                </div>
              ))}

              {showAddGoal && (
                <GoalForm heading="New goal" initial={EMPTY_GOAL} saveLabel="Add goal" onSave={addGoal} onCancel={() => setShowAddGoal(false)} />
              )}
            </>
          )}
        </SectionCard>
      </div>

      {/* Assign program modal */}
      {showAssignProgram && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setShowAssignProgram(false)}>
          <div style={{ background: "var(--ca-raised)", border: `1px solid ${border}`, borderRadius: 2, width: "100%", maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: "20px 24px", borderBottom: `1px solid ${border}` }}>
              <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.3rem", color: "var(--ca-text)", margin: 0 }}>Assign Program</p>
            </div>
            <div style={{ padding: "20px 24px" }}>
              <select
                value={selectedProgramId}
                onChange={(e) => setSelectedProgramId(e.target.value)}
                style={{ width: "100%", background: "var(--ca-surface)", border: `1px solid ${border}`, color: "var(--ca-text)", padding: "10px 12px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", outline: "none", marginBottom: 16 }}
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
                <button onClick={assignProgram} disabled={!selectedProgramId || savingProgram} style={{ background: selectedProgramId ? gold : "var(--ca-line)", color: "var(--ca-on-accent)", border: "none", padding: "10px 22px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", cursor: selectedProgramId ? "pointer" : "not-allowed" }}>
                  {savingProgram ? "Assigning…" : "Assign Program"}
                </button>
                <button onClick={() => setShowAssignProgram(false)} style={{ background: "none", border: `1px solid ${border}`, color: "var(--ca-muted)", padding: "10px 18px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", cursor: "pointer" }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subscription & Commitment */}
      <div style={{ marginTop: "1rem" }}>
        <SectionCard title="Subscription &amp; Commitment">
          {client.commitmentNeedsConfirmation ? (
            <div>
              <div style={{ background: "var(--ca-accent-tint)", border: `1px solid var(--ca-accent-tint)`, padding: "10px 14px", marginBottom: 16, borderRadius: 2 }}>
                <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.72rem", color: "var(--ca-accent-mark)", margin: 0 }}>
                  Commitment type not confirmed for this client. Set it below so they can manage their subscription independently.
                </p>
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                <div>
                  <label style={{ display: "block", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "var(--ca-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
                    Commitment type *
                  </label>
                  <select
                    value={commitmentForm.commitmentType}
                    onChange={(e) => setCommitmentForm((f) => ({ ...f, commitmentType: e.target.value }))}
                    style={{ width: "100%", background: "var(--ca-bg)", border: `1px solid ${border}`, color: "var(--ca-text)", padding: "9px 12px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", outline: "none", boxSizing: "border-box" }}
                  >
                    <option value="">Select…</option>
                    <option value="THREE_MONTH_MINIMUM">3-month minimum</option>
                    <option value="MONTH_TO_MONTH">Month-to-month</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "var(--ca-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
                    Approved price (cents, optional)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 39700"
                    disabled={!!client.stripeSubscriptionId}
                    value={commitmentForm.approvedPriceInCents}
                    onChange={(e) => setCommitmentForm((f) => ({ ...f, approvedPriceInCents: e.target.value }))}
                    style={{ width: "100%", background: client.stripeSubscriptionId ? "var(--ca-surface)" : "var(--ca-bg)", border: `1px solid ${border}`, color: client.stripeSubscriptionId ? "var(--ca-muted)" : "var(--ca-text)", padding: "9px 12px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", outline: "none", boxSizing: "border-box", cursor: client.stripeSubscriptionId ? "not-allowed" : "text" }}
                  />
                  {/* This figure is what the client sees in their portal, and
                      nothing here reaches Stripe. While a subscription is live
                      the two must agree, so it is read-only rather than a way
                      to display a price nobody is being charged. */}
                  <p style={{ fontSize: "0.75rem", color: "var(--ca-muted)", marginTop: 6, lineHeight: 1.5 }}>
                    {client.stripeSubscriptionId
                      ? "Locked: this client has a live Stripe subscription. Change what they pay under Manage billing, so Stripe and this record stay the same."
                      : "Shown to the client in their portal. This does not create or change any billing."}
                  </p>
                </div>
                <div>
                  <label style={{ display: "block", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "var(--ca-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
                    Subscription start date (optional)
                  </label>
                  <input
                    type="date"
                    value={commitmentForm.subscriptionStartDate}
                    onChange={(e) => setCommitmentForm((f) => ({ ...f, subscriptionStartDate: e.target.value }))}
                    style={{ width: "100%", background: "var(--ca-bg)", border: `1px solid ${border}`, color: "var(--ca-text)", padding: "9px 12px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                {commitmentError && (
                  <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "var(--ca-warn)", margin: 0 }}>{commitmentError}</p>
                )}
                <button
                  onClick={saveCommitment}
                  disabled={!commitmentForm.commitmentType || savingCommitment}
                  style={{ background: commitmentForm.commitmentType ? gold : "var(--ca-line)", color: "var(--ca-on-accent)", border: "none", padding: "9px 20px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", cursor: commitmentForm.commitmentType ? "pointer" : "not-allowed", alignSelf: "start" }}
                >
                  {savingCommitment ? "Saving…" : "Confirm commitment"}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {[
                { label: "Price", value: client.approvedPriceInCents ? `$${(client.approvedPriceInCents / 100).toFixed(client.approvedPriceInCents % 100 === 0 ? 0 : 2)}/month` : "—" },
                { label: "Commitment", value: client.commitmentType === "THREE_MONTH_MINIMUM" ? "3-month minimum" : client.commitmentType === "MONTH_TO_MONTH" ? "Month-to-month" : "—" },
                { label: "Subscription start", value: formatDate(client.subscriptionStartDate) },
                {
                  label: "Commitment ends",
                  value: client.commitmentType === "THREE_MONTH_MINIMUM" && client.subscriptionStartDate && client.commitmentMonths
                    ? (() => { const d = new Date(client.subscriptionStartDate); d.setMonth(d.getMonth() + client.commitmentMonths); return formatDate(d.toISOString()) })()
                    : "—",
                },
                { label: "Cancellation scheduled", value: formatDate(client.cancellationScheduledAt) },
                { label: "Cancellation effective", value: formatDate(client.cancellationEffectiveDate) },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "var(--ca-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</span>
                  <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "var(--ca-muted)" }}>{value}</span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Payments and bundle credit, read-only */}
      <div style={{ marginTop: "1rem" }}>
        <SectionCard title="Payments &amp; Bundle Credit">
          <PaymentSummaryPanel email={client.email} />
        </SectionCard>
      </div>

      {/* Billing overview — Stripe subscriptions, invoice history, manual subscription linking */}
      <div style={{ marginTop: "1rem" }}>
        <SectionCard title="Billing">
          <BillingPanel
            email={client.email}
            onLinkSubscription={!client.stripeSubscriptionId && !linkSubDone ? handleLinkSubscription : undefined}
          />
          {linkingSubscription && (
            <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.72rem", color: "var(--ca-muted)", marginTop: 10 }}>
              Searching Stripe for active coaching subscription…
            </p>
          )}
          {linkSubDone && (
            <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.72rem", color: "var(--ca-ok)", marginTop: 10 }}>
              Subscription linked successfully.
            </p>
          )}
          {linkSubError && (
            <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.72rem", color: "var(--ca-warn)", marginTop: 10 }}>
              {linkSubError}
            </p>
          )}
        </SectionCard>
      </div>

      {/* Admin Cancel Coaching */}
      {client.status === "ACTIVE" && !client.cancellationScheduledAt && !cancelDone && (
        <div style={{ marginTop: "1rem" }}>
          <SectionCard title="Cancel Coaching">
            {!cancelPreview ? (
              <div>
                <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "var(--ca-muted)", lineHeight: 1.7, margin: "0 0 16px" }}>
                  Schedules cancellation at the end of the client&apos;s current billing period. Coaching access remains active through that date; Stripe will not charge again after it.
                </p>
                {cancelPreviewError && (
                  <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "var(--ca-warn)", margin: "0 0 12px" }}>{cancelPreviewError}</p>
                )}
                <button
                  onClick={loadCancelPreview}
                  disabled={loadingCancelPreview}
                  style={{ background: "transparent", border: `1px solid var(--ca-warn)`, color: "var(--ca-warn)", padding: "9px 18px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", cursor: loadingCancelPreview ? "not-allowed" : "pointer", opacity: loadingCancelPreview ? 0.6 : 1 }}
                >
                  {loadingCancelPreview ? "Loading…" : "Cancel coaching at end of billing period →"}
                </button>
              </div>
            ) : (
              <div>
                <div style={{ background: "var(--ca-accent-tint)", border: `1px solid var(--ca-accent-tint)`, padding: "14px 16px", marginBottom: 16, borderRadius: 2 }}>
                  <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "var(--ca-accent-mark)", margin: "0 0 6px", fontWeight: 600 }}>
                    Cancellation preview
                  </p>
                  <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.78rem", color: "var(--ca-text)", margin: "0 0 4px" }}>
                    {client.displayName} will retain coaching access through <strong>{cancelPreview.effectiveDateDisplay}</strong>.
                  </p>
                  <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "var(--ca-muted)", margin: 0 }}>
                    No further Stripe payments will be collected after that date.
                  </p>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "var(--ca-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
                    Reason (optional — for your records)
                  </label>
                  <input
                    type="text"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="e.g. Client requested, payment issues…"
                    style={{ width: "100%", background: "var(--ca-bg)", border: `1px solid ${border}`, color: "var(--ca-text)", padding: "9px 12px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                {cancelPreviewError && (
                  <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "var(--ca-warn)", margin: "0 0 10px" }}>{cancelPreviewError}</p>
                )}
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    onClick={() => { setCancelPreview(null); setCancelPreviewError(""); setCancelReason("") }}
                    style={{ background: "transparent", border: `1px solid ${border}`, color: "var(--ca-muted)", padding: "9px 16px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", cursor: "pointer" }}
                  >
                    Keep coaching
                  </button>
                  <button
                    onClick={submitCancel}
                    disabled={submittingCancel}
                    style={{ background: "transparent", border: `1px solid var(--ca-warn)`, color: "var(--ca-warn)", padding: "9px 18px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", cursor: submittingCancel ? "not-allowed" : "pointer", opacity: submittingCancel ? 0.6 : 1 }}
                  >
                    {submittingCancel ? "Scheduling…" : `Confirm — cancel coaching after ${cancelPreview.effectiveDateDisplay}`}
                  </button>
                </div>
              </div>
            )}
          </SectionCard>
        </div>
      )}
      {cancelDone && (
        <div style={{ marginTop: "1rem", background: "var(--ca-ok-tint)", border: `1px solid var(--ca-ok-tint)`, padding: "14px 20px" }}>
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.72rem", color: "var(--ca-ok)", margin: 0 }}>
            Cancellation scheduled. {client.displayName} retains access through <strong>{cancelDone}</strong>. Client and admin notified.
          </p>
        </div>
      )}
      {client.cancellationScheduledAt && !cancelDone && (
        <div style={{ marginTop: "1rem", background: "var(--ca-surface)", border: `1px solid ${border}`, padding: "14px 20px" }}>
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.72rem", color: "var(--ca-muted)", margin: 0 }}>
            Cancellation already scheduled
            {client.cancellationEffectiveDate ? ` — coaching active through ${new Date(client.cancellationEffectiveDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}` : ""}.
          </p>
        </div>
      )}

      {/* Danger zone */}
      <div style={{ marginTop: "2.5rem", border: `1px solid var(--ca-danger-tint)`, background: "var(--ca-danger-tint)", padding: "16px 20px" }}>
        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--ca-danger)", margin: "0 0 6px" }}>
          Danger zone
        </p>
        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.72rem", color: "var(--ca-muted)", margin: "0 0 12px", lineHeight: 1.5 }}>
          Permanently remove this client and all their coaching data. Their Cognito login account will stay.
        </p>
        <button
          onClick={() => { setDeleteConfirmText(""); setDeleteError(""); setShowDeleteModal(true) }}
          style={{ background: "none", border: `1px solid var(--ca-danger-tint)`, color: "var(--ca-danger)", padding: "9px 16px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer" }}
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
            style={{ background: "var(--ca-surface)", border: `1px solid ${border}`, borderLeft: `4px solid var(--ca-danger)`, padding: "1.5rem", maxWidth: 460, width: "100%" }}
          >
            <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--ca-danger)", margin: "0 0 6px" }}>
              Danger zone
            </p>
            <h3 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.35rem", color: "var(--ca-text)", margin: "0 0 10px", fontWeight: 500 }}>
              Delete {client.displayName}?
            </h3>
            <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.78rem", color: "var(--ca-muted)", margin: "0 0 12px", lineHeight: 1.5 }}>
              This permanently removes their coaching data — client record, workouts, check-ins, progress snapshots, goals, and message thread. Their Cognito login account will stay. This cannot be undone.
            </p>
            <label style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", fontWeight: 700, color: "var(--ca-muted)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
              Type DELETE to confirm
            </label>
            <input
              type="text"
              autoFocus
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              style={{ width: "100%", background: "var(--ca-bg)", border: `1px solid ${border}`, color: "var(--ca-text)", padding: "9px 12px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.85rem", outline: "none", boxSizing: "border-box", marginBottom: 12 }}
            />
            {deleteError && <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "var(--ca-danger)", margin: "0 0 10px" }}>{deleteError}</p>}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setShowDeleteModal(false)} style={{ background: "none", border: `1px solid ${border}`, color: "var(--ca-muted)", padding: "9px 16px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>
                Cancel
              </button>
              <button
                onClick={handleDeleteClient}
                disabled={deleteConfirmText !== "DELETE" || deleting}
                style={{
                  background: deleteConfirmText === "DELETE" && !deleting ? "var(--ca-danger)" : "var(--ca-line)",
                  color: "var(--ca-text)", border: "none", padding: "9px 20px",
                  fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
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
    </div>
  )
}
