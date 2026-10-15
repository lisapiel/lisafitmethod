import { Reveal, RevealLines } from "../Reveal.client"
import MovementRailB from "../MovementRailB.client"
import { MOVEMENT_SHOWCASE } from "../previewContent"

// DIRECTION B — the reel.
//
// Product demonstration as a film rail. The header is set in the page
// gutter, but the rail itself runs to the right edge of the screen and keeps
// going, which is the signal that there is more of the library than fits.
export function ReelB({ videoUrls }: { videoUrls: Record<string, string> }) {
  return (
    <section className="pv-b-reel" id="inside">
      <style>{`
        .pv-b-reel { background: #08080a; padding: clamp(76px, 10vw, 150px) 0; border-top: 1px solid rgba(201,169,110,0.12); }
        .pv-b-reel-head { padding: 0 clamp(20px, 6vw, 96px); margin-bottom: clamp(40px, 5vw, 76px); display: grid; grid-template-columns: 1fr 0.8fr; gap: clamp(28px, 5vw, 80px); align-items: end; }
        .pv-b-reel-h2 { font-size: clamp(1.9rem, 4.6vw, 4rem); max-width: 20ch; margin-top: clamp(18px, 2.2vw, 30px); }
        .pv-b-reel-lede { max-width: 48ch; }
        @media (max-width: 900px) {
          .pv-b-reel-head { grid-template-columns: 1fr; align-items: start; gap: 20px; }
        }
      `}</style>

      <div className="pv-b-reel-head">
        <div>
          <p className="pv-b-label">02 &#8212; Inside the course</p>
          <h2 className="pv-b-display pv-b-reel-h2">
            <RevealLines lines={["The movement", <i key="i">library.</i>]} stagger={130} />
          </h2>
        </div>
        <Reveal variant="up" delay={180}>
          <p className="pv-b-body pv-b-reel-lede">
            Real footage from inside Training Foundations &mdash; filmed from the angles that show what a joint is
            actually doing. Fifty more clips sit behind these eight.
          </p>
        </Reveal>
      </div>

      <MovementRailB movements={MOVEMENT_SHOWCASE} urls={videoUrls} />
    </section>
  )
}
