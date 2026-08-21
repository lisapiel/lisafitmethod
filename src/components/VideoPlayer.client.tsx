"use client"
import { useRef, useEffect, useState } from "react"

// Simple, resilient hero video player. The stable structure is:
//
//   <container class=... style=...>
//     <img>   ← poster layer, always visible when video isn't playing
//     <video> ← autoplay-muted-playsinline layer, opacity 1 once playing
//     <button ← manual play overlay, only shown if autoplay was BLOCKED
//   </container>
//
// The container ALWAYS renders with the parent-supplied size, even if
// `src` is empty or the video errors — that guarantees the hero can
// never collapse and the page can never jump past it. The one and only
// path that can hide the container is the parent choosing not to render
// the component at all; callers must not gate it on `src` being truthy.
//
// The `<video>` intentionally has NO `poster` attribute — set on iOS
// Safari that attribute triggers a NATIVE play-button overlay that is
// unresponsive under `pointer-events:none`, which was the "poster with
// a play button that does nothing" symptom. We render the poster as a
// plain sibling <img> instead.
//
// The playback state is deliberately minimal:
//   isPlaying    — true when the video's `playing` event has fired
//   autoplayBlocked — true if play() rejected with NotAllowedError,
//                     which surfaces the manual play button
// No intersection observer, no visibility retries, no readiness event
// chain — those were the source of the racing/inconsistent states.
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

    // Muted BEFORE play() so iOS respects autoplay eligibility.
    v.muted = true
    v.defaultMuted = true
    v.playsInline = true

    const onPlaying = () => {
      setIsPlaying(true)
      setAutoplayBlocked(false)
    }
    const onPause = () => setIsPlaying(false)
    const onEnded = () => setIsPlaying(false) // loop should prevent this
    // A media error keeps the poster visible; no play button, since
    // it wouldn't do anything useful.
    const onError = () => {
      setIsPlaying(false)
      setAutoplayBlocked(false)
    }

    v.addEventListener("playing", onPlaying)
    v.addEventListener("pause", onPause)
    v.addEventListener("ended", onEnded)
    v.addEventListener("error", onError)

    const p = v.play()
    if (p && typeof p.then === "function") {
      p.catch((err: unknown) => {
        // NotAllowedError = autoplay was blocked (Low Power Mode, Data Saver,
        // policy). Anything else (AbortError from interrupted play, network
        // hiccups) will resolve via the `playing` or `error` events above.
        if (err && typeof err === "object" && "name" in err && (err as { name: string }).name === "NotAllowedError") {
          setAutoplayBlocked(true)
        }
      })
    }

    return () => {
      v.removeEventListener("playing", onPlaying)
      v.removeEventListener("pause", onPause)
      v.removeEventListener("ended", onEnded)
      v.removeEventListener("error", onError)
    }
  }, [src])

  const handleManualPlay = () => {
    const v = videoRef.current
    if (!v) return
    // The user-gesture context lets iOS honor the play() call even when
    // its silent autoplay policy blocked the initial attempt.
    v.muted = true
    v.playsInline = true
    const p = v.play()
    if (p && typeof p.then === "function") {
      p.then(() => {
        // The `playing` event handler will flip isPlaying/autoplayBlocked.
      }).catch(() => {
        // If even the user-gesture play fails, leave the button visible so
        // the user can retry.
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
        // Poster layer. Always mounted; fades out only once the video is
        // actually playing. This is the guaranteed-visible fallback.
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
        // Video layer. Sits on top of the poster and only becomes visible
        // (opacity 1) after the `playing` event fires. Never carries the
        // `poster` attribute — that would invoke iOS's native play button.
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
          // don't type it, so cast; the browser reads it as a real attribute.
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
