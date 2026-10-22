"use client"

import MovementVideo from "../MovementVideo.client"
import { animatedPosterFor } from "../animatedPoster"
import { useInView } from "../Reveal.client"

// Real footage from the Training Foundations library, composed rather than
// tiled.
//
// Six equal squares read as a contact sheet: nothing is the subject, so the
// eye skims it. One large plate with two supporting clips reads as a lead
// image with detail shots, which is how a magazine would run the same three
// frames. On a phone the lead stays full width and the pair sit beneath it,
// so the movement is still legible instead of being three thumbnails.
//
// DELIBERATELY TEXT-FREE. The course promises exercise demonstration videos;
// these are them. Each plate mounts its clip only once it is in view.
export default function MovementGridD({ urls }: { urls: string[] }) {
  const [lead, ...rest] = urls
  const supporting = rest.slice(0, 2)
  if (!lead) return null

  return (
    <div className="pv-d-mgrid" role="presentation">
      <style>{`
        .pv-d-mgrid {
          display: grid;
          grid-template-columns: 1.32fr 1fr;
          grid-template-rows: auto auto;
          gap: clamp(6px, 0.7vw, 11px);
        }
        .pv-d-mgrid-lead { grid-row: span 2; }
        .pv-d-mplate {
          position: relative; overflow: hidden; background: var(--d-black);
          box-shadow: 0 26px 60px -44px rgba(26,26,26,0.7);
        }
        .pv-d-mplate--lead { aspect-ratio: 3 / 4; }
        .pv-d-mplate--small { aspect-ratio: 4 / 3; }
        .pv-d-mplate::after {
          content: ""; position: absolute; inset: 0; pointer-events: none;
          background: linear-gradient(to top, rgba(10,10,10,0.3), transparent 56%);
          transition: opacity 700ms ease;
        }
        .pv-d-mplate:hover::after { opacity: 0.4; }
        @media (max-width: 760px) {
          .pv-d-mgrid { grid-template-columns: 1fr 1fr; }
          .pv-d-mgrid-lead { grid-row: auto; grid-column: span 2; }
          .pv-d-mplate--lead { aspect-ratio: 4 / 3; }
          .pv-d-mplate--small { aspect-ratio: 1 / 1; }
        }
      `}</style>

      <div className="pv-d-mgrid-lead">
        <Plate url={lead} variant="lead" />
      </div>
      {supporting.map((url) => (
        <Plate key={url} url={url} variant="small" />
      ))}
    </div>
  )
}

// A still frame for each clip, committed under public/posters with the same
// basename as the video. It is what the plate shows when the browser will not
// decode the clip — which is every one of them on iOS past its limit on
// simultaneous video. A clip without a matching still simply has no poster,
// which is the behaviour this replaces, so nothing regresses.
function posterFor(url: string): string | undefined {
  const file = url.split("/").pop()
  if (!file) return undefined
  const name = file.replace(/\.[a-z0-9]+$/i, "")
  return KNOWN_POSTERS.has(name) ? `/posters/${name}.jpg` : undefined
}

const KNOWN_POSTERS = new Set(["m1_goblet_squat", "m1_hip_hinge", "m2_rdl"])

function Plate({ url, variant }: { url: string; variant: "lead" | "small" }) {
  const { ref, inView } = useInView<HTMLDivElement>(0.3)
  return (
    <div ref={ref} className={`pv-d-mplate pv-d-mplate--${variant}`}>
      <MovementVideo
        src={url}
        poster={posterFor(url)}
        animatedPoster={animatedPosterFor(url)}
        mounted={inView}
        active={inView}
        label=""
      />
    </div>
  )
}
