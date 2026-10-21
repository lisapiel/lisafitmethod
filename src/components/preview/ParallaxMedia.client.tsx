"use client"

import Image from "next/image"
import { useScrollProgress } from "./useScrollProgress.client"
import { usePrefersReducedMotion } from "./Reveal.client"

// A photograph that drifts inside a fixed frame as the page scrolls, and
// settles into a slow zoom on hover.
//
// The image is deliberately oversized relative to its frame (height 118%)
// so the drift never exposes an edge. `shift` is the total travel in
// percentage points of the frame height.
export function ParallaxMedia({
  src,
  alt,
  objectPosition = "center 20%",
  shift = 10,
  aspect = "3 / 4",
  frameStyle,
  hoverZoom = true,
  priority = false,
  sizes = "(max-width: 900px) 100vw, 50vw",
  unoptimized,
}: {
  src: string
  alt: string
  objectPosition?: string
  shift?: number
  aspect?: string
  frameStyle?: React.CSSProperties
  hoverZoom?: boolean
  priority?: boolean
  sizes?: string
  // Opt a single image out of the image optimizer. Optional and undefined by
  // default, so every existing caller renders exactly as before.
  unoptimized?: boolean
}) {
  const reduced = usePrefersReducedMotion()
  const { ref, progress } = useScrollProgress<HTMLDivElement>()

  // Centre the drift on the element's midpoint so the composition is framed
  // as authored when it sits in the middle of the viewport.
  const offset = reduced ? 0 : (progress - 0.5) * shift

  // The overscan exists only to give the drift somewhere to travel. With no
  // drift it must be zero: an oversized layer makes `cover` fill a taller box
  // than the frame, which silently crops a wide image horizontally — the way
  // a 3:1 banner loses its wordmark on a phone.
  const bleed = shift === 0 ? 0 : 9

  return (
    <div
      ref={ref}
      className={hoverZoom ? "pv-parallax-frame" : undefined}
      style={{
        position: "relative",
        overflow: "hidden",
        aspectRatio: aspect,
        background: "#0a0a0a",
        ...frameStyle,
      }}
    >
      <div
        className="pv-parallax-inner"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: `-${bleed}%`,
          height: `${100 + bleed * 2}%`,
          transform: `translate3d(0, ${offset}%, 0)`,
          willChange: bleed ? "transform" : "auto",
        }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          unoptimized={unoptimized}
          style={{ objectFit: "cover", objectPosition }}
        />
      </div>
    </div>
  )
}
