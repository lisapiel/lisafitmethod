import { Reveal, RevealLines, DrawRule } from "../Reveal.client"
import { Atmosphere } from "./FlowD"

// The opening of an inner page: a dark band carrying the page's own eyebrow,
// headline and standfirst over a muted photograph. Shorter than the
// homepage's film hero, because an inner page should get the reader to its
// content quickly rather than hold them at the door.
export function PageHeroD({
  eyebrow,
  headingLines,
  lede,
  backdrop,
  children,
}: {
  eyebrow: string
  headingLines: React.ReactNode[]
  lede?: string
  backdrop?: string
  children?: React.ReactNode
}) {
  return (
    <header className="pv-d-phero pv-d-dark" data-tone="dark">
      <style>{`
        .pv-d-phero {
          position: relative; overflow: hidden;
          padding: clamp(136px, 17vh, 210px) var(--d-gutter) clamp(68px, 8vw, 118px);
        }
        .pv-d-phero-inner { position: relative; z-index: 2; max-width: var(--d-max); margin: 0 auto; }
        .pv-d-phero-h1 {
          font-size: clamp(2.2rem, 5vw, 4.2rem); max-width: 20ch;
          margin: 0 0 var(--d-step-3);
        }
        .pv-d-phero-lede {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
          font-size: clamp(0.98rem, 1.18vw, 1.12rem); line-height: 1.78;
          color: rgba(245,242,238,0.68); margin: 0; max-width: 62ch;
        }
      `}</style>

      {backdrop && <Atmosphere src={backdrop} tone="dark" opacity={0.34} position="center 45%" scrim="left" />}

      <div className="pv-d-phero-inner pv-d-above">
        <p className="pv-d-eyebrow">{eyebrow}</p>
        <div className="pv-d-open-rule">
          <DrawRule color="rgba(200,169,126,0.5)" />
        </div>
        <h1 className="pv-d-display pv-d-phero-h1">
          <RevealLines lines={headingLines} stagger={120} />
        </h1>
        {lede && (
          <Reveal variant="up" delay={180}>
            <p className="pv-d-phero-lede">{lede}</p>
          </Reveal>
        )}
        {children}
      </div>
    </header>
  )
}
