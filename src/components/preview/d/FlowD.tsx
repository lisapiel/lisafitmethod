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
// Height is capped rather than purely proportional so that on a very wide
// display the band does not become a thin letterbox strip that slices the
// subject in half.
export function PhotoBand({
  src,
  alt,
  objectPosition,
  tone = "light",
}: {
  src: string
  alt: string
  objectPosition: string
  tone?: "light" | "dark"
}) {
  return (
    <section className={tone === "dark" ? "pv-d-dark" : "pv-d-light"} data-tone={tone}>
      <style>{`
        .pv-d-band { height: clamp(300px, 46vh, 520px); }
        @media (max-width: 768px) { .pv-d-band { height: 72vw; } }
      `}</style>
      <div className="pv-d-band">
        <ParallaxMedia
          src={src}
          alt={alt}
          objectPosition={objectPosition}
          aspect="auto"
          shift={13}
          hoverZoom={false}
          frameStyle={{ aspectRatio: "auto", height: "100%" }}
          sizes="100vw"
        />
      </div>
    </section>
  )
}
