"use client"
import { useState, useRef, useEffect } from "react"

export default function VideoPlayer({
  src,
  style,
}: {
  src: string
  style?: React.CSSProperties
}) {
  const [controls, setControls] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    // iOS Safari ignores the autoplay attribute on page load — must call play() programmatically
    video.play().catch(() => {
      // Autoplay blocked by browser; video will start on first user interaction
    })
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
      controls={controls}
      onClick={() => setControls(c => !c)}
      style={{ ...style, cursor: "pointer" }}
    />
  )
}
