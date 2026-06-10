"use client"

import { useState, useEffect } from "react"
import { generateClient } from "aws-amplify/data"
import Link from "next/link"
import type { Schema } from "@/lib/amplifyConfig"

const gold = "#c9a96e"
const border = "#2a2a2a"
const cream = "#f0e6d3"
const muted = "#888"

type Task = {
  id: string
  title: string
  clientEmail: string | null
  dueDate: string | null
  completedAt: string | null
  priority: "HIGH" | "MEDIUM" | "LOW" | null
  notes: string | null
}

const PRIORITY_COLOR: Record<string, string> = { HIGH: "#d97460", MEDIUM: gold, LOW: "#5c9e6a" }

function formatDue(iso: string) {
  const d = new Date(iso)
  const diff = d.getTime() - Date.now()
  const days = Math.ceil(diff / 86_400_000)
  if (days < 0) return { label: `${Math.abs(days)}d overdue`, color: "#d97460" }
  if (days === 0) return { label: "Due today", color: gold }
  if (days === 1) return { label: "Due tomorrow", color: gold }
  return { label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), color: muted }
}

function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
      <div style={{ width: 20, height: 20, border: `2px solid ${border}`, borderTop: `2px solid ${gold}`, borderRadius: "50%", animation: "spin 0.7s linear infinite" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}

export default function AdminTasksPage() {
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<Task[]>([])
  const [filter, setFilter] = useState<"PENDING" | "COMPLETED" | "ALL">("PENDING")
  const [newTitle, setNewTitle] = useState("")
  const [newClient, setNewClient] = useState("")
  const [newDue, setNewDue] = useState("")
  const [newPriority, setNewPriority] = useState<"HIGH" | "MEDIUM" | "LOW">("MEDIUM")
  const [adding, setAdding] = useState(false)
  const [showForm, setShowForm] = useState(false)

  async function loadTasks() {
    try {
      const db = generateClient<Schema>({ authMode: "userPool" })
      const { data } = await db.models.CoachTask.list({ authMode: "userPool" })
      setTasks(
        data
          .sort((a, b) => {
            if (!!a.completedAt !== !!b.completedAt) return a.completedAt ? 1 : -1
            if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate)
            if (a.dueDate) return -1
            if (b.dueDate) return 1
            return (b.createdAt ?? "").localeCompare(a.createdAt ?? "")
          })
          .map((t) => ({
            id: t.id,
            title: t.title,
            clientEmail: t.clientEmail ?? null,
            dueDate: t.dueDate ?? null,
            completedAt: t.completedAt ?? null,
            priority: (t.priority ?? "MEDIUM") as Task["priority"],
            notes: t.notes ?? null,
          }))
      )
    } catch { /* handled by layout */ }
    setLoading(false)
  }

  useEffect(() => { loadTasks() }, [])

  async function toggleComplete(task: Task) {
    try {
      const db = generateClient<Schema>({ authMode: "userPool" })
      await db.models.CoachTask.update({
        id: task.id,
        completedAt: task.completedAt ? null : new Date().toISOString(),
      })
      await loadTasks()
    } catch (err) { console.error(err) }
  }

  async function addTask() {
    if (!newTitle.trim()) return
    setAdding(true)
    try {
      const db = generateClient<Schema>({ authMode: "userPool" })
      await db.models.CoachTask.create({
        title: newTitle.trim(),
        clientEmail: newClient.trim() || undefined,
        dueDate: newDue || undefined,
        priority: newPriority,
      })
      setNewTitle(""); setNewClient(""); setNewDue(""); setNewPriority("MEDIUM")
      setShowForm(false)
      await loadTasks()
    } catch (err) { console.error(err) }
    setAdding(false)
  }

  async function deleteTask(id: string) {
    try {
      const db = generateClient<Schema>({ authMode: "userPool" })
      await db.models.CoachTask.delete({ id })
      await loadTasks()
    } catch (err) { console.error(err) }
  }

  const filtered = tasks.filter((t) => {
    if (filter === "PENDING") return !t.completedAt
    if (filter === "COMPLETED") return !!t.completedAt
    return true
  })

  const pendingCount = tasks.filter((t) => !t.completedAt).length

  return (
    <div style={{ minHeight: "100vh", background: "#111", color: cream, padding: "2.5rem 2rem", fontFamily: "var(--font-montserrat), sans-serif" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <Link href="/admin/coaching" style={{ color: muted, fontSize: "0.75rem", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: "1rem" }}>
            ← Coaching
          </Link>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "2.2rem", fontWeight: 700, color: cream, margin: 0 }}>
              Tasks
              {pendingCount > 0 && (
                <span style={{ marginLeft: 12, display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: "50%", background: gold, color: "#111", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", fontWeight: 700, verticalAlign: "middle" }}>
                  {pendingCount}
                </span>
              )}
            </h1>
            <button
              onClick={() => setShowForm(!showForm)}
              style={{ background: gold, border: "none", color: "#111", padding: "9px 20px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", borderRadius: 4, letterSpacing: "0.05em" }}
            >
              + Add Task
            </button>
          </div>
        </div>

        {/* Add form */}
        {showForm && (
          <div style={{ background: "#161616", border: `1px solid ${gold}44`, borderRadius: 8, padding: "1.25rem", marginBottom: "1.25rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, marginBottom: 10 }}>
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addTask() }}
                placeholder="Task title"
                autoFocus
                style={{ background: "#111", border: `1px solid ${border}`, borderRadius: 4, padding: "8px 12px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.875rem", color: cream, outline: "none" }}
              />
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as "HIGH" | "MEDIUM" | "LOW")}
                style={{ background: "#111", border: `1px solid ${border}`, borderRadius: 4, padding: "8px 10px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: cream, outline: "none" }}
              >
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10 }}>
              <input
                value={newClient}
                onChange={(e) => setNewClient(e.target.value)}
                placeholder="Client email (optional)"
                style={{ background: "#111", border: `1px solid ${border}`, borderRadius: 4, padding: "8px 12px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.8rem", color: cream, outline: "none" }}
              />
              <input
                type="date"
                value={newDue}
                onChange={(e) => setNewDue(e.target.value)}
                style={{ background: "#111", border: `1px solid ${border}`, borderRadius: 4, padding: "8px 10px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.8rem", color: newDue ? cream : muted, outline: "none" }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { setShowForm(false); setNewTitle("") }} style={{ background: "transparent", border: `1px solid ${border}`, color: muted, padding: "8px 14px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", cursor: "pointer", borderRadius: 4 }}>
                  Cancel
                </button>
                <button onClick={addTask} disabled={adding || !newTitle.trim()} style={{ background: newTitle.trim() ? gold : "#2a2a2a", border: "none", color: newTitle.trim() ? "#111" : muted, padding: "8px 18px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", fontWeight: 700, cursor: newTitle.trim() ? "pointer" : "not-allowed", borderRadius: 4 }}>
                  {adding ? "Adding…" : "Add"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: "1.25rem" }}>
          {(["PENDING", "COMPLETED", "ALL"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} style={{ background: filter === f ? gold : "transparent", border: `1px solid ${filter === f ? gold : border}`, color: filter === f ? "#111" : muted, padding: "6px 16px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.72rem", fontWeight: filter === f ? 700 : 400, cursor: "pointer", borderRadius: 4, letterSpacing: "0.04em" }}>
              {f === "PENDING" ? `Pending${pendingCount > 0 ? ` (${pendingCount})` : ""}` : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {loading ? <Spinner /> : filtered.length === 0 ? (
          <div style={{ background: "#161616", border: `1px solid ${border}`, borderRadius: 8, padding: "3rem", textAlign: "center" }}>
            <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.2rem", color: muted }}>
              {filter === "PENDING" ? "All caught up — no pending tasks" : "No tasks"}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {filtered.map((task) => {
              const done = !!task.completedAt
              const due = task.dueDate ? formatDue(task.dueDate) : null
              return (
                <div key={task.id} style={{ background: "#161616", border: `1px solid ${done ? border : task.priority === "HIGH" ? "#3a1a1a" : border}`, borderRadius: 8, padding: "0.875rem 1rem", display: "flex", alignItems: "flex-start", gap: 12 }}>
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleComplete(task)}
                    style={{ width: 20, height: 20, borderRadius: 4, border: `1.5px solid ${done ? "#5c9e6a" : border}`, background: done ? "#5c9e6a" : "transparent", cursor: "pointer", flexShrink: 0, marginTop: 2, display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    {done && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </button>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 3 }}>
                      <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.875rem", fontWeight: 500, color: done ? muted : cream, textDecoration: done ? "line-through" : "none" }}>
                        {task.title}
                      </span>
                      {task.priority && !done && (
                        <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.08em", color: PRIORITY_COLOR[task.priority], border: `1px solid ${PRIORITY_COLOR[task.priority]}44`, padding: "1px 6px", borderRadius: 3 }}>
                          {task.priority}
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                      {task.clientEmail && (
                        <Link href={`/admin/coaching/clients/${encodeURIComponent(task.clientEmail)}`} style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", color: gold, textDecoration: "none" }}>
                          {task.clientEmail}
                        </Link>
                      )}
                      {due && (
                        <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", color: due.color }}>
                          {due.label}
                        </span>
                      )}
                      {task.notes && (
                        <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", color: muted }}>{task.notes}</span>
                      )}
                    </div>
                  </div>

                  <button onClick={() => deleteTask(task.id)} style={{ background: "transparent", border: "none", color: "#444", cursor: "pointer", padding: "2px 4px", fontSize: "1rem", lineHeight: 1, flexShrink: 0 }}>
                    ×
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
