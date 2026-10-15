"use client"

import Link from "next/link"
import { useState } from "react"
import { RevealLines } from "../Reveal.client"
import { FAQS } from "../previewContent"

// DIRECTION A questions — a hairline accordion.
//
// One panel open at a time, heights animated with grid-template-rows so the
// page never has to know a pixel height in advance and nothing jumps.
export default function FaqA() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section className="pv-a-faq" id="faq">
      <style>{`
        .pv-a-faq { background: #f7f4ef; padding: clamp(66px, 8vw, 130px) clamp(20px, 5vw, 72px); }
        .pv-a-faq-head { display: grid; grid-template-columns: 180px 1fr; gap: clamp(24px, 4vw, 64px); align-items: end; margin-bottom: clamp(34px, 4vw, 58px); }
        .pv-a-faq-h2 {
          font-family: var(--font-playfair), serif; font-size: clamp(1.9rem, 4vw, 3.6rem);
          font-weight: 500; line-height: 1.04; color: #121110; margin: 0;
        }
        .pv-a-faq-h2 i { font-style: italic; color: #a8895e; }
        .pv-a-faq-row { border-bottom: 1px solid rgba(18,17,16,0.14); }
        .pv-a-faq-row:first-child { border-top: 1px solid rgba(18,17,16,0.14); }
        .pv-a-faq-btn {
          width: 100%; display: grid; grid-template-columns: 1fr 28px; gap: 18px; align-items: center;
          background: none; border: none; cursor: pointer; text-align: left; font: inherit;
          padding: clamp(22px, 2.4vw, 32px) 0;
        }
        .pv-a-faq-q {
          font-family: var(--font-playfair), serif; font-size: clamp(1.1rem, 1.7vw, 1.55rem);
          font-weight: 500; line-height: 1.26; color: rgba(18,17,16,0.55); margin: 0;
          transition: color 560ms cubic-bezier(0.16,1,0.3,1), transform 560ms cubic-bezier(0.16,1,0.3,1);
          transform-origin: left center;
        }
        .pv-a-faq-row[data-open="true"] .pv-a-faq-q, .pv-a-faq-btn:hover .pv-a-faq-q { color: #121110; }
        .pv-a-faq-row[data-open="true"] .pv-a-faq-q { transform: translateX(8px); }
        .pv-a-faq-sign { justify-self: end; color: #a8895e; font-size: 20px; line-height: 1; transition: transform 560ms cubic-bezier(0.16,1,0.3,1); }
        .pv-a-faq-row[data-open="true"] .pv-a-faq-sign { transform: rotate(45deg); }
        .pv-a-faq-a {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300; font-size: 0.925rem;
          line-height: 1.8; color: rgba(18,17,16,0.62); margin: 0; max-width: 72ch;
          padding: 0 0 clamp(26px, 3vw, 38px);
        }
        .pv-a-faq-more {
          display: inline-flex; align-items: center; gap: 10px; margin-top: clamp(30px, 3.4vw, 46px);
          font-family: var(--font-dm-sans), sans-serif; font-size: 10.5px; font-weight: 600;
          letter-spacing: 0.22em; text-transform: uppercase; color: #121110; text-decoration: none;
          border-bottom: 1px solid rgba(18,17,16,0.25); padding-bottom: 6px;
          transition: color 500ms ease, border-color 500ms ease, gap 500ms cubic-bezier(0.16,1,0.3,1);
        }
        .pv-a-faq-more:hover { color: #a8895e; border-color: #a8895e; gap: 18px; }
        @media (max-width: 900px) {
          .pv-a-faq-head { grid-template-columns: 1fr; gap: 16px; align-items: start; }
        }
      `}</style>

      <div className="pv-a-faq-head">
        <p className="pv-a-runhead">
          06 — Questions
          <span>Straight answers</span>
        </p>
        <h2 className="pv-a-faq-h2">
          <RevealLines lines={["Good questions.", <i key="i">Straight answers.</i>]} stagger={110} />
        </h2>
      </div>

      {FAQS.map((f, i) => {
        const isOpen = open === i
        return (
          <div key={f.q} className="pv-a-faq-row" data-open={isOpen}>
            <button
              type="button"
              className="pv-a-faq-btn"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
            >
              <h3 className="pv-a-faq-q">{f.q}</h3>
              <span className="pv-a-faq-sign" aria-hidden="true">
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
                <p className="pv-a-faq-a">{f.a}</p>
              </div>
            </div>
          </div>
        )
      })}

      <Link href="/faq" className="pv-a-faq-more">
        See all questions
        <span aria-hidden="true">&#8594;</span>
      </Link>
    </section>
  )
}
