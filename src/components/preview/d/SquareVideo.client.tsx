"use client"

import { useRef, useState } from "react"

// A strictly 1:1 video frame.
//
// THE CONTRACT: the frame is square (aspect-ratio 1/1) and the asset is
// square, so `object-fit: cover` is an identity mapping — nothing is cropped,
// nothing is stretched, and there is no letterbox or pillarbox anywhere at
// any viewport width. The square stays square from 390px to 2560px because
// the aspect ratio is declared on the box rather than computed from a height.
//
// THE GUARD: if a non-square file is ever dropped in, `cover` would silently
// crop it, which is exactly the failure this section must never ship. So the
// component measures the real videoWidth/videoHeight once metadata arrives
// and surfaces a visible notice instead of quietly cropping. The notice is
// prototype chrome — it only ever appears when the asset is wrong.
export default function SquareVideo({
  src,
  poster,
  label,
}: {
  src: string
  poster?: string
  label: string
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [started, setStarted] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [ratio, setRatio] = useState<{ w: number; h: number } | null>(null)

  const squareSource = !ratio || ratio.w === ratio.h

  const start = () => {
    const v = videoRef.current
    if (!v) return
    setStarted(true)
    const p = v.play()
    if (p && typeof p.then === "function") p.catch(() => setStarted(false))
  }

  return (
    <figure className="pv-d-sq">
      <style>{`
        .pv-d-sq { margin: 0; width: 100%; }
        .pv-d-sq-frame {
          position: relative; width: 100%; aspect-ratio: 1 / 1;
          overflow: hidden; background: var(--d-black);
          border: 1px solid rgba(26,26,26,0.12);
        }
        /* Both layers fill the square exactly. With a square source this
           crops nothing — it is simply a 1:1 fit. */
        .pv-d-sq-frame video, .pv-d-sq-frame img {
          position: absolute; inset: 0; width: 100%; height: 100%;
          object-fit: cover; object-position: center; display: block;
        }
        .pv-d-sq-poster { transition: opacity 620ms ease; }
        .pv-d-sq[data-started="true"] .pv-d-sq-poster { opacity: 0; pointer-events: none; }
        .pv-d-sq-veil {
          position: absolute; inset: 0; pointer-events: none;
          background: linear-gradient(to top, rgba(10,10,10,0.3), transparent 52%);
          transition: opacity 620ms ease;
        }
        .pv-d-sq[data-started="true"] .pv-d-sq-veil { opacity: 0; }
        .pv-d-sq-play {
          position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
          width: 84px; height: 84px; border-radius: 50%; padding: 0; cursor: pointer;
          background: rgba(10,10,10,0.42); border: 1px solid rgba(245,242,238,0.5);
          backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center;
          transition: background 520ms ease, border-color 520ms ease, transform 620ms cubic-bezier(0.16,1,0.3,1);
        }
        .pv-d-sq-play:hover {
          background: rgba(200,169,126,0.9); border-color: var(--d-accent);
          transform: translate(-50%, -50%) scale(1.06);
        }
        .pv-d-sq-play svg { margin-left: 4px; }
        .pv-d-sq-play:hover svg path { fill: #0a0a0a; }
        .pv-d-sq-cap {
          display: flex; align-items: center; justify-content: space-between; gap: 14px;
          flex-wrap: wrap; padding-top: 11px;
          font-family: var(--font-dm-sans), sans-serif; font-size: 10px; font-weight: 500;
          letter-spacing: 0.2em; text-transform: uppercase; color: rgba(26,26,26,0.38);
        }
        .pv-d-sq-warn {
          margin-top: 10px; padding: 11px 14px;
          border: 1px dashed rgba(168,137,94,0.6); background: rgba(168,137,94,0.08);
          font-family: var(--font-dm-sans), sans-serif; font-size: 11.5px; line-height: 1.65;
          color: var(--d-text); letter-spacing: 0;  text-transform: none; font-weight: 400;
        }
      `}</style>

      <div className="pv-d-sq-frame" data-started={started}>
        <video
          ref={videoRef}
          src={src}
          poster={undefined}
          playsInline
          preload="metadata"
          controls={started}
          aria-label={label}
          onLoadedMetadata={(e) => {
            const v = e.currentTarget
            if (v.videoWidth && v.videoHeight) setRatio({ w: v.videoWidth, h: v.videoHeight })
          }}
          onPlay={() => {
            setStarted(true)
            setPlaying(true)
          }}
          onPause={() => setPlaying(false)}
        />

        {poster && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={poster} alt="" aria-hidden="true" className="pv-d-sq-poster" />
        )}
        <span className="pv-d-sq-veil" aria-hidden="true" />

        {!started && !playing && (
          <button type="button" className="pv-d-sq-play" onClick={start} aria-label={`Play ${label}`}>
            <svg width="22" height="26" viewBox="0 0 22 26" fill="none" aria-hidden="true">
              <path d="M0 0 L22 13 L0 26 Z" fill="#f5f2ee" />
            </svg>
          </button>
        )}
      </div>

      <figcaption className="pv-d-sq-cap">
        <span>{label}</span>
        <span>{ratio ? `${ratio.w}×${ratio.h}` : "1:1"}</span>
      </figcaption>

      {!squareSource && ratio && (
        <p className="pv-d-sq-warn">
          <strong>Prototype notice — this file is not square.</strong> It is {ratio.w}&times;{ratio.h}, so fitting
          it to the 1:1 frame would crop it. Re-export from CapCut with the canvas set to 1:1, then run{" "}
          <code>node scripts/prepare-testimonial-video.mjs &quot;/path/to/export.mov&quot;</code>. This notice
          disappears on its own once the asset is square.
        </p>
      )}
    </figure>
  )
}
