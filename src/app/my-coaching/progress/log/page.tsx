"use client"

import { useState, useEffect } from "react"
import { fetchUserAttributes } from "aws-amplify/auth"
import { generateClient } from "aws-amplify/data"
import { useRouter } from "next/navigation"
import Link from "next/link"
import type { Schema } from "@/lib/amplifyConfig"

const accent = "#c8a97e"
const black = "#0a0a0a"
const muted = "#6b6560"
const border = "#e8e2dc"
const white = "#fff"

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <label style={{ display: "block", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.75rem", fontWeight: 600, color: black, marginBottom: 4 }}>
        {label}
        {hint && <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.7rem", fontWeight: 400, color: muted, marginLeft: 6 }}>{hint}</span>}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#faf8f5",
  border: `1px solid ${border}`,
  borderRadius: 6,
  padding: "10px 14px",
  fontFamily: "var(--font-dm-sans), sans-serif",
  fontSize: "0.9rem",
  color: black,
  outline: "none",
  boxSizing: "border-box",
}

export default function LogMeasurementsPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [weightUnit, setWeightUnit] = useState<"LBS" | "KG">("LBS")
  const [form, setForm] = useState({
    snapshotDate: new Date().toISOString().slice(0, 10),
    weight: "",
    waist: "",
    hips: "",
    chest: "",
    arm: "",
    thigh: "",
    notes: "",
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function init() {
      const attrs = await fetchUserAttributes()
      const userEmail = attrs.email ?? ""
      setEmail(userEmail)
      try {
        const db = generateClient<Schema>({ authMode: "userPool" })
        const { data: clients } = await db.models.CoachingClient.list({ authMode: "userPool" })
        const me = clients.find((c) => c.email.toLowerCase() === userEmail.toLowerCase())
        if (me?.weightUnit) setWeightUnit(me.weightUnit as "LBS" | "KG")
      } catch { /* handled by layout */ }
    }
    init()
  }, [])

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  async function save() {
    setSaving(true)
    try {
      const db = generateClient<Schema>({ authMode: "userPool" })
      await db.models.ClientProgressSnapshot.create({
        clientEmail: email,
        snapshotDate: form.snapshotDate,
        weight: form.weight ? parseFloat(form.weight) : undefined,
        weightUnit: weightUnit,
        waist: form.waist ? parseFloat(form.waist) : undefined,
        hips: form.hips ? parseFloat(form.hips) : undefined,
        chest: form.chest ? parseFloat(form.chest) : undefined,
        arm: form.arm ? parseFloat(form.arm) : undefined,
        thigh: form.thigh ? parseFloat(form.thigh) : undefined,
        notes: form.notes || undefined,
      })
      router.push("/my-coaching/progress")
    } catch (err) {
      console.error(err)
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: 520 }}>
      <div style={{ marginBottom: "2rem" }}>
        <Link href="/my-coaching/progress" style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.75rem", color: muted, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: "0.75rem" }}>
          ← Progress
        </Link>
        <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: accent, margin: "0 0 4px" }}>Log</p>
        <h1 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.9rem", fontWeight: 700, color: black, margin: 0 }}>Measurements</h1>
      </div>

      <div style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, padding: "1.75rem" }}>
        <Field label="Date">
          <input type="date" value={form.snapshotDate} onChange={set("snapshotDate")} style={inputStyle} />
        </Field>

        <Field label="Weight" hint="(optional)">
          <div style={{ display: "flex", gap: 8 }}>
            <input type="number" value={form.weight} onChange={set("weight")} placeholder="0.0" step="0.1" style={{ ...inputStyle, flex: 1 }} />
            <div style={{ display: "flex", borderRadius: 6, overflow: "hidden", border: `1px solid ${border}`, flexShrink: 0 }}>
              {(["LBS", "KG"] as const).map((u) => (
                <button key={u} onClick={() => setWeightUnit(u)} style={{ padding: "0 16px", background: weightUnit === u ? black : white, color: weightUnit === u ? white : muted, fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.75rem", fontWeight: 700, border: "none", cursor: "pointer" }}>
                  {u}
                </button>
              ))}
            </div>
          </div>
        </Field>

        <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: muted, margin: "1.5rem 0 1rem" }}>
          Body Measurements <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: "normal" }}>(all in inches)</span>
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1rem" }}>
          {([["waist", "Waist"], ["hips", "Hips"], ["chest", "Chest"], ["arm", "Arm"], ["thigh", "Thigh"]] as [keyof typeof form, string][]).map(([key, label]) => (
            <Field key={key} label={label} hint="(optional)">
              <input type="number" value={form[key]} onChange={set(key)} placeholder="0.0" step="0.1" style={inputStyle} />
            </Field>
          ))}
        </div>

        <Field label="Notes" hint="(optional)">
          <textarea
            value={form.notes}
            onChange={set("notes")}
            placeholder="How are you feeling? Anything to note…"
            rows={3}
            style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }}
          />
        </Field>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: "0.5rem" }}>
          <Link href="/my-coaching/progress" style={{ display: "inline-block", background: "transparent", color: muted, padding: "11px 20px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", textDecoration: "none", border: `1px solid ${border}`, borderRadius: 4 }}>
            Cancel
          </Link>
          <button
            onClick={save}
            disabled={saving}
            style={{ background: black, border: "none", color: white, padding: "11px 28px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", borderRadius: 4 }}
          >
            {saving ? "Saving…" : "Save Measurements"}
          </button>
        </div>
      </div>
    </div>
  )
}
