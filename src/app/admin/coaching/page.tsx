"use client"

import Link from "next/link"

const gold = "#c9a96e"
const border = "#2a2a2a"

function StatCard({ label, value, sub, href }: { label: string; value: number | string; sub: string; href?: string }) {
  const inner = (
    <div style={{ background: "#161616", border: `1px solid ${border}`, padding: "1.5rem", transition: "border-color 0.15s" }}>
      <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#888", marginBottom: "0.75rem" }}>
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
  if (href) {
    return <Link href={href} style={{ textDecoration: "none" }}>{inner}</Link>
  }
  return inner
}

function QuickAction({ label, href, primary }: { label: string; href: string; primary?: boolean }) {
  return (
    <Link
      href={href}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0.65rem 1.25rem",
        background: primary ? gold : "transparent",
        border: `1px solid ${primary ? gold : border}`,
        color: primary ? "#0a0a0a" : "#888",
        fontFamily: "var(--font-montserrat), sans-serif",
        fontSize: "0.65rem",
        fontWeight: 600,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        textDecoration: "none",
        transition: "all 0.15s",
      }}
    >
      {label}
    </Link>
  )
}

export default function AdminCoachingDashboard() {
  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "2rem", fontWeight: 300, color: "#f0e6d3", marginBottom: "0.5rem" }}>
        Coaching
      </h1>
      <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#888", marginBottom: "2.5rem" }}>
        Manage your online coaching clients
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "3rem" }}>
        <StatCard label="Active Clients" value="—" sub="coaching clients" href="/admin/coaching/clients" />
        <StatCard label="Check-Ins Pending" value="—" sub="awaiting review" href="/admin/coaching/check-ins" />
        <StatCard label="Exercises" value="—" sub="in your library" href="/admin/coaching/exercises" />
        <StatCard label="Programs" value="—" sub="saved programs" href="/admin/coaching/programs" />
      </div>

      <div style={{ marginBottom: "3rem" }}>
        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#888", marginBottom: "1rem" }}>
          Quick Actions
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
          <QuickAction label="Add Client" href="/admin/coaching/clients/new" primary />
          <QuickAction label="Build Program" href="/admin/coaching/programs/new" />
          <QuickAction label="Review Check-Ins" href="/admin/coaching/check-ins" />
          <QuickAction label="Exercise Library" href="/admin/coaching/exercises" />
          <QuickAction label="Messages" href="/admin/coaching/messages" />
          <QuickAction label="Tasks" href="/admin/coaching/tasks" />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
        <div style={{ background: "#111111", border: `1px solid ${border}`, padding: "1.5rem" }}>
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#888", marginBottom: "1rem" }}>
            Clients
          </p>
          <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1rem", color: "#555", fontStyle: "italic" }}>
            No clients yet. <Link href="/admin/coaching/clients/new" style={{ color: gold }}>Add your first client →</Link>
          </p>
        </div>

        <div style={{ background: "#111111", border: `1px solid ${border}`, padding: "1.5rem" }}>
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#888", marginBottom: "1rem" }}>
            Pending Check-Ins
          </p>
          <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1rem", color: "#555", fontStyle: "italic" }}>
            No check-ins awaiting review.
          </p>
        </div>
      </div>
    </div>
  )
}
