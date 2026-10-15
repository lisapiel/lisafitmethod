"use client"

import { MANIFESTO } from "../previewContent"
import { usePrefersReducedMotion } from "../Reveal.client"

// A slow ink band between the hero and the story. One continuous line of
// display serif, drifting at reading pace rather than ticker pace — it marks
// the end of the masthead and states the method in four phrases.
//
// Under prefers-reduced-motion the track stops and wraps centred instead.
export default function MarqueeA() {
  const reduced = usePrefersReducedMotion()

  const items = MANIFESTO.map((m, i) => (
    <span key={`${m}-${i}`} className="pv-a-marquee-item">
      {m}
      <span className="pv-a-marquee-dot" aria-hidden="true">
        &#9671;
      </span>
    </span>
  ))

  return (
    <section className="pv-a-marquee" data-reduced={reduced} aria-label="The method">
      <style>{`
        .pv-a-marquee { background: #121110; overflow: hidden; padding: clamp(22px, 2.4vw, 34px) 0; }
        .pv-a-marquee-track { display: flex; width: max-content; }
        .pv-a-marquee-track[data-animated="true"] { animation: pvAMarquee 48s linear infinite; }
        .pv-a-marquee-group { display: flex; }
        .pv-a-marquee-item {
          display: inline-flex; align-items: center;
          font-family: var(--font-playfair), serif;
          font-size: clamp(1.15rem, 2.1vw, 2rem); font-weight: 400; font-style: italic;
          color: rgba(247,244,239,0.88); white-space: nowrap;
        }
        .pv-a-marquee-dot { color: #a8895e; font-style: normal; font-size: 0.42em; padding: 0 clamp(20px, 2.4vw, 42px); }
        .pv-a-marquee[data-reduced="true"] { padding: 26px clamp(20px, 5vw, 72px); }
        .pv-a-marquee[data-reduced="true"] .pv-a-marquee-track { width: auto; flex-wrap: wrap; justify-content: center; }
        @keyframes pvAMarquee {
          from { transform: translate3d(0, 0, 0); }
          to   { transform: translate3d(-50%, 0, 0); }
        }
      `}</style>
      <div className="pv-a-marquee-track" data-animated={!reduced}>
        <div className="pv-a-marquee-group">{items}</div>
        {!reduced && (
          <div className="pv-a-marquee-group" aria-hidden="true">
            {items}
          </div>
        )}
      </div>
    </section>
  )
}
