"use client"

import { useCallback, useRef, useState } from "react"
import MovementVideo from "./MovementVideo.client"
import { useInView } from "./Reveal.client"
import { useIsNarrow } from "./useIsNarrow.client"
import type { MovementSlot } from "./previewContent"

// DIRECTION B — "The Reel"
//
// The course showcase as a horizontal film rail of tall plates, each one a
// real clip from the movement library. On desktop a plate wakes under the
// cursor; on a phone the plate that scrolls into the centre wakes on its own,
// so the showcase is alive in the hand without anything to tap.
function RailCard({
  movement,
  url,
  index,
  narrow,
}: {
  movement: MovementSlot
  url: string
  index: number
  narrow: boolean
}) {
  const { ref, inView } = useInView<HTMLElement>(0.55)
  const [hover, setHover] = useState(false)
  const awake = narrow ? inView : hover

  return (
    <article
      ref={ref}
      className="pv-b-card"
      data-awake={awake}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      tabIndex={0}
      aria-label={`${movement.name} — ${movement.pattern}`}
    >
      <div className="pv-b-card-plate">
        <MovementVideo src={url} mounted={inView} active={awake} label={movement.name} />
        <div className="pv-b-card-scrim" aria-hidden="true" />
        <span className="pv-b-card-module">{movement.module}</span>
        <div className="pv-b-card-foot">
          <span className="pv-b-card-pattern">{movement.pattern}</span>
          <h3 className="pv-b-card-name">{movement.name}</h3>
          <p className="pv-b-card-note">{movement.note}</p>
        </div>
      </div>
      <span className="pv-b-card-index" aria-hidden="true">
        {String(index + 1).padStart(2, "0")}
      </span>
    </article>
  )
}

export default function MovementRailB({
  movements,
  urls,
}: {
  movements: MovementSlot[]
  urls: Record<string, string>
}) {
  const available = movements.filter((m) => urls[m.slot])
  const trackRef = useRef<HTMLDivElement>(null)
  const narrow = useIsNarrow()

  const nudge = useCallback((dir: 1 | -1) => {
    const el = trackRef.current
    if (!el) return
    el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.62), behavior: "smooth" })
  }, [])

  if (available.length === 0) return null

  return (
    <div className="pv-b-rail">
      <style>{`
        .pv-b-rail { position: relative; }
        .pv-b-rail-track {
          display: flex;
          gap: clamp(14px, 1.6vw, 26px);
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          padding: 0 clamp(20px, 6vw, 96px) 8px;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
        }
        .pv-b-rail-track::-webkit-scrollbar { display: none; }
        .pv-b-card {
          position: relative;
          flex: 0 0 auto;
          width: clamp(240px, 25vw, 340px);
          scroll-snap-align: center;
          outline: none;
        }
        .pv-b-card-plate {
          position: relative;
          aspect-ratio: 9 / 16;
          overflow: hidden;
          background: #0c0c0e;
          border: 1px solid rgba(201,169,110,0.16);
          transition: border-color 700ms cubic-bezier(0.16,1,0.3,1), transform 900ms cubic-bezier(0.16,1,0.3,1), box-shadow 900ms ease;
        }
        .pv-b-card[data-awake="true"] .pv-b-card-plate {
          border-color: rgba(201,169,110,0.5);
          transform: translateY(-8px);
          box-shadow: 0 30px 70px -30px rgba(201,169,110,0.3);
        }
        .pv-b-card-scrim {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(8,8,10,0.94) 0%, rgba(8,8,10,0.45) 38%, rgba(8,8,10,0.1) 70%, rgba(8,8,10,0.4) 100%);
          transition: opacity 700ms ease;
        }
        .pv-b-card[data-awake="true"] .pv-b-card-scrim { opacity: 0.82; }
        .pv-b-card-module {
          position: absolute; top: 16px; left: 16px;
          font-family: var(--font-montserrat), sans-serif;
          font-size: 9px; font-weight: 500; letter-spacing: 0.24em; text-transform: uppercase;
          color: rgba(201,169,110,0.8);
        }
        .pv-b-card-foot { position: absolute; left: 16px; right: 16px; bottom: 18px; }
        .pv-b-card-pattern {
          display: block; margin-bottom: 8px;
          font-family: var(--font-montserrat), sans-serif;
          font-size: 9px; font-weight: 500; letter-spacing: 0.24em; text-transform: uppercase;
          color: rgba(240,230,211,0.5);
        }
        .pv-b-card-name {
          font-family: var(--font-cormorant), serif;
          font-size: clamp(1.5rem, 1.9vw, 2rem); font-weight: 400; line-height: 1.08;
          color: #f0e6d3; margin: 0;
        }
        .pv-b-card-note {
          font-family: var(--font-montserrat), sans-serif;
          font-size: 11.5px; line-height: 1.65; color: rgba(240,230,211,0.62);
          margin: 0; overflow: hidden;
          max-height: 0; opacity: 0;
          transition: max-height 700ms cubic-bezier(0.16,1,0.3,1), opacity 600ms ease, padding-top 700ms cubic-bezier(0.16,1,0.3,1);
        }
        .pv-b-card[data-awake="true"] .pv-b-card-note { max-height: 7rem; opacity: 1; padding-top: 10px; }
        .pv-b-card-index {
          position: absolute; top: -26px; right: 2px;
          font-family: var(--font-cormorant), serif;
          font-size: 13px; letter-spacing: 0.3em;
          color: rgba(201,169,110,0.35);
        }
        .pv-b-rail-nav { display: flex; gap: 8px; justify-content: flex-end; padding: 28px clamp(20px, 6vw, 96px) 0; }
        .pv-b-rail-btn {
          width: 46px; height: 46px; border-radius: 50%;
          background: transparent; border: 1px solid rgba(201,169,110,0.3);
          color: #c9a96e; cursor: pointer; font-size: 15px; line-height: 1;
          display: flex; align-items: center; justify-content: center;
          transition: background 420ms ease, border-color 420ms ease, color 420ms ease;
        }
        .pv-b-rail-btn:hover { background: #c9a96e; border-color: #c9a96e; color: #08080a; }
        @media (max-width: 900px) {
          .pv-b-rail-nav { display: none; }
          .pv-b-card-note { max-height: 7rem; opacity: 1; padding-top: 10px; }
        }
      `}</style>

      <div className="pv-b-rail-track" ref={trackRef}>
        {available.map((m, i) => (
          <RailCard key={m.slot} movement={m} url={urls[m.slot]} index={i} narrow={narrow} />
        ))}
      </div>

      <div className="pv-b-rail-nav">
        <button type="button" className="pv-b-rail-btn" onClick={() => nudge(-1)} aria-label="Previous movements">
          &#8592;
        </button>
        <button type="button" className="pv-b-rail-btn" onClick={() => nudge(1)} aria-label="More movements">
          &#8594;
        </button>
      </div>
    </div>
  )
}
