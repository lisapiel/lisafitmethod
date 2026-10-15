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
}) {
  const reduced = usePrefersReducedMotion()
  const { ref, progress } = useScrollProgress<HTMLDivElement>()

  // Centre the drift on the element's midpoint so the composition is framed
  // as authored when it sits in the middle of the viewport.
  const offset = reduced ? 0 : (progress - 0.5) * shift

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
          top: "-9%",
          height: "118%",
          transform: `translate3d(0, ${offset}%, 0)`,
          willChange: "transform",
        }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          style={{ objectFit: "cover", objectPosition }}
        />
      </div>
    </div>
  )
}
