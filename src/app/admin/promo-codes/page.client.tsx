"use client"
import { useState, useEffect, useTransition } from "react"
import { addPromoCode, deletePromoCode, togglePromoCode } from "./actions"
import type { PromoCodes } from "@/lib/promoCodes"

const gold = "#c9a96e"
const border = "#2a2a2a"
const mono: React.CSSProperties = { fontFamily: "monospace", fontSize: "0.85rem", letterSpacing: "0.08em" }

export function PromoCodesClient() {
  const [codes, setCodes] = useState<PromoCodes>({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [newCode, setNewCode] = useState("")
  const [newDiscount, setNewDiscount] = useState<string>("100")
  const [newProduct, setNewProduct] = useState<"training" | "nutrition" | "all">("all")
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    fetch("/api/admin/promo-codes")
      .then((r) => r.json())
      .then((data: { codes: PromoCodes }) => {
        setCodes(data.codes ?? {})
        setLoading(false)
      })
      .catch(() => {
        setLoadError(true)
        setLoading(false)
      })
  }, [])

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const pct = parseInt(newDiscount, 10)
    startTransition(async () => {
      try {
        const result = await addPromoCode(newCode, pct, newProduct)
        if (result?.error) { setError(result.error); return }
        setCodes((prev) => ({ ...prev, [newCode.trim().toUpperCase()]: { discountPct: pct, active: true, product: newProduct } }))
        setNewCode("")
        setNewDiscount("100")
        setNewProduct("all")
      } catch {
        setError("Something went wrong. Please try again.")
      }
    })
  }

  function handleDelete(code: string) {
    startTransition(async () => {
      try {
        const result = await deletePromoCode(code)
        if (result?.error) return
        setCodes((prev) => { const next = { ...prev }; delete next[code]; return next })
      } catch {
        // silently ignore UI stays consistent
      }
    })
  }

  function handleToggle(code: string, active: boolean) {
    startTransition(async () => {
      try {
        const result = await togglePromoCode(code, active)
        if (result?.error) return
        setCodes((prev) => ({ ...prev, [code]: { ...prev[code], active } }))
      } catch {
        // silently ignore
      }
    })
  }

  function handleCopy(code: string) {
    navigator.clipboard.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(null), 1500)
  }

  const entries = Object.entries(codes).sort((a, b) => a[0].localeCompare(b[0]))

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "2rem", fontWeight: 300, color: "#f0e6d3", marginBottom: "0.4rem" }}>
        Promo Codes
      </h1>
      <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#888", marginBottom: "2.5rem" }}>
        Codes are case-insensitive. Changes take effect immediately: no rebuild needed.
      </p>

      {/* Code list */}
      <div style={{ background: "#161616", border: `1px solid ${border}`, marginBottom: "2rem" }}>
        {/* Header row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 130px 120px 90px 220px", gap: "1rem", padding: "0.75rem 1.5rem", borderBottom: `1px solid ${border}` }}>
          {["Code", "Discount", "Product", "Status", ""].map((h) => (
            <span key={h} style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#555" }}>{h}</span>
          ))}
        </div>

        {loading && (
          <p style={{ padding: "2rem 1.5rem", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.8rem", color: "#555" }}>
            Loading…
          </p>
        )}

        {!loading && loadError && (
          <p style={{ padding: "2rem 1.5rem", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.8rem", color: "#c97070" }}>
            Could not load codes. Please refresh the page.
          </p>
        )}

        {!loading && !loadError && entries.length === 0 && (
          <p style={{ padding: "2rem 1.5rem", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.8rem", color: "#555" }}>
            No codes yet. Add one below.
          </p>
        )}

        {entries.map(([code, entry]) => (
          <div key={code} style={{ display: "grid", gridTemplateColumns: "1fr 130px 120px 90px 220px", gap: "1rem", padding: "1rem 1.5rem", borderBottom: `1px solid ${border}`, alignItems: "center", opacity: entry.active ? 1 : 0.55 }}>
            <span style={{ ...mono, color: "#f0e6d3" }}>{code}</span>
            <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.8rem", color: entry.discountPct === 100 ? gold : "#f0e6d3" }}>
              {entry.discountPct === 100 ? "Free (100% off)" : `${entry.discountPct}% off`}
            </span>
            <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", color: "#888" }}>
              {entry.product === "training" ? "Training" : entry.product === "nutrition" ? "Nutrition" : "All"}
            </span>
            <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", color: entry.active ? "#6dbf7e" : "#888" }}>
              {entry.active ? "Active" : "Inactive"}
            </span>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button
                onClick={() => handleCopy(code)}
                style={{ background: "none", border: `1px solid ${border}`, color: copied === code ? gold : "#888", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", padding: "0.35rem 0.75rem", cursor: "pointer" }}
              >
                {copied === code ? "Copied!" : "Copy"}
              </button>
              <button
                onClick={() => handleToggle(code, !entry.active)}
                disabled={isPending}
                style={{ background: "none", border: `1px solid ${entry.active ? "#2a3a2a" : "#2a2a3a"}`, color: entry.active ? "#6dbf7e" : "#7e8dbf", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", padding: "0.35rem 0.75rem", cursor: "pointer", opacity: isPending ? 0.5 : 1 }}
              >
                {entry.active ? "Deactivate" : "Activate"}
              </button>
              <button
                onClick={() => handleDelete(code)}
                disabled={isPending}
                style={{ background: "none", border: "1px solid #3a1a1a", color: "#c97070", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", padding: "0.35rem 0.75rem", cursor: "pointer", opacity: isPending ? 0.5 : 1 }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add new code form */}
      <div style={{ background: "#161616", border: `1px solid ${border}`, padding: "1.75rem 1.5rem" }}>
        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#555", marginBottom: "1.25rem" }}>
          Add New Code
        </p>
        <form onSubmit={handleAdd} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 200px" }}>
            <label style={{ display: "block", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#888", marginBottom: "0.5rem" }}>
              Code
            </label>
            <input
              type="text"
              value={newCode}
              onChange={(e) => { setNewCode(e.target.value); setError(null) }}
              placeholder="e.g. FRIEND2025"
              required
              style={{ width: "100%", background: "#0a0a0a", border: `1px solid ${border}`, color: "#f0e6d3", fontFamily: "monospace", fontSize: "0.9rem", padding: "0.65rem 0.9rem", outline: "none", boxSizing: "border-box" as const }}
            />
          </div>

          <div style={{ flex: "0 0 140px" }}>
            <label style={{ display: "block", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#888", marginBottom: "0.5rem" }}>
              Discount %
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={newDiscount}
              onChange={(e) => setNewDiscount(e.target.value)}
              required
              style={{ width: "100%", background: "#0a0a0a", border: `1px solid ${border}`, color: "#f0e6d3", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.9rem", padding: "0.65rem 0.9rem", outline: "none", boxSizing: "border-box" as const }}
            />
          </div>

          <div style={{ flex: "0 0 140px" }}>
            <label style={{ display: "block", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#888", marginBottom: "0.5rem" }}>
              Applies To
            </label>
            <select
              value={newProduct}
              onChange={(e) => setNewProduct(e.target.value as "training" | "nutrition" | "all")}
              style={{ width: "100%", background: "#0a0a0a", border: `1px solid ${border}`, color: "#f0e6d3", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.85rem", padding: "0.65rem 0.9rem", outline: "none", boxSizing: "border-box" as const, cursor: "pointer" }}
            >
              <option value="all">All products</option>
              <option value="training">Training only</option>
              <option value="nutrition">Nutrition only</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isPending}
            style={{ background: gold, color: "#0a0a0a", border: "none", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", padding: "0.7rem 1.5rem", cursor: isPending ? "not-allowed" : "pointer", opacity: isPending ? 0.7 : 1, whiteSpace: "nowrap" as const }}
          >
            {isPending ? "Saving…" : "Add Code"}
          </button>
        </form>

        {error && (
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#c97070", marginTop: "0.75rem" }}>
            {error}
          </p>
        )}

        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", color: "#555", marginTop: "1rem", lineHeight: 1.6 }}>
          Set discount to <strong style={{ color: "#888" }}>100%</strong> for free access ($0.50 processing fee applies via Stripe).
          New codes are active by default. Deactivate to block a code without deleting it.
        </p>
      </div>
    </div>
  )
}
