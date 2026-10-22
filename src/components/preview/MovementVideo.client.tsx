"use client"

import { useEffect, useRef } from "react"

// One movement clip from the Training Foundations library.
//
// Mounting is caller-controlled via `mounted` so a showcase of eight
// movements never puts eight simultaneous video loads on the wire — the
// parent mounts a clip when it is actually about to be seen, and plays it
// when `active` goes true. Until then the frame is a composed dark card,
// which is also the resting state of the design rather than a placeholder.
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

  useEffect(() => {
    const v = videoRef.current
    if (!v) return

    v.muted = true
    v.defaultMuted = true

    if (active) {
      const p = v.play()
      if (p && typeof p.then === "function") {
        // A rejected play here is not an error worth surfacing: the frame
        // simply stays on its dark composed state.
        p.catch(() => {})
      }
    } else {
      v.pause()
    }
  }, [active, mounted])

  return (
    <>
      {mounted && (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <video
          ref={videoRef}
          src={src}
          // Without a poster there is nothing to paint until a frame has been
          // decoded, so a clip that cannot autoplay leaves the plate's dark
          // ground showing — the black rectangles on iOS, where Safari limits
          // how many videos it will decode at once.
          poster={poster}
          muted
          loop
          playsInline
          preload="metadata"
          controls={false}
          disablePictureInPicture
          aria-label={`${label} demonstration`}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition,
            // Always opaque. This was gated on a canplay that never fires if
            // the browser declines to decode the clip, which left the element
            // permanently invisible on top of the dark plate. The poster is
            // what covers the load window now.
            opacity: 1,
            transform: active ? "scale(1)" : "scale(1.04)",
            transition: "transform 1200ms cubic-bezier(0.16, 1, 0.3, 1)",
            pointerEvents: "none",
          }}
        />
      )}
    </>
  )
}
