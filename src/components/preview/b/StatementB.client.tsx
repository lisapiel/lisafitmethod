"use client"

import { useScrollProgress } from "../useScrollProgress.client"
import { usePrefersReducedMotion } from "../Reveal.client"
import { STATEMENTS } from "../previewContent"

// DIRECTION B — the pinned statement panel.
//
// This is the "smooth transition between sections" doing real work: a tall
// scroll region with a pinned viewport inside it, through which four
// statements cross-fade. The page keeps scrolling, the frame holds still,
// and the argument advances one line at a time — the cinematic device that
// separates the hero from the story.
//
// Under prefers-reduced-motion the pin is abandoned and all four statements
// are simply stacked and readable.
export default function StatementB() {
  const reduced = usePrefersReducedMotion()
  const { ref, progress } = useScrollProgress<HTMLDivElement>()

  const n = STATEMENTS.length
  // Remap raw travel to the window where the panel is actually pinned, then
  // spread the statements across it.
  const t = Math.min(Math.max((progress - 0.2) / 0.6, 0), 0.9999)
  const exact = t * n
  const index = Math.floor(exact)

  if (reduced) {
    return (
      <section className="pv-b-stack" aria-label="The method">
        <style>{`
          .pv-b-stack { background: #08080a; padding: clamp(60px, 7vw, 110px) clamp(20px, 5vw, 72px); display: grid; gap: clamp(36px, 4vw, 60px); }
        `}</style>
        {STATEMENTS.map((s) => (
          <div key={s.big}>
            <h2 className="pv-b-display" style={{ fontSize: "clamp(1.8rem, 4vw, 3.4rem)", marginBottom: 14 }}>
              {s.big}
            </h2>
            <p className="pv-b-body" style={{ maxWidth: "52ch" }}>
              {s.small}
            </p>
          </div>
        ))}
      </section>
    )
  }

  return (
    <section ref={ref} className="pv-b-pin" aria-label="The method">
      <style>{`
        .pv-b-pin { position: relative; height: 320vh; background: #08080a; }
        .pv-b-pin-stage {
          position: sticky; top: 0; height: 100vh;
          display: flex; align-items: center;
          padding: 0 clamp(20px, 5vw, 72px); overflow: hidden;
        }
        .pv-b-pin-glow {
          position: absolute; top: 50%; left: 8%; width: 760px; height: 760px; max-width: 120vw;
          transform: translateY(-50%);
          background: radial-gradient(circle, rgba(201,169,110,0.1) 0%, transparent 68%);
          pointer-events: none;
        }
        .pv-b-pin-slot { position: relative; width: 100%; max-width: 1180px; margin: 0 auto; }
        .pv-b-pin-item { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: center; }
        .pv-b-pin-item[data-first="true"] { position: relative; }
        .pv-b-pin-big { font-size: clamp(2rem, 6.4vw, 5.4rem); max-width: 18ch; margin-bottom: clamp(18px, 2.2vw, 30px); }
        .pv-b-pin-small { max-width: 46ch; font-size: clamp(0.9rem, 1.1vw, 1.05rem); }
        .pv-b-pin-ticks { position: absolute; right: clamp(20px, 5vw, 72px); top: 50%; transform: translateY(-50%); display: flex; flex-direction: column; gap: 14px; }
        .pv-b-pin-tick { width: 1px; height: 34px; background: rgba(201,169,110,0.2); transition: background 700ms ease; }
        .pv-b-pin-tick[data-on="true"] { background: #c9a96e; }
        @media (max-width: 900px) {
          .pv-b-pin { height: 300vh; }
          .pv-b-pin-ticks { display: none; }
        }
      `}</style>

      <div className="pv-b-pin-stage">
        <div className="pv-b-pin-glow" aria-hidden="true" />
        <div className="pv-b-pin-slot">
          {STATEMENTS.map((s, i) => {
            const distance = exact - i
            // Each statement owns one unit of travel: it rises in over the
            // first 0.35, holds, and lifts out after 0.75.
            const on = index === i
            const offset = on ? (distance - 0.5) * -22 : distance < 0 ? 40 : -40
            return (
              <div
                key={s.big}
                data-first={i === 0}
                className="pv-b-pin-item"
                style={{
                  opacity: on ? 1 : 0,
                  transform: `translate3d(0, ${offset}px, 0)`,
                  transition: "opacity 760ms cubic-bezier(0.16,1,0.3,1), transform 760ms cubic-bezier(0.16,1,0.3,1)",
                  pointerEvents: on ? "auto" : "none",
                }}
                aria-hidden={!on}
              >
                <h2 className="pv-b-display pv-b-pin-big">{s.big}</h2>
                <p className="pv-b-body pv-b-pin-small">{s.small}</p>
              </div>
            )
          })}
        </div>
        <div className="pv-b-pin-ticks" aria-hidden="true">
          {STATEMENTS.map((s, i) => (
            <span key={s.big} className="pv-b-pin-tick" data-on={index === i} />
          ))}
        </div>
      </div>
    </section>
  )
}
