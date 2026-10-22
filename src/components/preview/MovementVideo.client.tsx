"use client"

import { useEffect, useRef, useState } from "react"
import { onFirstGesture } from "./firstGesture"
import { useAutoplayStalled } from "./useAutoplayStalled"

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
//
// That same layer carries `animatedPoster` when the clip turns out not to be
// playing. Swapping the src is what keeps the animation off the wire in the
// normal case: it is only ever set once autoplay has actually failed, so a
// visitor whose video plays never requests it.
export default function MovementVideo({
  src,
  poster,
  animatedPoster,
  mounted,
  active,
  label,
  objectPosition = "center",
}: {
  src: string
  poster?: string
  animatedPoster?: string
  mounted: boolean
  active: boolean
  label: string
  objectPosition?: string
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [refused, setRefused] = useState(false)
  const stalled = useAutoplayStalled(videoRef, mounted && active, playing)

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
      if (p && typeof p.then === "function") {
        p.catch((err: unknown) => {
          const name = err && typeof err === "object" && "name" in err ? (err as { name: string }).name : ""
          // The one error that means the browser is refusing on policy
          // grounds. Low Power Mode reports it straight away, so the clip can
          // switch to its animation without waiting out the stall timers.
          if (name === "NotAllowedError") setRefused(true)
        })
      }
    }

    attempt()
    // If that was refused — Low Power Mode is the usual reason — start as
    // soon as the visitor touches the page rather than leaving the clip on
    // its still frame until they tap the clip itself.
    return onFirstGesture(attempt)
  }, [active, mounted])

  const stillSrc = !playing && (refused || stalled) && animatedPoster ? animatedPoster : poster

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
            onPlaying={() => {
              setPlaying(true)
              setRefused(false)
            }}
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
          {stillSrc && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={stillSrc}
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
