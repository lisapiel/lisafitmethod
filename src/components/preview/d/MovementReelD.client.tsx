"use client"

import MovementVideo from "../MovementVideo.client"
import { useInView } from "../Reveal.client"
import { useIsNarrow } from "../useIsNarrow.client"

// A silent filmstrip of real clips from the Training Foundations library.
//
// DELIBERATELY TEXT-FREE. The course card already promises "50+ exercise
// videos"; this shows them instead of adding a single new word. Each plate
// mounts its clip only when it scrolls into view, so six plates never put
// six video loads on the wire at once.
export default function MovementReelD({ urls }: { urls: string[] }) {
  const narrow = useIsNarrow("(max-width: 640px)")
  const shown = narrow ? urls.slice(0, 4) : urls.slice(0, 6)

  if (shown.length === 0) return null

  return (
    <div className="pv-d-reel" role="presentation">
      <style>{`
        .pv-d-reel {
          display: grid; grid-template-columns: repeat(6, 1fr); gap: 2px;
          margin-top: var(--d-step-5);
        }
        .pv-d-reel-plate {
          position: relative; overflow: hidden; aspect-ratio: 3 / 4; background: var(--d-black);
        }
        .pv-d-reel-plate::after {
          content: ""; position: absolute; inset: 0; pointer-events: none;
          background: linear-gradient(to top, rgba(10,10,10,0.4), transparent 58%);
          box-shadow: inset 0 0 0 1px rgba(200,169,126,0.14);
        }
        @media (max-width: 1100px) { .pv-d-reel { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 640px) { .pv-d-reel { grid-template-columns: repeat(2, 1fr); } }
      `}</style>
      {shown.map((url) => (
        <Plate key={url} url={url} />
      ))}
    </div>
  )
}

function Plate({ url }: { url: string }) {
  const { ref, inView } = useInView<HTMLDivElement>(0.35)
  return (
    <div ref={ref} className="pv-d-reel-plate">
      <MovementVideo src={url} mounted={inView} active={inView} label="" />
    </div>
  )
}
