import Link from "next/link"
import { Reveal, RevealLines } from "../Reveal.client"
import { BUNDLE, PRICES } from "./productionCopy"

// The bundle, on the dark ground.
//
// This is the page's second cinematic moment and it earns the tone change:
// it is the offer the whole courses section has been building toward. Copy,
// prices, value tiles and the coaching upsell beneath are all the live
// section, word for word.
export function BundleC({ coursePrice }: { coursePrice: string }) {
  return (
    <section className="pv-c-bundle pv-c-dark pv-c-section" data-tone="dark" aria-label="Foundations Bundle">
      <style>{`
        .pv-c-bundle-glow {
          position: absolute; left: 50%; bottom: -46%; width: 1100px; height: 1100px; max-width: 170vw;
          transform: translateX(-50%); pointer-events: none;
          background: radial-gradient(circle, rgba(200,169,126,0.12) 0%, transparent 66%);
        }
        .pv-c-bundle-inner { position: relative; }
        .pv-c-bundle-badge-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: clamp(24px, 2.8vw, 36px); }
        .pv-c-bundle-badge {
          font-family: var(--font-dm-sans), sans-serif; font-size: 8.5px; font-weight: 600;
          letter-spacing: 0.16em; text-transform: uppercase; color: var(--c-black);
          background: var(--c-accent); padding: 4px 9px;
        }
        .pv-c-bundle-grid {
          display: grid; grid-template-columns: 1.25fr 0.75fr; gap: clamp(32px, 5vw, 80px);
          align-items: end;
        }
        .pv-c-bundle-h2 { max-width: 16ch; margin-bottom: clamp(18px, 2.2vw, 28px); }
        .pv-c-bundle-body { max-width: 60ch; margin-bottom: clamp(26px, 3vw, 38px); }
        .pv-c-bundle-tiles { display: flex; gap: 14px; flex-wrap: wrap; }
        .pv-c-bundle-tile {
          padding: 15px 22px; background: rgba(245,242,238,0.04);
          border-left: 2px solid rgba(200,169,126,0.45);
        }
        .pv-c-bundle-tile p {
          font-family: var(--font-dm-sans), sans-serif; margin: 0; font-size: 11.5px; line-height: 1.6;
        }
        .pv-c-bundle-tile p:first-child { font-weight: 600; color: var(--c-off-white); }
        .pv-c-bundle-tile p:last-child { color: rgba(245,242,238,0.38); }
        .pv-c-bundle-price { text-align: right; }
        .pv-c-bundle-price-row { display: flex; align-items: baseline; gap: 18px; justify-content: flex-end; flex-wrap: wrap; margin-bottom: 14px; }
        .pv-c-bundle-now {
          font-family: var(--font-playfair), serif; font-weight: 500;
          font-size: clamp(3rem, 5.4vw, 4.6rem); color: var(--c-accent); line-height: 0.88;
        }
        .pv-c-bundle-was {
          font-family: var(--font-dm-sans), sans-serif; font-size: 0.85rem;
          color: rgba(245,242,238,0.28); text-decoration: line-through;
        }
        .pv-c-bundle-saves {
          font-family: var(--font-dm-sans), sans-serif; font-size: 11px; letter-spacing: 0.1em;
          color: rgba(245,242,238,0.3); margin: 0 0 clamp(20px, 2.4vw, 28px);
        }
        .pv-c-bundle-note {
          font-family: var(--font-dm-sans), sans-serif; font-size: 11px;
          color: rgba(245,242,238,0.3); margin: 14px 0 0;
        }
        .pv-c-bundle-upsell {
          margin: clamp(40px, 5vw, 70px) 0 0; text-align: center;
          font-family: var(--font-dm-sans), sans-serif; font-size: 0.9rem;
          color: rgba(245,242,238,0.32);
        }
        .pv-c-bundle-upsell a {
          color: rgba(200,169,126,0.75); text-decoration: underline; text-underline-offset: 3px;
          transition: color 420ms ease;
        }
        .pv-c-bundle-upsell a:hover { color: var(--c-accent); }
        @media (max-width: 900px) {
          .pv-c-bundle-grid { grid-template-columns: 1fr; gap: 34px; align-items: start; }
          .pv-c-bundle-price { text-align: left; }
          .pv-c-bundle-price-row { justify-content: flex-start; }
        }
      `}</style>

      <div className="pv-c-bundle-glow" aria-hidden="true" />
      <div className="pv-c-inner pv-c-bundle-inner">
        <div className="pv-c-bundle-badge-row">
          <p className="pv-c-eyebrow">{BUNDLE.eyebrow}</p>
          <span className="pv-c-bundle-badge">{BUNDLE.badge}</span>
        </div>

        <div className="pv-c-bundle-grid">
          <div>
            <h2 className="pv-c-display pv-c-h2 pv-c-bundle-h2">
              <RevealLines lines={[BUNDLE.headingLine1, <i key="em">{BUNDLE.headingLine2}</i>]} stagger={120} />
            </h2>
            <Reveal variant="up" delay={140}>
              <p className="pv-c-body pv-c-bundle-body">{BUNDLE.body}</p>
              <div className="pv-c-bundle-tiles">
                <div className="pv-c-bundle-tile">
                  <p>{BUNDLE.tileTrainingLabel}</p>
                  <p>
                    ${coursePrice}
                    {BUNDLE.tileTrainingValueSuffix}
                  </p>
                </div>
                <div className="pv-c-bundle-tile">
                  <p>{BUNDLE.tileNutritionLabel}</p>
                  <p>{BUNDLE.tileNutritionValue}</p>
                </div>
              </div>
            </Reveal>
          </div>

          <Reveal variant="up" delay={240} className="pv-c-bundle-price">
            <div className="pv-c-bundle-price-row">
              <span className="pv-c-bundle-was">{PRICES.bundleTotal}</span>
              <span className="pv-c-bundle-now">{PRICES.bundleNow}</span>
            </div>
            <p className="pv-c-bundle-saves">{BUNDLE.savings}</p>
            <Link href={BUNDLE.href} className="pv-c-btn pv-c-btn--gold">
              <span>{BUNDLE.cta}</span>
            </Link>
            <p className="pv-c-bundle-note">{BUNDLE.note}</p>
          </Reveal>
        </div>

        <p className="pv-c-bundle-upsell">
          {BUNDLE.upsellLead}{" "}
          <Link href="/coaching">{BUNDLE.upsellLink}</Link>
        </p>
      </div>
    </section>
  )
}
