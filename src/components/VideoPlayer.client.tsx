"use client"
import { useRef, useEffect, useState } from "react"

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

    video.muted = true
    video.defaultMuted = true

    const attemptPlay = () => {
      video.play().catch(() => { setFailed(true) })
    }

    attemptPlay()
    video.addEventListener("loadeddata", attemptPlay)
    video.addEventListener("canplay", attemptPlay)

    const onVisible = () => { if (document.visibilityState === "visible") attemptPlay() }
    document.addEventListener("visibilitychange", onVisible)

    let observer: IntersectionObserver | null = null
    if (typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        (entries) => { entries.forEach((e) => { if (e.isIntersecting) attemptPlay() }) },
        { threshold: 0.1 }
      )
      observer.observe(video)
    }

    return () => {
      video.removeEventListener("loadeddata", attemptPlay)
      video.removeEventListener("canplay", attemptPlay)
      document.removeEventListener("visibilitychange", onVisible)
      observer?.disconnect()
    }
  }, [src])

  if (failed && poster) {
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
      preload="auto"
      poster={poster}
      style={{ ...style, pointerEvents: "none", cursor: "default", display: failed ? "none" : undefined }}
    />
  )
}
