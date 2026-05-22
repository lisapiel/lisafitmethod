"use client"

import { useState } from "react"

export default function ContactClient() {
  const [form, setForm] = useState({ name: "", email: "", message: "" })
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus("sending")
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, type: "contact" }),
      })
      setStatus(res.ok ? "done" : "error")
    } catch {
      setStatus("error")
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "#f5f2ee",
    border: "1px solid rgba(0,0,0,0.1)",
    padding: "14px 16px",
    fontSize: 15,
    fontFamily: "var(--font-dm-sans), sans-serif",
    color: "#1a1a1a",
    outline: "none",
    boxSizing: "border-box",
  }

  return (
    <main style={{ background: "#faf8f5", color: "#1a1a1a", fontFamily: "var(--font-dm-sans), sans-serif", minHeight: "80vh" }}>
      <style>{`
        :root { --accent: #c8a97e; --accent-dark: #a8895e; }
        .contact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: start; }
        @media (max-width: 768px) { .contact-grid { grid-template-columns: 1fr !important; gap: 48px !important; } .contact-section { padding: 72px 28px !important; } }
      `}</style>

      <section className="contact-section" style={{ padding: "100px 80px" }}>
        <div className="contact-grid" style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: "#a8895e", marginBottom: 24 }}>Get in touch</p>
            <h1 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(36px, 4vw, 56px)", fontWeight: 900, color: "#1a1a1a", lineHeight: 1.1, marginBottom: 24 }}>
              Questions?<br />
              <em style={{ fontStyle: "italic", color: "#a8895e" }}>I&apos;m here.</em>
            </h1>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: "#6b6560", marginBottom: 32 }}>
              Whether it&apos;s about the course, coaching, or just a question about training — feel free to reach out. I&apos;ll get back to you within 48 hours.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <a
                href="https://instagram.com/lisafitmethod"
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 10, fontSize: 14, color: "#a8895e", textDecoration: "none", fontWeight: 500 }}
              >
                <span style={{ fontSize: 20 }}>📸</span>
                @lisafitmethod on Instagram
              </a>
            </div>
          </div>

          <div>
            {status === "done" ? (
              <div style={{ background: "#0a0a0a", padding: "48px 40px" }}>
                <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: 26, fontWeight: 700, color: "#c8a97e", marginBottom: 14 }}>Message received.</p>
                <p style={{ fontSize: 15, color: "rgba(245,242,238,0.6)", lineHeight: 1.7 }}>
                  I&apos;ll get back to you within 48 hours. In the meantime, feel free to follow along on Instagram @lisafitmethod.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6b6560", marginBottom: 6 }}>Name *</label>
                    <input required type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6b6560", marginBottom: 6 }}>Email *</label>
                    <input required type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6b6560", marginBottom: 6 }}>Message *</label>
                  <textarea required rows={6} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} style={{ ...inputStyle, resize: "vertical" }} />
                </div>
                {status === "error" && (
                  <p style={{ fontSize: 13, color: "#c0392b" }}>Something went wrong. Try reaching out on Instagram instead.</p>
                )}
                <button
                  type="submit"
                  disabled={status === "sending"}
                  style={{ background: "#c8a97e", color: "#0a0a0a", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", border: "none", padding: "18px 40px", cursor: "pointer", opacity: status === "sending" ? 0.6 : 1, alignSelf: "flex-start" }}
                >
                  {status === "sending" ? "Sending..." : "Send Message"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
