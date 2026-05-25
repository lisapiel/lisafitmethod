"use client"
import { useRef, useEffect } from "react"

export default function VideoPlayer({
  src,
  style,
}: {
  src: string
  style?: React.CSSProperties
}) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    // React doesn't reliably apply muted to the DOM node on iOS Safari —
    // setting it directly is required for autoplay to be permitted.
    video.muted = true
    video.play().catch(() => {})
  }, [])

  return (
    <video
      ref={videoRef}
      src={src}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      style={{ ...style, pointerEvents: "none", cursor: "default" }}
    />
  )
}
