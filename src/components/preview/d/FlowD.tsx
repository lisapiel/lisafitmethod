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
  return (
    <div
      aria-hidden="true"
      style={{
        height: "clamp(80px, 9vw, 150px)",
        background: `linear-gradient(to bottom, ${from} 0%, ${to} 100%)`,
        display: "flex",
        alignItems: "center",
        padding: "0 var(--d-gutter)",
      }}
    >
      {rule && (
        <div style={{ width: "100%", maxWidth: "var(--d-max)", margin: "0 auto" }}>
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
