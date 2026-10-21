"use client"

import { useState } from "react"

// A disclosure list for long question sets. Used by the /faq page, where the
// answers are React nodes carrying inline links, which is why this takes
// children rather than strings.
//
// One item open at a time per group: with twenty questions on the page, free
// multi-open turns the page into a wall and loses the reader's place.
export function AccordionD({
  items,
  idPrefix,
}: {
  items: { q: string; a: React.ReactNode }[]
  idPrefix: string
}) {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className="pv-d-acc">
      <style>{`
        .pv-d-acc { border-top: 1px solid var(--d-rule); }
        .pv-d-acc-row { border-bottom: 1px solid var(--d-rule); }
        .pv-d-acc-btn {
          width: 100%; display: flex; align-items: flex-start; justify-content: space-between;
          gap: var(--d-step-3); background: none; border: 0; cursor: pointer;
          padding: var(--d-step-3) 0; text-align: left; color: inherit;
          font-family: var(--font-playfair), serif; font-weight: 500;
          font-size: clamp(1rem, 1.25vw, 1.15rem); line-height: 1.45;
        }
        .pv-d-acc-btn:hover { color: var(--d-accent-dark); }
        .pv-d-acc-sign {
          flex-shrink: 0; width: 15px; height: 15px; position: relative; margin-top: 6px;
        }
        .pv-d-acc-sign::before, .pv-d-acc-sign::after {
          content: ""; position: absolute; background: var(--d-accent-dark);
          transition: transform 520ms cubic-bezier(0.16, 1, 0.3, 1), opacity 320ms ease;
        }
        .pv-d-acc-sign::before { top: 7px; left: 0; width: 15px; height: 1px; }
        .pv-d-acc-sign::after { top: 0; left: 7px; width: 1px; height: 15px; }
        .pv-d-acc-row[data-open="true"] .pv-d-acc-sign::after { transform: rotate(90deg); opacity: 0; }
        .pv-d-acc-panel {
          overflow: hidden; display: grid; grid-template-rows: 0fr;
          /* visibility, not [hidden]: it keeps the row animatable while still
             taking the collapsed answer's links out of the tab order. */
          visibility: hidden;
          transition: grid-template-rows 620ms cubic-bezier(0.16, 1, 0.3, 1), visibility 620ms;
        }
        .pv-d-acc-row[data-open="true"] .pv-d-acc-panel {
          grid-template-rows: 1fr; visibility: visible;
        }
        .pv-d-acc-panel > div { overflow: hidden; }
        .pv-d-acc-a {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
          font-size: clamp(0.88rem, 1vw, 0.96rem); line-height: 1.85;
          color: var(--d-muted); margin: 0 0 var(--d-step-3); max-width: 76ch;
          padding-right: var(--d-step-4);
        }
        @media (prefers-reduced-motion: reduce) {
          .pv-d-acc-panel { transition: none; }
          .pv-d-acc-sign::before, .pv-d-acc-sign::after { transition: none; }
        }
      `}</style>
      {items.map((item, i) => {
        const isOpen = open === i
        return (
          <div key={item.q} className="pv-d-acc-row" data-open={isOpen}>
            <h3 style={{ margin: 0 }}>
              <button
                type="button"
                className="pv-d-acc-btn"
                aria-expanded={isOpen}
                aria-controls={`${idPrefix}-${i}`}
                onClick={() => setOpen(isOpen ? null : i)}
              >
                <span>{item.q}</span>
                <span className="pv-d-acc-sign" aria-hidden="true" />
              </button>
            </h3>
            <div className="pv-d-acc-panel" id={`${idPrefix}-${i}`} role="region">
              <div>
                <div className="pv-d-acc-a">{item.a}</div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
