import { DrawRule } from "../Reveal.client"

// The seam between a light and a dark section.
//
// An abrupt colour change is what makes an alternating page look like two
// themes stitched together. This is a deliberate band: the ground gradients
// from one tone to the other over a generous distance, and a hairline draws
// itself across the midpoint as the reader arrives — so the change of tone
// reads as a chapter break that was designed, not a join that was tolerated.
export function ToneShift({
  from,
  to,
  rule = true,
}: {
  from: string
  to: string
  rule?: boolean
}) {
  return (
    <div
      aria-hidden="true"
      style={{
        height: "clamp(72px, 9vw, 150px)",
        background: `linear-gradient(to bottom, ${from} 0%, ${to} 100%)`,
        position: "relative",
        display: "flex",
        alignItems: "center",
        padding: "0 var(--c-gutter)",
      }}
    >
      {rule && (
        <div style={{ width: "100%", maxWidth: 1180, margin: "0 auto" }}>
          <DrawRule color="rgba(200,169,126,0.3)" origin="center" duration={1600} />
        </div>
      )}
    </div>
  )
}
