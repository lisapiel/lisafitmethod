import Image from "next/image"
import { ParallaxMedia } from "../ParallaxMedia.client"
import { DrawRule } from "../Reveal.client"

// The seam between two grounds.
//
// A tone change that happens on a hard edge reads as two pages stapled
// together. Here the ground gradients across a generous band and a hairline
// draws itself through the middle as the reader arrives, so the change is
// paced rather than abrupt. One component, used at every tone change on the
// page, which is also what keeps the rhythm even.
export function ToneShift({ from, to, rule = true }: { from: string; to: string; rule?: boolean }) {
  // The band is split into two tone halves. Without them the navigation has
  // nothing to sample while it crosses a transition, so it holds whichever
  // styling it had last and can sit cream-on-light — or ink-on-dark — for the
  // length of the band. Halving it flips the bar at the gradient's midpoint,
  // which is where the ground actually changes hands.
  const isDark = (colour: string) => colour.trim().toLowerCase() === "#0a0a0a"
  const half = (colour: string) => (isDark(colour) ? "dark" : "light")

  return (
    <div
      aria-hidden="true"
      style={{
        position: "relative",
        height: "clamp(80px, 9vw, 150px)",
        background: `linear-gradient(to bottom, ${from} 0%, ${to} 100%)`,
        display: "flex",
        alignItems: "center",
        padding: "0 var(--d-gutter)",
      }}
    >
      <div data-tone={half(from)} style={{ position: "absolute", top: 0, left: 0, right: 0, height: "50%" }} />
      <div data-tone={half(to)} style={{ position: "absolute", top: "50%", left: 0, right: 0, height: "50%" }} />
      {rule && (
        <div style={{ position: "relative", width: "100%", maxWidth: "var(--d-max)", margin: "0 auto" }}>
          <DrawRule color="rgba(200,169,126,0.32)" origin="center" duration={1600} />
        </div>
      )}
    </div>
  )
}

// A full-bleed photograph that drifts against the scroll.
//
// Two modes, because the two photographs on this page have opposite needs.
// Without `aspect` the band is a fixed slice — right for a tall image you
// only want a window onto. With `aspect` the band keeps the image's own
// proportions down to the smallest screen, which is what a wide banner
// needs: forced into a fixed-height band on a phone it would be cropped to
// under half its width and lose the wordmark. A max height still stops it
// becoming a billboard on an ultrawide display.
export function PhotoBand({
  src,
  alt,
  objectPosition,
  tone = "light",
  aspect,
}: {
  src: string
  alt: string
  objectPosition: string
  tone?: "light" | "dark"
  aspect?: string
}) {
  return (
    <section className={tone === "dark" ? "pv-d-dark" : "pv-d-light"} data-tone={tone}>
      <style>{`
        .pv-d-band { height: clamp(300px, 46vh, 520px); }
        .pv-d-band--aspect { height: auto; max-height: clamp(320px, 46vh, 560px); }
        @media (max-width: 768px) {
          .pv-d-band { height: 72vw; }
          .pv-d-band--aspect { height: auto; max-height: none; }
        }
      `}</style>
      <div
        className={aspect ? "pv-d-band pv-d-band--aspect" : "pv-d-band"}
        style={aspect ? { aspectRatio: aspect } : undefined}
      >
        <ParallaxMedia
          src={src}
          alt={alt}
          objectPosition={objectPosition}
          aspect="auto"
          shift={aspect ? 0 : 13}
          hoverZoom={false}
          frameStyle={{ aspectRatio: "auto", height: "100%" }}
          sizes="100vw"
        />
      </div>
    </section>
  )
}

// A supporting photograph set behind a section.
//
// The earlier version laid a flat wash over the whole image, which protects
// text everywhere and therefore also erases the photograph everywhere. This
// version shapes the protection instead: the scrim is dense where the words
// sit and clears toward the edges, so the equipment, the travertine and the
// light stay legible while the type keeps its contrast. Lisa's own
// photographs are still the subject; this is the room they sit in.
export function Atmosphere({
  src,
  tone,
  opacity,
  position = "center",
  scrim = "center",
}: {
  src: string
  tone: "light" | "dark"
  opacity?: number
  position?: string
  scrim?: "center" | "left" | "right" | "flat" | "edges"
}) {
  const strength = opacity ?? (tone === "dark" ? 0.4 : 0.55)
  const ground = tone === "dark" ? "10,10,10" : "250,248,245"

  // Each shape keeps roughly 80% ground behind the copy and falls away to
  // around 25% where there is nothing to read.
  const scrims: Record<string, string> = {
    center: `radial-gradient(ellipse 78% 72% at 50% 50%, rgba(${ground},0.9) 0%, rgba(${ground},0.82) 45%, rgba(${ground},0.42) 78%, rgba(${ground},0.26) 100%)`,
    left: `linear-gradient(to right, rgba(${ground},0.93) 0%, rgba(${ground},0.86) 42%, rgba(${ground},0.5) 72%, rgba(${ground},0.24) 100%)`,
    right: `linear-gradient(to left, rgba(${ground},0.93) 0%, rgba(${ground},0.88) 48%, rgba(${ground},0.54) 76%, rgba(${ground},0.28) 100%)`,
    edges: `linear-gradient(to bottom, rgba(${ground},0.92) 0%, rgba(${ground},0.66) 26%, rgba(${ground},0.66) 74%, rgba(${ground},0.92) 100%)`,
    flat: `linear-gradient(to bottom, rgba(${ground},0.86), rgba(${ground},0.86))`,
  }

  return (
    <div aria-hidden="true" style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      <Image
        src={src}
        alt=""
        fill
        sizes="100vw"
        style={{ objectFit: "cover", objectPosition: position, opacity: strength }}
      />
      <div style={{ position: "absolute", inset: 0, background: scrims[scrim] }} />
    </div>
  )
}
