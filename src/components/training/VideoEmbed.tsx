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

    const tryPlay = () => {
      video.muted = true
      video.play().catch(() => {})
    }

    // Attempt immediately and again once media data is ready
    tryPlay()
    video.addEventListener("canplay", tryPlay, { once: true })

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry.isIntersecting) {
          tryPlay()
        } else if (entry.intersectionRatio === 0) {
          // Only pause when fully out of view — prevents layout shifts
          // (e.g. QuickFormTips expanding) from pausing nearby videos
          video.pause()
        }
      },
      { threshold: [0, 0.1] }
    )

    observer.observe(video)
    return () => {
      observer.disconnect()
      video.removeEventListener("canplay", tryPlay)
    }
  }, [s3Url])

  return (
    <div style={{ margin: "1.5rem 0", background: "#000", overflow: "hidden", position: "relative" }}>
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
            preload="auto"
            controls={controlsVisible}
            style={{
              width: "100%",
              height: "auto",
              display: "block",
              background: "#0a0a0a",
            }}
          />
          {/* Transparent overlay — first tap reveals native controls */}
          {!controlsVisible && (
            <div
              onClick={() => setControlsVisible(true)}
              style={{ position: "absolute", inset: 0, cursor: "pointer", zIndex: 1 }}
            />
          )}
        </>
      ) : (
        <div style={{ position: "relative", aspectRatio: "16/9" }}>
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=1&mute=1&playsinline=1`}
            title={title}
            allowFullScreen
            loading="lazy"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
          />
        </div>
      )}
    </div>
  )
}
