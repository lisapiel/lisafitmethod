"use client"

import { useState } from "react"

// The contact form, restyled for Direction D.
//
// Behaviour is deliberately identical to src/app/contact/page.client.tsx:
// the same four fields including the `website` honeypot, the same POST to
// /api/contact with `type: "contact"`, and the same idle/sending/done/error
// states and messages. Only the presentation differs, so switching the live
// page over to this cannot change what the API receives or what a visitor
// is told.
export function ContactFormD() {
  const [form, setForm] = useState({ name: "", email: "", message: "", website: "" })
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

  return (
    <div className="pv-d-form">
      <style>{`
        .pv-d-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--d-step-3); }
        @media (max-width: 560px) { .pv-d-form-grid { grid-template-columns: 1fr; } }
        .pv-d-field { display: block; margin-bottom: var(--d-step-3); }
        .pv-d-field-label {
          display: block; font-family: var(--font-dm-sans), sans-serif;
          font-size: 10px; font-weight: 600; letter-spacing: 0.18em;
          text-transform: uppercase; color: var(--d-muted); margin-bottom: 9px;
        }
        /* Underline inputs rather than boxes, which is the one treatment that
           matches a page with no boxed elements anywhere else. */
        .pv-d-input {
          width: 100%; box-sizing: border-box; background: transparent;
          border: 0; border-bottom: 1px solid var(--d-rule);
          padding: 11px 2px; font-size: 1rem; font-weight: 300;
          font-family: var(--font-dm-sans), sans-serif; color: var(--d-text);
          outline: none; border-radius: 0;
          transition: border-color 420ms ease;
        }
        .pv-d-input:focus { border-bottom-color: var(--d-accent-dark); }
        .pv-d-input::placeholder { color: rgba(26,26,26,0.28); }
        textarea.pv-d-input { resize: vertical; line-height: 1.7; }
        .pv-d-honeypot { position: absolute; left: -9999px; }
        .pv-d-form-error {
          font-family: var(--font-dm-sans), sans-serif; font-size: 0.82rem;
          color: #c0392b; margin: 0 0 var(--d-step-3);
        }
        .pv-d-form-btn {
          background: var(--d-accent-dark); color: #fff; border: 0; cursor: pointer;
          font-family: var(--font-dm-sans), sans-serif; font-size: 11px; font-weight: 600;
          letter-spacing: 0.18em; text-transform: uppercase; padding: 18px 44px;
          transition: background 420ms ease, opacity 300ms ease;
        }
        .pv-d-form-btn:hover:not(:disabled) { background: var(--d-black); }
        .pv-d-form-btn:disabled { opacity: 0.6; cursor: default; }
        .pv-d-form-done { border-top: 1px solid var(--d-rule); padding-top: var(--d-step-4); }
        .pv-d-form-done-h {
          font-family: var(--font-playfair), serif; font-weight: 500;
          font-size: clamp(1.4rem, 2.2vw, 1.85rem); color: var(--d-accent-dark);
          margin: 0 0 var(--d-step-2);
        }
        .pv-d-form-done-b {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
          font-size: 0.96rem; line-height: 1.8; color: var(--d-muted); margin: 0;
        }
      `}</style>

      {status === "done" ? (
        <div className="pv-d-form-done">
          <p className="pv-d-form-done-h">Message received.</p>
          <p className="pv-d-form-done-b">
            I&apos;ll get back to you within 48 hours. In the meantime, feel free to follow along on
            Instagram @lisafitmethod.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="website"
            value={form.website}
            onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
            className="pv-d-honeypot"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />
          <div className="pv-d-form-grid">
            <label className="pv-d-field">
              <span className="pv-d-field-label">Name *</span>
              <input
                required
                type="text"
                className="pv-d-input"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </label>
            <label className="pv-d-field">
              <span className="pv-d-field-label">Email *</span>
              <input
                required
                type="email"
                className="pv-d-input"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </label>
          </div>
          <label className="pv-d-field">
            <span className="pv-d-field-label">Message *</span>
            <textarea
              required
              rows={6}
              className="pv-d-input"
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            />
          </label>
          {status === "error" && (
            <p className="pv-d-form-error">Something went wrong. Try reaching out on Instagram instead.</p>
          )}
          <button type="submit" disabled={status === "sending"} className="pv-d-form-btn">
            {status === "sending" ? "Sending..." : "Send Message"}
          </button>
        </form>
      )}
    </div>
  )
}
