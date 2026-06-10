"use client"

import { useState, useEffect } from "react"
import { generateClient } from "aws-amplify/data"
import { fetchAuthSession } from "aws-amplify/auth"
import Link from "next/link"
import type { Schema } from "@/lib/amplifyConfig"
import type { CoachingApplication } from "@/lib/authTokens"

const gold = "#c9a96e"
const border = "#2a2a2a"
const cream = "#f0e6d3"
const muted = "#888"

type PendingCheckIn = {
  id: string
  clientEmail: string
  submittedAt: string
}

type RecentClient = {
  email: string
  displayName: string
  status: string | null
  startDate: string | null
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const hrs = Math.floor(diff / 3_600_000)
  if (hrs < 1) return `${Math.floor(diff / 60_000)}m ago`
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function StatCard({ label, value, sub, href }: { label: string; value: number | string; sub: string; href?: string }) {
  const inner = (
    <div style={{ background: "#161616", border: `1px solid ${border}`, padding: "1.5rem", transition: "border-color 0.15s" }}>
      <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: muted, marginBottom: "0.75rem" }}>
        {label}
      </p>
      <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "2.5rem", fontWeight: 300, color: gold, lineHeight: 1 }}>
        {value}
      </p>
      <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", color: "#555", marginTop: "0.5rem" }}>
        {sub}
      </p>
    </div>
  )
  if (href) return <Link href={href} style={{ textDecoration: "none" }}>{inner}</Link>
  return inner
}

function QuickAction({ label, href, primary }: { label: string; href: string; primary?: boolean }) {
  return (
    <Link href={href} style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      padding: "0.65rem 1.25rem", background: primary ? gold : "transparent",
      border: `1px solid ${primary ? gold : border}`, color: primary ? "#0a0a0a" : muted,
      fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", fontWeight: 600,
      letterSpacing: "0.1em", textTransform: "uppercase", textDecoration: "none",
    }}>
      {label}
    </Link>
  )
}

export default function AdminCoachingDashboard() {
  const [loading, setLoading] = useState(true)
  const [counts, setCounts] = useState({ clients: 0, pending: 0, exercises: 0, programs: 0, pendingApplications: 0 })
  const [pendingCheckIns, setPendingCheckIns] = useState<PendingCheckIn[]>([])
  const [recentClients, setRecentClients] = useState<RecentClient[]>([])

  useEffect(() => {
    async function load() {
      try {
        const db = generateClient<Schema>({ authMode: "userPool" })
        const session = await fetchAuthSession()
        const token = session.tokens?.accessToken?.toString() ?? ""

        const [clientsRes, checkInsRes, exercisesRes, programsRes, appsRes] = await Promise.allSettled([
          db.models.CoachingClient.list({ authMode: "userPool" }),
          db.models.CoachingCheckIn.list({ authMode: "userPool" }),
          db.models.Exercise.list({ authMode: "userPool" }),
          db.models.CoachingProgram.list({ authMode: "userPool" }),
          fetch("/api/admin/coaching/applications", { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json() as Promise<{ applications: CoachingApplication[] }>),
        ])

        const clients = clientsRes.status === "fulfilled" ? clientsRes.value.data : []
        const checkIns = checkInsRes.status === "fulfilled" ? checkInsRes.value.data : []
        const exercises = exercisesRes.status === "fulfilled" ? exercisesRes.value.data : []
        const programs = programsRes.status === "fulfilled" ? programsRes.value.data : []
        const applications = appsRes.status === "fulfilled" ? appsRes.value.applications : []

        const activeClients = clients.filter((c) => c.status === "ACTIVE")
        const pending = checkIns.filter((ci) => (ci.status ?? "PENDING") === "PENDING")
        const activeExercises = exercises.filter((e) => e.status !== "INACTIVE")
        const activePrograms = programs.filter((p) => p.status !== "ARCHIVED")
        const pendingApps = applications.filter((a) => a.status === "PENDING")

        setCounts({
          clients: activeClients.length,
          pending: pending.length,
          exercises: activeExercises.length,
          programs: activePrograms.length,
          pendingApplications: pendingApps.length,
        })

        setPendingCheckIns(
          pending
            .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))
            .slice(0, 5)
            .map((ci) => ({ id: ci.id, clientEmail: ci.clientEmail, submittedAt: ci.submittedAt }))
        )

        setRecentClients(
          clients
            .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
            .slice(0, 5)
            .map((c) => ({ email: c.email, displayName: c.displayName, status: c.status ?? null, startDate: c.startDate ?? null }))
        )
      } catch { /* handled by layout */ }
      setLoading(false)
    }
    load()
  }, [])

  const STATUS_COLOR: Record<string, string> = { ACTIVE: "#5c9e6a", PAUSED: gold, INACTIVE: "#444" }

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "2rem", fontWeight: 300, color: cream, marginBottom: "0.5rem" }}>
        Coaching
      </h1>
      <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: muted, marginBottom: "2.5rem" }}>
        Manage your online coaching clients
      </p>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "2.5rem" }}>
        <StatCard label="Active Clients" value={loading ? "—" : counts.clients} sub="coaching clients" href="/admin/coaching/clients" />
        <StatCard label="Applications" value={loading ? "—" : counts.pendingApplications} sub="pending review" href="/admin/coaching/applications" />
        <StatCard label="Pending Check-Ins" value={loading ? "—" : counts.pending} sub="awaiting review" href="/admin/coaching/check-ins" />
        <StatCard label="Exercises" value={loading ? "—" : counts.exercises} sub="in your library" href="/admin/coaching/exercises" />
        <StatCard label="Programs" value={loading ? "—" : counts.programs} sub="saved programs" href="/admin/coaching/programs" />
      </div>

      {/* Quick actions */}
      <div style={{ marginBottom: "2.5rem" }}>
        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: muted, marginBottom: "1rem" }}>
          Quick Actions
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
          <QuickAction label="Applications" href="/admin/coaching/applications" primary />
          <QuickAction label="Add Client" href="/admin/coaching/clients/new" />
          <QuickAction label="Build Program" href="/admin/coaching/programs/new" />
          <QuickAction label="Review Check-Ins" href="/admin/coaching/check-ins" />
          <QuickAction label="Exercise Library" href="/admin/coaching/exercises" />
          <QuickAction label="Messages" href="/admin/coaching/messages" />
          <QuickAction label="Tasks" href="/admin/coaching/tasks" />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
        {/* Pending check-ins */}
        <div style={{ background: "#111111", border: `1px solid ${border}`, padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: muted, margin: 0 }}>
              Pending Check-Ins
            </p>
            {counts.pending > 0 && (
              <Link href="/admin/coaching/check-ins" style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", color: gold, textDecoration: "none" }}>
                View all →
              </Link>
            )}
          </div>
          {loading || pendingCheckIns.length === 0 ? (
            <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1rem", color: "#555", fontStyle: "italic" }}>
              {loading ? "Loading…" : "No check-ins awaiting review."}
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {pendingCheckIns.map((ci) => (
                <Link key={ci.id} href={`/admin/coaching/check-ins/${ci.id}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", textDecoration: "none", padding: "8px 0", borderBottom: `1px solid ${border}` }}>
                  <div>
                    <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.8rem", color: cream, margin: 0 }}>{ci.clientEmail}</p>
                    <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", color: muted, margin: 0 }}>{timeAgo(ci.submittedAt)}</p>
                  </div>
                  <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", color: gold, border: `1px solid ${gold}`, padding: "3px 8px", borderRadius: 3 }}>
                    Review
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent clients */}
        <div style={{ background: "#111111", border: `1px solid ${border}`, padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: muted, margin: 0 }}>
              Clients
            </p>
            <Link href="/admin/coaching/clients" style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", color: gold, textDecoration: "none" }}>
              View all →
            </Link>
          </div>
          {loading || recentClients.length === 0 ? (
            <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1rem", color: "#555", fontStyle: "italic" }}>
              {loading ? "Loading…" : <>No clients yet. <Link href="/admin/coaching/clients/new" style={{ color: gold }}>Add your first client →</Link></>}
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {recentClients.map((c) => (
                <Link key={c.email} href={`/admin/coaching/clients/${encodeURIComponent(c.email)}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", textDecoration: "none", padding: "8px 0", borderBottom: `1px solid ${border}` }}>
                  <div>
                    <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.8rem", color: cream, margin: 0 }}>{c.displayName}</p>
                    <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", color: muted, margin: 0 }}>{c.email}</p>
                  </div>
                  {c.status && (
                    <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, color: STATUS_COLOR[c.status] ?? muted }}>
                      {c.status}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
