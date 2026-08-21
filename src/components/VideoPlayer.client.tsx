"use client"
import { useRef, useEffect, useState } from "react"

// Autoplay on iOS Safari has strict prerequisites and is racy: the first
// video.play() call fires before the media is ready and rejects with a
// benign NotAllowedError / AbortError. Previous versions of this component
// treated that first rejection as terminal and swapped in a poster image,
// which is exactly the "video never plays on my phone" symptom users saw.
//
// This version:
//   - lets the browser handle the initial autoplay via the native
//     `autoplay muted playsinline` attributes (which iOS honors when muted),
//   - retries play() on the readiness events that actually indicate the
//     stream is playable (loadeddata / canplay / canplaythrough),
//   - retries when the tab becomes visible again or the element scrolls
//     into view,
//   - and only falls back to the poster image when the media element
//     itself errors out (network failure, bad codec, etc.), NEVER on a
//     transient play() promise rejection.
export default function VideoPlayer({
  src,
  poster,
  style,
}: {
  src: string
  poster?: string
  style?: React.CSSProperties
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Muted BEFORE any play() attempt. iOS treats defaultMuted as the
    // authoritative flag for autoplay eligibility.
    video.muted = true
    video.defaultMuted = true

    let cancelled = false
    const tryPlay = () => {
      if (cancelled || !video) return
      const p = video.play()
      if (p && typeof p.then === "function") {
        // Swallow benign rejections — a real, persistent failure surfaces
        // via the 'error' event listener below and flips setFailed.
        p.catch(() => { /* retry on the next readiness event */ })
      }
    }

    const onError = () => setFailed(true)

    video.addEventListener("loadeddata", tryPlay)
    video.addEventListener("canplay", tryPlay)
    video.addEventListener("canplaythrough", tryPlay)
    video.addEventListener("error", onError)

    // Kick things off — the native `autoplay` attribute handles most cases,
    // but this covers the edge where the video was already in a paused state
    // from a prior mount or SSR hydration.
    tryPlay()

    const onVisible = () => { if (document.visibilityState === "visible") tryPlay() }
    document.addEventListener("visibilitychange", onVisible)

    let observer: IntersectionObserver | null = null
    if (typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        (entries) => { entries.forEach((e) => { if (e.isIntersecting) tryPlay() }) },
        { threshold: 0.1 }
      )
      observer.observe(video)
    }

    return () => {
      cancelled = true
      video.removeEventListener("loadeddata", tryPlay)
      video.removeEventListener("canplay", tryPlay)
      video.removeEventListener("canplaythrough", tryPlay)
      video.removeEventListener("error", onError)
      document.removeEventListener("visibilitychange", onVisible)
      observer?.disconnect()
    }
  }, [src])

  if (failed && poster) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={poster} alt="" style={{ ...style, objectFit: "cover" }} />
  }

  return (
    <video
      ref={videoRef}
      src={src}
      autoPlay
      muted
      loop
      playsInline
      // Legacy iOS + WKWebView attribute. Not typed on React's VideoHTMLAttributes,
      // so cast to any locally — this is a real HTML attribute that iOS reads.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...({ "webkit-playsinline": "true" } as any)}
      preload="auto"
      poster={poster}
      controls={false}
      disablePictureInPicture
      style={{ ...style, pointerEvents: "none", cursor: "default", display: failed ? "none" : undefined }}
    />
  )
}
