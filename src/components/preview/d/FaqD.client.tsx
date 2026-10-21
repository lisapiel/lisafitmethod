"use client"

import Link from "next/link"
import { useState } from "react"
import { ParallaxMedia } from "../ParallaxMedia.client"
import { Reveal, RevealLines, DrawRule } from "../Reveal.client"
import { Atmosphere } from "./FlowD"
import { FAQS, FAQ_HEAD } from "../c/productionCopy"

// Common questions.
//
// Every question and every answer is the live text, all of it in the markup.
// It is revealed one panel at a time because four long answers arriving at
// once this late in the page is a density problem, and the layout is the
// right place to solve it.
export default function FaqD({
  portraitUrl,
  backdrop,
}: {
  portraitUrl?: string
  backdrop?: string
}) {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section className="pv-d-faq pv-d-light-alt pv-d-section" data-tone="light" id="faq">
      <style>{`
        .pv-d-faq-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; flex-wrap: wrap; }
        .pv-d-faq-grid {
          display: grid; grid-template-columns: minmax(0, 0.5fr) minmax(0, 1fr);
          gap: clamp(30px, 4.6vw, 80px); align-items: start;
        }
        .pv-d-faq-plate { position: sticky; top: 104px; }
        .pv-d-faq-plate::after {
          content: ""; position: absolute; top: 18px; left: -18px; right: 18px; bottom: -18px;
          border: 1px solid rgba(168,137,94,0.3); pointer-events: none;
        }
        @media (max-width: 960px) {
          .pv-d-faq-grid { grid-template-columns: 1fr; gap: var(--d-step-4); }
          .pv-d-faq-plate { position: static; max-width: 320px; }
          .pv-d-faq-plate::after { top: 12px; left: -12px; right: 12px; bottom: -12px; }
        }
        .pv-d-faq-row { border-bottom: 1px solid var(--d-rule); }
        .pv-d-faq-row:first-of-type { border-top: 1px solid var(--d-rule); }
        .pv-d-faq-btn {
          width: 100%; display: grid; grid-template-columns: 1fr 28px; gap: 18px; align-items: center;
          background: none; border: none; cursor: pointer; text-align: left; font: inherit;
          padding: var(--d-step-3) 0;
        }
        .pv-d-faq-q {
          font-family: var(--font-playfair), serif; font-weight: 500;
          font-size: clamp(1.1rem, 1.6vw, 1.45rem); line-height: 1.26;
          color: rgba(26,26,26,0.55); margin: 0;
          transition: color 560ms cubic-bezier(0.16,1,0.3,1), transform 560ms cubic-bezier(0.16,1,0.3,1);
          transform-origin: left center;
        }
        .pv-d-faq-row[data-open="true"] .pv-d-faq-q, .pv-d-faq-btn:hover .pv-d-faq-q { color: var(--d-text); }
        .pv-d-faq-row[data-open="true"] .pv-d-faq-q { transform: translateX(8px); }
        .pv-d-faq-sign {
          justify-self: end; color: var(--d-accent-dark); font-size: 20px; line-height: 1;
          transition: transform 560ms cubic-bezier(0.16,1,0.3,1);
        }
        .pv-d-faq-row[data-open="true"] .pv-d-faq-sign { transform: rotate(45deg); }
        .pv-d-faq-a {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
          font-size: clamp(0.925rem, 1.02vw, 1rem); line-height: 1.86;
          color: var(--d-muted); margin: 0; max-width: 74ch; padding: 0 0 var(--d-step-4);
        }
      `}</style>

      {backdrop && <Atmosphere src={backdrop} tone="light" opacity={0.16} position="center 50%" />}
      <div className="pv-d-inner pv-d-above">
        <div className="pv-d-open pv-d-faq-head">
          <div>
            <p className="pv-d-eyebrow">{FAQ_HEAD.eyebrow}</p>
            <div className="pv-d-open-rule">
              <DrawRule color="rgba(168,137,94,0.55)" />
            </div>
            <h2 className="pv-d-display pv-d-h2">
              <RevealLines
                lines={[FAQ_HEAD.headingLine1, <i key="em">{FAQ_HEAD.headingLine2}</i>]}
                stagger={120}
              />
            </h2>
          </div>
          <Link href="/faq" className="pv-d-link">
            {FAQ_HEAD.link}
          </Link>
        </div>

        <div className="pv-d-faq-grid">
          {portraitUrl && (
            <Reveal variant="fade" duration={1300} className="pv-d-faq-plate">
              <ParallaxMedia
                src={portraitUrl}
                alt="Lisa McPherson, Certified Personal Trainer"
                objectPosition="center 18%"
                aspect="3 / 4"
                shift={11}
                sizes="(max-width: 960px) 320px, 28vw"
              />
            </Reveal>
          )}

          <div>
        {FAQS.map((item, i) => {
          const isOpen = open === i
          return (
            <div key={item.q} className="pv-d-faq-row" data-open={isOpen}>
              <button
                type="button"
                className="pv-d-faq-btn"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
              >
                <h3 className="pv-d-faq-q">{item.q}</h3>
                <span className="pv-d-faq-sign" aria-hidden="true">
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
                  <p className="pv-d-faq-a">{item.a}</p>
                </div>
              </div>
            </div>
          )
        })}
          </div>
        </div>
      </div>
    </section>
  )
}
