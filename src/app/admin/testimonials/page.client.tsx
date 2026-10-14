"use client"

import { useCallback, useEffect, useState } from "react"
import { fetchAuthSession } from "aws-amplify/auth"
import type { TestimonialRecord, TestimonialMetric } from "@/app/api/admin/testimonials/route"

const gold = "#c9a96e"
const border = "#2a2a2a"
const card = "#161616"

const PHOTO_SLOT_OPTIONS = [
  { value: "", label: "— none —" },
  { value: "testimonial_gino_before", label: "Gino – Before photo" },
  { value: "testimonial_gino_progress", label: "Gino – Progress photo (3 months)" },
  { value: "testimonial_gaby_portrait", label: "Gabriela – Gym photo" },
]

const VIDEO_SLOT_OPTIONS = [
  { value: "", label: "— none —" },
  { value: "testimonial_gino", label: "Gino – Video testimonial" },
]

const empty: Omit<TestimonialRecord, "id" | "createdAt" | "updatedAt"> = {
  clientName: "",
  clientDescription: "",
  type: "experience",
  headline: "",
  writtenTestimonial: "",
  featuredQuote: "",
  metrics: [],
  photoSlotBefore: "",
  photoSlotProgress: "",
  photoSlotPortrait: "",
  videoSlot: "",
  displayOrder: 0,
  status: "draft",
}

async function getToken(): Promise<string | null> {
  try {
    const session = await fetchAuthSession()
    return session.tokens?.accessToken?.toString() ?? null
  } catch {
    return null
  }
}

async function apiFetch(path: string, opts: RequestInit = {}) {
  const token = await getToken()
  return fetch(path, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...opts.headers,
    },
  })
}

export default function AdminTestimonialsClient() {
  const [testimonials, setTestimonials] = useState<TestimonialRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<TestimonialRecord | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 4000)
  }

  const loadTestimonials = useCallback(async (seedIfEmpty = false) => {
    setLoading(true)
    try {
      const res = await apiFetch("/api/admin/testimonials")
      const data = await res.json() as { testimonials: TestimonialRecord[] }
      const list = data.testimonials ?? []

      if (seedIfEmpty && list.length === 0) {
        // First visit — auto-populate with real client content
        const seedRes = await apiFetch("/api/admin/testimonials/seed", { method: "POST" })
        if (seedRes.ok) {
          const seeded = await seedRes.json() as { seeded: boolean }
          if (seeded.seeded) {
            const res2 = await apiFetch("/api/admin/testimonials")
            const data2 = await res2.json() as { testimonials: TestimonialRecord[] }
            setTestimonials(data2.testimonials ?? [])
            showToast("Client stories loaded — both are in Draft. Review, then click Publish when ready.")
            return
          }
        }
      }

      setTestimonials(list)
    } catch {
      showToast("Failed to load testimonials.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadTestimonials(true) }, [loadTestimonials])

  function openNew() {
    setEditing({ ...empty, id: "", createdAt: "", updatedAt: "" })
    setIsNew(true)
  }

  function openEdit(t: TestimonialRecord) {
    setEditing({ ...t })
    setIsNew(false)
  }

  function closeEditor() {
    setEditing(null)
    setIsNew(false)
  }

  async function handleSave() {
    if (!editing) return
    setSaving(true)
    try {
      let res: Response
      if (isNew) {
        res = await apiFetch("/api/admin/testimonials", {
          method: "POST",
          body: JSON.stringify(editing),
        })
      } else {
        res = await apiFetch(`/api/admin/testimonials/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(editing),
        })
      }
      if (!res.ok) throw new Error("Save failed")
      closeEditor()
      await loadTestimonials()
      showToast(isNew ? "Testimonial created (draft)." : "Testimonial saved.")
    } catch {
      showToast("Failed to save — please try again.")
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleStatus(t: TestimonialRecord) {
    const newStatus = t.status === "published" ? "draft" : "published"
    setSaving(true)
    try {
      const res = await apiFetch(`/api/admin/testimonials/${t.id}`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error()
      await loadTestimonials()
      showToast(newStatus === "published" ? "Published — now visible on the site." : "Moved back to draft.")
    } catch {
      showToast("Failed to update status.")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setSaving(true)
    try {
      const res = await apiFetch(`/api/admin/testimonials/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      setConfirmDelete(null)
      await loadTestimonials()
      showToast("Testimonial deleted.")
    } catch {
      showToast("Failed to delete.")
    } finally {
      setSaving(false)
    }
  }

  function setField<K extends keyof TestimonialRecord>(key: K, value: TestimonialRecord[K]) {
    setEditing((prev) => prev ? { ...prev, [key]: value } : prev)
  }

  function addMetric() {
    setEditing((prev) => prev ? { ...prev, metrics: [...prev.metrics, { label: "", value: "" }] } : prev)
  }

  function updateMetric(i: number, field: keyof TestimonialMetric, value: string) {
    setEditing((prev) => {
      if (!prev) return prev
      const metrics = [...prev.metrics]
      metrics[i] = { ...metrics[i], [field]: value }
      return { ...prev, metrics }
    })
  }

  function removeMetric(i: number) {
    setEditing((prev) => prev ? { ...prev, metrics: prev.metrics.filter((_, idx) => idx !== i) } : prev)
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "#0f0f0f",
    border: `1px solid ${border}`,
    color: "#f0e6d3",
    fontFamily: "var(--font-dm-sans), sans-serif",
    fontSize: "0.82rem",
    padding: "10px 12px",
    outline: "none",
    lineHeight: 1.5,
    boxSizing: "border-box",
  }
  const labelStyle: React.CSSProperties = {
    display: "block",
    fontFamily: "var(--font-montserrat), sans-serif",
    fontSize: "0.58rem",
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "#666",
    marginBottom: 5,
  }

  return (
    <div style={{ maxWidth: 860 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "2rem", fontWeight: 300, color: "#f0e6d3", marginBottom: "0.25rem" }}>
            Testimonials
          </h1>
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.72rem", color: "#555" }}>
            Manage client testimonials for the public homepage. Only published testimonials appear on the site.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
          <a
            href="/admin/testimonials/preview"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: "none", border: `1px solid ${gold}`, color: gold,
              fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem",
              fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase",
              padding: "11px 22px", cursor: "pointer", whiteSpace: "nowrap", textDecoration: "none",
              display: "inline-flex", alignItems: "center",
            }}
          >
            Preview
          </a>
          <button
            onClick={openNew}
            style={{
              background: gold, color: "#0a0a0a", border: "none",
              fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem",
              fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase",
              padding: "11px 22px", cursor: "pointer", whiteSpace: "nowrap",
            }}
          >
            + Add
          </button>
        </div>
      </div>

      {toast && (
        <div style={{
          background: toast.includes("Failed") ? "#2a0a0a" : "#0a1a0a",
          border: `1px solid ${toast.includes("Failed") ? "#c0392b" : gold}`,
          color: toast.includes("Failed") ? "#e07070" : gold,
          fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem",
          padding: "12px 16px", marginBottom: 20,
        }}>
          {toast}
        </div>
      )}

      {loading ? (
        <p style={{ color: "#555", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.72rem" }}>Loading…</p>
      ) : testimonials.length === 0 ? (
        <div style={{ background: card, border: `1px solid ${border}`, padding: "32px 24px", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.72rem", color: "#555" }}>
            No testimonials yet. Click &ldquo;+ Add Testimonial&rdquo; to create one.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {testimonials.map((t) => (
            <div key={t.id} style={{ background: card, border: `1px solid ${border}`, padding: "18px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <span style={{
                      fontFamily: "var(--font-cormorant), serif", fontSize: "1.05rem", fontWeight: 600, color: "#f0e6d3",
                    }}>
                      {t.clientName || "Untitled"}
                    </span>
                    <span style={{
                      fontSize: "0.55rem", fontFamily: "var(--font-montserrat), sans-serif",
                      letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 600,
                      color: t.status === "published" ? "#4caf7d" : "#888",
                      background: t.status === "published" ? "rgba(76,175,125,0.1)" : "rgba(136,136,136,0.1)",
                      padding: "3px 8px",
                    }}>
                      {t.status === "published" ? "Live" : "Draft"}
                    </span>
                    <span style={{ fontSize: "0.55rem", fontFamily: "var(--font-montserrat), sans-serif", color: "#555", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                      {t.type}
                    </span>
                  </div>
                  {t.headline && (
                    <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.78rem", color: "#888", marginBottom: 2 }}>
                      &ldquo;{t.headline}&rdquo;
                    </p>
                  )}
                  {t.clientDescription && (
                    <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.62rem", color: "#555" }}>
                      {t.clientDescription}
                    </p>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button
                    onClick={() => handleToggleStatus(t)}
                    disabled={saving}
                    style={{
                      background: "none", border: `1px solid ${t.status === "published" ? border : gold}`,
                      color: t.status === "published" ? "#555" : gold,
                      fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.58rem",
                      letterSpacing: "0.12em", textTransform: "uppercase",
                      padding: "7px 14px", cursor: saving ? "not-allowed" : "pointer",
                    }}
                  >
                    {t.status === "published" ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    onClick={() => openEdit(t)}
                    style={{
                      background: "none", border: `1px solid ${border}`, color: "#888",
                      fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.58rem",
                      letterSpacing: "0.12em", textTransform: "uppercase",
                      padding: "7px 14px", cursor: "pointer",
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setConfirmDelete(t.id)}
                    style={{
                      background: "none", border: `1px solid #3a1a1a`, color: "#883333",
                      fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.58rem",
                      letterSpacing: "0.12em", textTransform: "uppercase",
                      padding: "7px 14px", cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
        }}>
          <div style={{ background: "#111", border: `1px solid ${border}`, padding: 32, maxWidth: 400, width: "90%" }}>
            <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#f0e6d3", marginBottom: 20 }}>
              Delete this testimonial? This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={saving}
                style={{
                  background: "#7a2020", color: "#f0e6d3", border: "none",
                  fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.62rem",
                  letterSpacing: "0.12em", textTransform: "uppercase",
                  padding: "10px 22px", cursor: saving ? "not-allowed" : "pointer",
                }}
              >
                {saving ? "Deleting…" : "Yes, delete"}
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                style={{
                  background: "none", border: `1px solid ${border}`, color: "#888",
                  fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.62rem",
                  letterSpacing: "0.12em", textTransform: "uppercase",
                  padding: "10px 22px", cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit / Create modal */}
      {editing && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)",
          display: "flex", alignItems: "flex-start", justifyContent: "center",
          zIndex: 1000, overflowY: "auto", padding: "40px 16px",
        }}>
          <div style={{
            background: "#111", border: `1px solid ${border}`,
            width: "100%", maxWidth: 680, padding: "32px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
              <h2 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.4rem", fontWeight: 300, color: "#f0e6d3", margin: 0 }}>
                {isNew ? "New Testimonial" : `Edit — ${editing.clientName || "Untitled"}`}
              </h2>
              <button onClick={closeEditor} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: "1.2rem", padding: "4px 8px" }}>✕</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 20px" }}>
              <div>
                <label style={labelStyle}>Client name *</label>
                <input style={inputStyle} value={editing.clientName} onChange={(e) => setField("clientName", e.target.value)} placeholder="Gino" />
              </div>
              <div>
                <label style={labelStyle}>Client description</label>
                <input style={inputStyle} value={editing.clientDescription} onChange={(e) => setField("clientDescription", e.target.value)} placeholder="Online Coaching Client" />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 20px", marginTop: 16 }}>
              <div>
                <label style={labelStyle}>Type</label>
                <select
                  style={{ ...inputStyle, cursor: "pointer" }}
                  value={editing.type}
                  onChange={(e) => setField("type", e.target.value as "transformation" | "experience")}
                >
                  <option value="transformation">Transformation (photos + metrics + video)</option>
                  <option value="experience">Experience (quote + optional photo)</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Display order (lower = first)</label>
                <input
                  style={inputStyle} type="number" value={editing.displayOrder}
                  onChange={(e) => setField("displayOrder", parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <label style={labelStyle}>Headline</label>
              <input style={inputStyle} value={editing.headline} onChange={(e) => setField("headline", e.target.value)} placeholder="From random workouts to a routine that sticks." />
            </div>

            <div style={{ marginTop: 16 }}>
              <label style={labelStyle}>Written testimonial</label>
              <textarea style={{ ...inputStyle, resize: "vertical" }} rows={5} value={editing.writtenTestimonial} onChange={(e) => setField("writtenTestimonial", e.target.value)} />
            </div>

            <div style={{ marginTop: 16 }}>
              <label style={labelStyle}>Featured quote (shown prominently)</label>
              <textarea style={{ ...inputStyle, resize: "vertical" }} rows={3} value={editing.featuredQuote} onChange={(e) => setField("featuredQuote", e.target.value)} placeholder="The biggest change honestly is that it&apos;s a routine now, not a grind." />
            </div>

            {/* Metrics */}
            <div style={{ marginTop: 20, borderTop: `1px solid ${border}`, paddingTop: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Progress metrics (optional — for transformation type)</label>
                <button
                  onClick={addMetric}
                  style={{
                    background: "none", border: `1px solid ${border}`, color: gold,
                    fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.58rem",
                    letterSpacing: "0.12em", textTransform: "uppercase", padding: "5px 12px", cursor: "pointer",
                  }}
                >
                  + Add metric
                </button>
              </div>
              {editing.metrics.map((m, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8, marginBottom: 8 }}>
                  <input style={inputStyle} value={m.value} onChange={(e) => updateMetric(i, "value", e.target.value)} placeholder="~30 lbs" />
                  <input style={inputStyle} value={m.label} onChange={(e) => updateMetric(i, "label", e.target.value)} placeholder="lost" />
                  <button
                    onClick={() => removeMetric(i)}
                    style={{ background: "none", border: `1px solid #3a1a1a`, color: "#883333", padding: "0 10px", cursor: "pointer", fontSize: "0.9rem" }}
                  >
                    ✕
                  </button>
                </div>
              ))}
              {editing.metrics.length === 0 && (
                <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.62rem", color: "#444" }}>No metrics — click Add metric to add one.</p>
              )}
            </div>

            {/* Media slots */}
            <div style={{ marginTop: 20, borderTop: `1px solid ${border}`, paddingTop: 20 }}>
              <p style={{ ...labelStyle, marginBottom: 14, color: gold }}>Media slots</p>
              <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.62rem", color: "#555", marginBottom: 14 }}>
                Upload photos in the Photos section and videos in the Videos section first, then assign them here.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 20px" }}>
                <div>
                  <label style={labelStyle}>Before photo slot</label>
                  <select style={{ ...inputStyle, cursor: "pointer" }} value={editing.photoSlotBefore} onChange={(e) => setField("photoSlotBefore", e.target.value)}>
                    {PHOTO_SLOT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Progress photo slot</label>
                  <select style={{ ...inputStyle, cursor: "pointer" }} value={editing.photoSlotProgress} onChange={(e) => setField("photoSlotProgress", e.target.value)}>
                    {PHOTO_SLOT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Portrait / gym photo slot</label>
                  <select style={{ ...inputStyle, cursor: "pointer" }} value={editing.photoSlotPortrait} onChange={(e) => setField("photoSlotPortrait", e.target.value)}>
                    {PHOTO_SLOT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Video slot</label>
                  <select style={{ ...inputStyle, cursor: "pointer" }} value={editing.videoSlot} onChange={(e) => setField("videoSlot", e.target.value)}>
                    {VIDEO_SLOT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 28, paddingTop: 20, borderTop: `1px solid ${border}` }}>
              <button onClick={closeEditor} style={{
                background: "none", border: `1px solid ${border}`, color: "#888",
                fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.62rem",
                letterSpacing: "0.12em", textTransform: "uppercase", padding: "11px 22px", cursor: "pointer",
              }}>
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !editing.clientName.trim()}
                style={{
                  background: saving ? "none" : gold, color: saving ? gold : "#0a0a0a",
                  border: `1px solid ${gold}`,
                  fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem",
                  fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase",
                  padding: "11px 28px", cursor: saving || !editing.clientName.trim() ? "not-allowed" : "pointer",
                  opacity: saving || !editing.clientName.trim() ? 0.6 : 1,
                }}
              >
                {saving ? "Saving…" : isNew ? "Create (Draft)" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
