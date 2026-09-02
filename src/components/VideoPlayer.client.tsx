"use client"
import { useRef, useEffect, useState } from "react"

// Hero video player. Stable DOM structure:
//
//   <container>              ← always rendered at parent-supplied size
//     [<img poster>]         ← only when a real poster is supplied
//     <video>                ← autoplay muted playsinline; opacity 1 once playing
//     [<button>]             ← manual Play only when autoplay is genuinely denied
//   </container>
//
// Playback state (deliberately minimal):
//   isPlaying         — driven by the `playing` DOM event
//   autoplayBlocked   — set only when a POST-READINESS play() attempt is
//                       rejected with NotAllowedError
//
// The previous version fired `v.play()` inside useEffect on mount,
// before the video had reached HAVE_FUTURE_DATA. On iOS Safari that
// early call reliably rejects with NotAllowedError — not because
// autoplay policy actually denies muted+playsinline video (it doesn't),
// but because the media hasn't loaded enough yet. That premature
// rejection was flagged as an autoplay block and the manual Play
// button was shown, even though the native `autoPlay` attribute would
// have succeeded a moment later. Result: fresh iPhone visitors saw
// the fallback + a Play button they had to tap.
//
// This version waits for the browser's own readiness signal (`canplay`,
// or immediate if the video is already cached) before making a single
// controlled programmatic play attempt. That attempt is essentially a
// no-op when the native autoPlay attribute has already started the
// video — v.paused will be false and we skip. If the video IS still
// paused at readiness AND the programmatic play() is denied with
// NotAllowedError, THAT is a genuine autoplay block and we show the
// manual button. Nothing else triggers the manual button — a media
// error keeps the poster (or dark background) visible without a
// non-functional Play control.
export default function VideoPlayer({
  src,
  poster,
  className,
  style,
}: {
  src: string
  poster?: string
  className?: string
  style?: React.CSSProperties
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [autoplayBlocked, setAutoplayBlocked] = useState(false)

  useEffect(() => {
    const v = videoRef.current
    if (!v || !src) return

    // Mute BEFORE any play attempt. iOS uses defaultMuted (the boolean
    // property, not the JS `muted` alone) to determine autoplay
    // eligibility for muted video.
    v.muted = true
    v.defaultMuted = true
    v.playsInline = true

    let cancelled = false
    let attempted = false

    const onPlaying = () => {
      setIsPlaying(true)
      setAutoplayBlocked(false)
    }
    const onPause = () => setIsPlaying(false)
    const onEnded = () => setIsPlaying(false)   // loop should prevent this
    const onError = () => {
      // A media error keeps the current visual state (poster or dark
      // background). No play button — it wouldn't do anything useful.
      setIsPlaying(false)
      setAutoplayBlocked(false)
    }

    // ONE controlled programmatic attempt, only after the video is
    // actually ready to play. Skipped if native autoPlay has already
    // started it (v.paused === false).
    const attemptPostReadinessPlay = () => {
      if (cancelled || attempted || !v) return
      attempted = true
      if (!v.paused) return   // native autoplay already succeeded
      const p = v.play()
      if (p && typeof p.then === "function") {
        p.catch((err: unknown) => {
          // NotAllowedError is the ONLY error name that means "the
          // browser is refusing autoplay policy". Any other error
          // (AbortError from a subsequent play/pause/src-change,
          // MediaErr surfaced via `error` event) should not surface a
          // Play button.
          const name = (err && typeof err === "object" && "name" in err)
            ? (err as { name: string }).name
            : ""
          if (name === "NotAllowedError") {
            setAutoplayBlocked(true)
          }
        })
      }
    }

    v.addEventListener("playing", onPlaying)
    v.addEventListener("pause", onPause)
    v.addEventListener("ended", onEnded)
    v.addEventListener("error", onError)

    // If the video is already sufficiently loaded (cached from an
    // earlier visit, or preload got there first), attempt immediately.
    // Otherwise wait for `canplay` — the first event that guarantees
    // the browser has enough data to begin playback without stalling.
    if (v.readyState >= 3 /* HAVE_FUTURE_DATA */) {
      attemptPostReadinessPlay()
    } else {
      v.addEventListener("canplay", attemptPostReadinessPlay, { once: true })
    }

    return () => {
      cancelled = true
      v.removeEventListener("playing", onPlaying)
      v.removeEventListener("pause", onPause)
      v.removeEventListener("ended", onEnded)
      v.removeEventListener("error", onError)
      v.removeEventListener("canplay", attemptPostReadinessPlay)
    }
  }, [src])

  const handleManualPlay = () => {
    const v = videoRef.current
    if (!v) return
    // Called from a real user-gesture click, so iOS honors play() even
    // when its silent autoplay policy blocked the initial attempt.
    v.muted = true
    v.playsInline = true
    const p = v.play()
    if (p && typeof p.then === "function") {
      p.then(() => {
        // `playing` handler will flip isPlaying / autoplayBlocked.
      }).catch(() => {
        // Even the user-gesture play failed — leave the button visible
        // so the user can retry.
      })
    }
  }

  const showManualPlay = autoplayBlocked && !isPlaying && !!src

  return (
    <div
      className={className}
      style={{
        position: "relative",
        overflow: "hidden",
        background: "#0a0a0a",
        ...style,
      }}
    >
      {poster && (
        // Poster layer. Only mounted when a real poster URL is
        // supplied — DO NOT pass /hero.png here as a placeholder, it's
        // a different photo and flashes the wrong image. Callers that
        // don't have a video-matching poster should simply omit this
        // prop; the container's dark background handles the load window.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={poster}
          alt=""
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            opacity: isPlaying ? 0 : 1,
            transition: "opacity 0.4s ease",
          }}
        />
      )}

      {src && (
        // Video layer. No `poster` attribute — that triggers iOS's
        // native play-button overlay which was the earlier
        // "unresponsive Play" symptom. Native autoPlay handles the
        // initial start when media becomes ready.
        <video
          ref={videoRef}
          src={src}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          controls={false}
          disablePictureInPicture
          // Legacy iOS + WKWebView attribute. React's HTMLVideoAttributes
          // don't type it; the browser still reads it.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          {...({ "webkit-playsinline": "true" } as any)}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            opacity: isPlaying ? 1 : 0,
            transition: "opacity 0.4s ease",
            pointerEvents: "none",
          }}
        />
      )}

      {showManualPlay && (
        <button
          type="button"
          onClick={handleManualPlay}
          aria-label="Play video"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 84,
            height: 84,
            padding: 0,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            WebkitTapHighlightColor: "transparent",
            touchAction: "manipulation",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="84" height="84" viewBox="0 0 84 84" fill="none" aria-hidden="true">
            <circle cx="42" cy="42" r="40" fill="rgba(10,10,10,0.55)" stroke="rgba(200,169,126,0.85)" strokeWidth="1.5" />
            <path d="M34 26 L60 42 L34 58 Z" fill="rgba(240,230,211,0.95)" />
          </svg>
        </button>
      )}
    </div>
  )
}
