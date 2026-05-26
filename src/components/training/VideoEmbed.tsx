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
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !s3Url) return

    const tryPlay = () => {
      video.muted = true
      video.play().catch(() => {})
    }

    // Tier 1: Preload observer — start loading when within 400px of viewport
    const preloadObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          video.preload = "auto"
          video.load()
          video.addEventListener("canplay", tryPlay, { once: true })
          preloadObserver.disconnect()
        }
      },
      { rootMargin: "400px 0px", threshold: 0 }
    )

    // Tier 2: Play/pause observer — play when visible, pause when fully out of view
    const playObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry.isIntersecting) {
          tryPlay()
        } else if (entry.intersectionRatio === 0) {
          video.pause()
        }
      },
      { threshold: [0, 0.1] }
    )

    preloadObserver.observe(video)
    playObserver.observe(video)

    return () => {
      preloadObserver.disconnect()
      playObserver.disconnect()
      video.removeEventListener("canplay", tryPlay)
    }
  }, [s3Url])

  return (
    <div style={{ margin: "1.5rem 0", background: "#000", overflow: "hidden", position: "relative" }}>
      {s3Url ? (
        <>
          <div style={{ position: "relative", background: "#0a0a0a", minHeight: ready ? undefined : 120 }}>
            <video
              ref={videoRef}
              src={s3Url}
              title={title}
              muted
              loop
              playsInline
              preload="none"
              controls={controlsVisible}
              onLoadedData={() => setReady(true)}
              style={{
                width: "100%",
                height: "auto",
                display: "block",
                opacity: ready ? 1 : 0,
                transition: "opacity 0.3s ease",
              }}
            />
            {!ready && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    border: "2px solid rgba(201,169,110,0.2)",
                    borderTopColor: "#c9a96e",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            )}
          </div>
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
