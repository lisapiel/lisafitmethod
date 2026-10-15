"use client"

import Link from "next/link"
import { useState } from "react"
import { RevealLines } from "../Reveal.client"
import { FAQS, FAQ_HEAD } from "./productionCopy"

// Common questions, as a hairline accordion.
//
// Production sets all four answers open in a two-column grid, which is a lot
// of body copy arriving at once this late in the page. Nothing is removed
// here — every question and every answer is the live text, all of it present
// in the markup — but it is revealed one panel at a time, which is the
// layout answer to density rather than the editing answer.
export default function FaqC() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section className="pv-c-faq pv-c-light-alt pv-c-section" data-tone="light" id="faq">
      <style>{`
        .pv-c-faq-head {
          display: flex; align-items: flex-end; justify-content: space-between;
          gap: 24px; flex-wrap: wrap; margin-bottom: clamp(34px, 4vw, 58px);
        }
        .pv-c-faq-row { border-bottom: 1px solid rgba(26,26,26,0.13); }
        .pv-c-faq-row:first-of-type { border-top: 1px solid rgba(26,26,26,0.13); }
        .pv-c-faq-btn {
          width: 100%; display: grid; grid-template-columns: 1fr 28px; gap: 18px; align-items: center;
          background: none; border: none; cursor: pointer; text-align: left; font: inherit;
          padding: clamp(22px, 2.4vw, 32px) 0;
        }
        .pv-c-faq-q {
          font-family: var(--font-playfair), serif; font-weight: 500;
          font-size: clamp(1.1rem, 1.65vw, 1.5rem); line-height: 1.26;
          color: rgba(26,26,26,0.55); margin: 0;
          transition: color 560ms cubic-bezier(0.16,1,0.3,1), transform 560ms cubic-bezier(0.16,1,0.3,1);
          transform-origin: left center;
        }
        .pv-c-faq-row[data-open="true"] .pv-c-faq-q, .pv-c-faq-btn:hover .pv-c-faq-q { color: var(--c-text); }
        .pv-c-faq-row[data-open="true"] .pv-c-faq-q { transform: translateX(8px); }
        .pv-c-faq-sign {
          justify-self: end; color: var(--c-accent-dark); font-size: 20px; line-height: 1;
          transition: transform 560ms cubic-bezier(0.16,1,0.3,1);
        }
        .pv-c-faq-row[data-open="true"] .pv-c-faq-sign { transform: rotate(45deg); }
        .pv-c-faq-a {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
          font-size: clamp(0.925rem, 1.02vw, 1rem); line-height: 1.85;
          color: var(--c-muted); margin: 0; max-width: 74ch;
          padding: 0 0 clamp(26px, 3vw, 38px);
        }
      `}</style>

      <div className="pv-c-inner">
        <div className="pv-c-faq-head">
          <div>
            <p className="pv-c-eyebrow">{FAQ_HEAD.eyebrow}</p>
            <h2 className="pv-c-display pv-c-h2" style={{ marginTop: 16 }}>
              <RevealLines
                lines={[FAQ_HEAD.headingLine1, <i key="em">{FAQ_HEAD.headingLine2}</i>]}
                stagger={120}
              />
            </h2>
          </div>
          <Link href="/faq" className="pv-c-link">
            {FAQ_HEAD.link}
          </Link>
        </div>

        {FAQS.map((item, i) => {
          const isOpen = open === i
          return (
            <div key={item.q} className="pv-c-faq-row" data-open={isOpen}>
              <button
                type="button"
                className="pv-c-faq-btn"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
              >
                <h3 className="pv-c-faq-q">{item.q}</h3>
                <span className="pv-c-faq-sign" aria-hidden="true">
                  +
                </span>
              </button>
              <div
                style={{
                  display: "grid",
                  gridTemplateRows: isOpen ? "1fr" : "0fr",
                  transition: "grid-template-rows 680ms cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                <div style={{ overflow: "hidden" }}>
                  <p className="pv-c-faq-a">{item.a}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
