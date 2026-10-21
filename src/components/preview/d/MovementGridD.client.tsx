"use client"

import MovementVideo from "../MovementVideo.client"
import { useInView } from "../Reveal.client"

// Real clips from the Training Foundations library, arranged as a grid beside
// the course they belong to.
//
// DELIBERATELY TEXT-FREE. The course already promises "50+ exercise videos";
// these show them rather than adding a word. Each plate mounts its clip only
// once it scrolls into view, so six never load at once.
export default function MovementGridD({ urls }: { urls: string[] }) {
  const shown = urls.slice(0, 6)
  if (shown.length === 0) return null

  return (
    <div className="pv-d-mgrid" role="presentation">
      <style>{`
        .pv-d-mgrid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3px; }
        .pv-d-mgrid-plate {
          position: relative; overflow: hidden; aspect-ratio: 3 / 4; background: var(--d-black);
        }
        .pv-d-mgrid-plate::after {
          content: ""; position: absolute; inset: 0; pointer-events: none;
          background: linear-gradient(to top, rgba(10,10,10,0.34), transparent 58%);
        }
        @media (max-width: 960px) { .pv-d-mgrid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 560px) { .pv-d-mgrid { grid-template-columns: repeat(2, 1fr); } }
      `}</style>
      {shown.map((url) => (
        <Plate key={url} url={url} />
      ))}
    </div>
  )
}

function Plate({ url }: { url: string }) {
  const { ref, inView } = useInView<HTMLDivElement>(0.3)
  return (
    <div ref={ref} className="pv-d-mgrid-plate">
      <MovementVideo src={url} mounted={inView} active={inView} label="" />
    </div>
  )
}
