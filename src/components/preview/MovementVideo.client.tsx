"use client"

import { useEffect, useRef, useState } from "react"
import { onFirstGesture } from "./firstGesture"

// One movement clip from the Training Foundations library.
//
// Mounting is caller-controlled via `mounted` so a showcase of eight
// movements never puts eight simultaneous video loads on the wire — the
// parent mounts a clip when it is actually about to be seen, and plays it
// when `active` goes true.
//
// The still frame is a sibling <img>, NOT the video's `poster` attribute.
// WebKit draws its own play-button overlay on a paused inline video that has
// a poster, so using the attribute put an iOS play button on every clip. A
// layer above the video that fades out once playback starts shows the same
// frame with none of that, and is the treatment the hero already uses.
export default function MovementVideo({
  src,
  poster,
  mounted,
  active,
  label,
  objectPosition = "center",
}: {
  src: string
  poster?: string
  mounted: boolean
  active: boolean
  label: string
  objectPosition?: string
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const v = videoRef.current
    if (!v) return

    v.muted = true
    v.defaultMuted = true

    if (!active) {
      v.pause()
      return
    }

    const attempt = () => {
      const el = videoRef.current
      if (!el || !el.paused) return
      const p = el.play()
      if (p && typeof p.then === "function") p.catch(() => {})
    }

    attempt()
    // If that was refused — Low Power Mode is the usual reason — start as
    // soon as the visitor touches the page rather than leaving the clip on
    // its still frame until they tap the clip itself.
    return onFirstGesture(attempt)
  }, [active, mounted])

  return (
    <>
      {mounted && (
        <>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            ref={videoRef}
            src={src}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            controls={false}
            disablePictureInPicture
            aria-label={`${label} demonstration`}
            onPlaying={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition,
              transform: active ? "scale(1)" : "scale(1.04)",
              transition: "transform 1200ms cubic-bezier(0.16, 1, 0.3, 1)",
              pointerEvents: "none",
            }}
          />
          {poster && (
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
                objectPosition,
                opacity: playing ? 0 : 1,
                transition: "opacity 520ms ease",
                pointerEvents: "none",
              }}
            />
          )}
        </>
      )}
    </>
  )
}
