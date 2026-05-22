"use client"

import { useEffect, useState } from "react"
import { generateClient } from "aws-amplify/data"
import type { Schema } from "@/lib/amplifyConfig"

const gold = "#c9a96e"
const border = "#2a2a2a"

type Contact = Schema["ContactSubmission"]["type"]

const STATUS_OPTIONS = ["New", "Replied", "Interested in Coaching", "Not Interested"]

function ContactCard({ contact, onDelete }: { contact: Contact; onDelete: (id: string) => void }) {
  const [status, setStatus] = useState(contact.status ?? "New")
  const [notes, setNotes] = useState(contact.notes ?? "")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function updateStatus(newStatus: string) {
    setStatus(newStatus)
    const client = generateClient<Schema>({ authMode: "userPool" })
    await client.models.ContactSubmission?.update({ id: contact.id, status: newStatus })
  }

  async function saveNotes() {
    setSaving(true)
    const client = generateClient<Schema>({ authMode: "userPool" })
    await client.models.ContactSubmission?.update({ id: contact.id, notes })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleDelete() {
    if (!confirm(`Delete message from ${contact.name}?`)) return
    setDeleting(true)
    const client = generateClient<Schema>({ authMode: "userPool" })
    await client.models.ContactSubmission?.delete({ id: contact.id })
    onDelete(contact.id)
  }

  const date = contact.createdAt
    ? new Date(contact.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : ""

  return (
    <div style={{ background: "#161616", border: `1px solid ${border}`, padding: "1.5rem", opacity: deleting ? 0.4 : 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", color: "#555" }}>{date}</span>
          <span style={{
            fontFamily: "var(--font-montserrat), sans-serif",
            fontSize: "0.55rem",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: contact.type === "coaching" ? gold : "#888",
            border: `1px solid ${contact.type === "coaching" ? gold : "#444"}`,
            padding: "2px 8px",
          }}>
            {contact.type === "coaching" ? "Coaching" : "Contact"}
          </span>
        </div>
        <button
          onClick={handleDelete}
          style={{ background: "none", border: "1px solid #3a2a2a", color: "#884444", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", letterSpacing: "0.1em", padding: "4px 10px", cursor: "pointer", flexShrink: 0 }}
        >
          Delete
        </button>
      </div>

      <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.25rem", fontWeight: 300, color: "#f0e6d3", marginBottom: "0.25rem" }}>
        {contact.name}
      </p>
      <a
        href={`mailto:${contact.email}`}
        style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: gold, textDecoration: "none", display: "block", marginBottom: "1rem" }}
      >
        {contact.email}
      </a>
      <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#aaa", lineHeight: 1.7, marginBottom: "1.25rem", whiteSpace: "pre-wrap" }}>
        {contact.message}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1rem", alignItems: "start" }}>
        <div>
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#555", marginBottom: "0.4rem" }}>Status</p>
          <select
            value={status}
            onChange={(e) => updateStatus(e.target.value)}
            style={{ width: "100%", background: "#0a0a0a", border: `1px solid ${border}`, color: "#f0e6d3", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", padding: "8px 10px", cursor: "pointer" }}
          >
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#555", marginBottom: "0.4rem" }}>Notes</p>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Add your notes..."
              style={{ flex: 1, background: "#0a0a0a", border: `1px solid ${border}`, color: "#f0e6d3", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", padding: "8px 10px", resize: "vertical" }}
            />
            <button
              onClick={saveNotes}
              disabled={saving}
              style={{ background: saved ? "#1a3a1a" : "#1a1a1a", border: `1px solid ${saved ? "#3a6a3a" : border}`, color: saved ? "#6aaa6a" : gold, fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", letterSpacing: "0.1em", padding: "0 14px", cursor: "pointer", flexShrink: 0 }}
            >
              {saving ? "..." : saved ? "Saved" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("All")

  useEffect(() => {
    const client = generateClient<Schema>({ authMode: "userPool" })
    const promise = client.models.ContactSubmission?.list({ authMode: "userPool" }) ?? Promise.resolve({ data: [] })
    promise.then(({ data }) => {
      const sorted = [...data].sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
      setContacts(sorted)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  function handleDelete(id: string) {
    setContacts((prev) => prev.filter((c) => c.id !== id))
  }

  const filtered = filter === "All" ? contacts : contacts.filter((c) => (c.status ?? "New") === filter)

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "2rem", fontWeight: 300, color: "#f0e6d3", marginBottom: "0.5rem" }}>
        Contacts
      </h1>
      <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#888", marginBottom: "2rem" }}>
        {contacts.length} message{contacts.length !== 1 ? "s" : ""} total
      </p>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem", flexWrap: "wrap" }}>
        {["All", ...STATUS_OPTIONS].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{ background: filter === s ? gold : "#161616", color: filter === s ? "#0a0a0a" : "#888", border: `1px solid ${filter === s ? gold : border}`, fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", padding: "6px 14px", cursor: "pointer" }}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#555" }}>Loading...</p>
      ) : filtered.length === 0 ? (
        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#555" }}>No messages yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {filtered.map((c) => (
            <ContactCard key={c.id} contact={c} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}
