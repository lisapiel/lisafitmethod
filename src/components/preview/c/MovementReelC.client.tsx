"use client"

import MovementVideo from "../MovementVideo.client"
import { useInView } from "../Reveal.client"
import { useIsNarrow } from "../useIsNarrow.client"

// A silent band of real footage from the Training Foundations library.
//
// DELIBERATELY TEXT-FREE. The course card already says "Includes 50+
// exercise videos"; this shows them rather than adding a single new word to
// the page. Exercise names are available and could label each plate, but
// that would be copy this prototype has not been approved to add.
//
// Each plate mounts its clip only once it is actually in view, so a band of
// eight never puts eight video loads on the wire at once.
function Plate({ url, index, narrow }: { url: string; index: number; narrow: boolean }) {
  const { ref, inView } = useInView<HTMLDivElement>(0.4)

  return (
    <div ref={ref} className="pv-c-reel-plate" style={{ animationDelay: `${index * 90}ms` }}>
      <MovementVideo src={url} mounted={inView} active={inView} label="" />
      <span className="pv-c-reel-tint" aria-hidden="true" />
      {narrow ? null : <span className="pv-c-reel-edge" aria-hidden="true" />}
    </div>
  )
}

export default function MovementReelC({ urls }: { urls: string[] }) {
  const narrow = useIsNarrow()
  const shown = narrow ? urls.slice(0, 4) : urls.slice(0, 6)

  if (shown.length === 0) return null

  return (
    <div className="pv-c-reel" role="presentation">
      <style>{`
        .pv-c-reel {
          display: grid; grid-template-columns: repeat(6, 1fr); gap: 2px;
          margin-top: clamp(34px, 4vw, 60px);
        }
        .pv-c-reel-plate {
          position: relative; overflow: hidden; aspect-ratio: 3 / 4;
          background: var(--c-black);
        }
        .pv-c-reel-tint {
          position: absolute; inset: 0; pointer-events: none;
          background: linear-gradient(to top, rgba(10,10,10,0.42), transparent 60%);
        }
        .pv-c-reel-edge {
          position: absolute; inset: 0; pointer-events: none;
          box-shadow: inset 0 0 0 1px rgba(200,169,126,0.16);
        }
        @media (max-width: 1100px) { .pv-c-reel { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 640px) { .pv-c-reel { grid-template-columns: repeat(2, 1fr); } }
      `}</style>
      {shown.map((url, i) => (
        <Plate key={url} url={url} index={i} narrow={narrow} />
      ))}
    </div>
  )
}
