"use client"

import { useRef, useEffect, useState } from "react"

interface VideoEmbedProps {
  videoId: string
  title: string
  s3Url?: string
}

export default function VideoEmbed({ videoId, title, s3Url }: VideoEmbedProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [controlsVisible, setControlsVisible] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !s3Url) return

    // iOS Safari ignores the muted attribute on the element — must be set imperatively
    video.muted = true

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          video.play().catch(() => {})
        } else {
          video.pause()
        }
      },
      { threshold: 0.3 }
    )

    observer.observe(video)
    return () => observer.disconnect()
  }, [s3Url])

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "16/9",
        background: "#000",
        margin: "1.5rem 0",
        overflow: "hidden",
      }}
    >
      {s3Url ? (
        <>
          <video
            ref={videoRef}
            src={s3Url}
            title={title}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            controls={controlsVisible}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              background: "#0a0a0a",
            }}
          />
          {/* Transparent overlay — captures the first tap/click to reveal controls */}
          {!controlsVisible && (
            <div
              onClick={() => setControlsVisible(true)}
              style={{ position: "absolute", inset: 0, cursor: "pointer", zIndex: 1 }}
            />
          )}
        </>
      ) : (
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
          title={title}
          allowFullScreen
          loading="lazy"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
        />
      )}
    </div>
  )
}
