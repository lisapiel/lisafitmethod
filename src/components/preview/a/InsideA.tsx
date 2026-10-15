import { RevealLines } from "../Reveal.client"
import MovementIndexA from "../MovementIndexA.client"
import { MOVEMENT_SHOWCASE } from "../previewContent"

// DIRECTION A — "Inside the course".
//
// The product demonstration. Rather than listing what the course contains,
// the section hands over the actual movement library and lets the reader
// scrub through it.
export function InsideA({ videoUrls }: { videoUrls: Record<string, string> }) {
  return (
    <section className="pv-a-inside" id="inside">
      <style>{`
        .pv-a-inside { background: #f7f4ef; padding: clamp(72px, 9vw, 140px) clamp(20px, 5vw, 72px); border-top: 1px solid rgba(18,17,16,0.1); }
        .pv-a-inside-head { display: grid; grid-template-columns: 180px 1fr; gap: clamp(24px, 4vw, 64px); align-items: start; margin-bottom: clamp(38px, 4.4vw, 64px); }
        .pv-a-inside-h2 {
          font-family: var(--font-playfair), serif; font-size: clamp(1.9rem, 4vw, 3.6rem);
          font-weight: 500; line-height: 1.04; color: #121110; margin: 0; max-width: 24ch;
        }
        .pv-a-inside-h2 i { font-style: italic; color: #a8895e; }
        .pv-a-inside-lede {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
          font-size: clamp(0.9rem, 1.05vw, 1.02rem); line-height: 1.8;
          color: rgba(18,17,16,0.58); max-width: 54ch; margin: 18px 0 0;
        }
        @media (max-width: 900px) {
          .pv-a-inside-head { grid-template-columns: 1fr; gap: 16px; align-items: start; }
        }
      `}</style>

      <div className="pv-a-inside-head">
        <p className="pv-a-runhead">
          02 — Inside
          <span>The movement library</span>
        </p>
        <div>
          <h2 className="pv-a-inside-h2">
            <RevealLines lines={["The movements", <i key="i">every strong body is built on.</i>]} stagger={110} />
          </h2>
          <p className="pv-a-inside-lede">
            This is the actual footage from inside Training Foundations &mdash; filmed from the angles that show what
            a joint is doing, not the angles that look good. Run your cursor down the index.
          </p>
        </div>
      </div>

      <MovementIndexA movements={MOVEMENT_SHOWCASE} urls={videoUrls} />
    </section>
  )
}
