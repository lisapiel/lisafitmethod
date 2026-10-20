import Link from "next/link"
import { Reveal, RevealLines, DrawRule } from "../Reveal.client"
import { BUNDLE, PRICES } from "../c/productionCopy"

// The bundle — the page's mid-point dark moment.
//
// The two value lines are rendered with the page's shared figure treatment,
// the same one the testimonial results use later, so numbers never look like
// a different component dropped in. Copy is the live section verbatim.
export function BundleD({ coursePrice }: { coursePrice: string }) {
  return (
    <section className="pv-d-bundle pv-d-dark pv-d-section" data-tone="dark" aria-label="Foundations Bundle">
      <style>{`
        .pv-d-bundle-glow {
          position: absolute; left: 50%; bottom: -44%; width: 1100px; height: 1100px; max-width: 170vw;
          transform: translateX(-50%); pointer-events: none;
          background: radial-gradient(circle, rgba(200,169,126,0.13) 0%, transparent 66%);
        }
        .pv-d-bundle-inner { position: relative; }
        .pv-d-bundle-badges { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
        .pv-d-bundle-badge {
          font-family: var(--font-dm-sans), sans-serif; font-size: 8.5px; font-weight: 600;
          letter-spacing: 0.16em; text-transform: uppercase; color: var(--d-black);
          background: var(--d-accent); padding: 4px 9px;
        }
        .pv-d-bundle-grid {
          display: grid; grid-template-columns: minmax(0, 1.22fr) minmax(0, 0.78fr);
          gap: clamp(32px, 5vw, 80px); align-items: end;
        }
        .pv-d-bundle-body { max-width: 60ch; margin-bottom: var(--d-step-4); }
        .pv-d-bundle-figures { grid-template-columns: 1fr 1fr; max-width: 440px; }
        .pv-d-bundle-price { text-align: right; }
        .pv-d-bundle-price-row { display: flex; align-items: baseline; gap: 18px; justify-content: flex-end; flex-wrap: wrap; margin-bottom: var(--d-step-2); }
        .pv-d-bundle-now {
          font-family: var(--font-playfair), serif; font-weight: 500;
          font-size: clamp(3rem, 5.2vw, 4.4rem); color: var(--d-accent); line-height: 0.88;
        }
        .pv-d-bundle-was {
          font-family: var(--font-dm-sans), sans-serif; font-size: 0.85rem;
          color: rgba(245,242,238,0.3); text-decoration: line-through;
        }
        .pv-d-bundle-saves {
          font-family: var(--font-dm-sans), sans-serif; font-size: 11px; letter-spacing: 0.1em;
          color: rgba(245,242,238,0.34); margin: 0 0 var(--d-step-3);
        }
        .pv-d-bundle-note {
          font-family: var(--font-dm-sans), sans-serif; font-size: 11px;
          color: rgba(245,242,238,0.32); margin: var(--d-step-2) 0 0;
        }
        .pv-d-bundle-upsell {
          margin: var(--d-step-5) 0 0; text-align: center;
          font-family: var(--font-dm-sans), sans-serif; font-size: 0.9rem;
          color: rgba(245,242,238,0.34);
        }
        .pv-d-bundle-upsell a {
          color: rgba(200,169,126,0.78); text-decoration: underline; text-underline-offset: 3px;
          transition: color 420ms ease;
        }
        .pv-d-bundle-upsell a:hover { color: var(--d-accent); }
        @media (max-width: 480px) {
          .pv-d-bundle-figures { grid-template-columns: 1fr; }
          .pv-d-bundle-figures .pv-d-figure + .pv-d-figure {
            border-left: none; padding-left: 0;
            border-top: 1px solid var(--d-rule-dark); padding-top: var(--d-step-3);
          }
        }
        @media (max-width: 900px) {
          .pv-d-bundle-grid { grid-template-columns: 1fr; gap: var(--d-step-5); align-items: start; }
          .pv-d-bundle-price { text-align: left; }
          .pv-d-bundle-price-row { justify-content: flex-start; }
          .pv-d-bundle-figures { max-width: none; }
        }
      `}</style>

      <div className="pv-d-bundle-glow" aria-hidden="true" />
      <div className="pv-d-inner pv-d-bundle-inner">
        <div className="pv-d-open">
          <div className="pv-d-bundle-badges">
            <p className="pv-d-eyebrow">{BUNDLE.eyebrow}</p>
            <span className="pv-d-bundle-badge">{BUNDLE.badge}</span>
          </div>
          <div className="pv-d-open-rule">
            <DrawRule color="rgba(200,169,126,0.5)" />
          </div>
          <h2 className="pv-d-display pv-d-h2" style={{ maxWidth: "16ch" }}>
            <RevealLines lines={[BUNDLE.headingLine1, <i key="em">{BUNDLE.headingLine2}</i>]} stagger={120} />
          </h2>
        </div>

        <div className="pv-d-bundle-grid">
          <div>
            <Reveal variant="up" delay={120}>
              <p className="pv-d-body pv-d-bundle-body">{BUNDLE.body}</p>
            </Reveal>
            <Reveal variant="up" delay={200} className="pv-d-figures pv-d-bundle-figures">
              <div className="pv-d-figure">
                <span className="pv-d-figure-value">
                  ${coursePrice}
                  {BUNDLE.tileTrainingValueSuffix}
                </span>
                <span className="pv-d-figure-label">{BUNDLE.tileTrainingLabel}</span>
              </div>
              <div className="pv-d-figure">
                <span className="pv-d-figure-value">{BUNDLE.tileNutritionValue}</span>
                <span className="pv-d-figure-label">{BUNDLE.tileNutritionLabel}</span>
              </div>
            </Reveal>
          </div>

          <Reveal variant="up" delay={260} className="pv-d-bundle-price">
            <div className="pv-d-bundle-price-row">
              <span className="pv-d-bundle-was">{PRICES.bundleTotal}</span>
              <span className="pv-d-bundle-now">{PRICES.bundleNow}</span>
            </div>
            <p className="pv-d-bundle-saves">{BUNDLE.savings}</p>
            <Link href={BUNDLE.href} className="pv-d-btn pv-d-btn--gold">
              <span>{BUNDLE.cta}</span>
            </Link>
            <p className="pv-d-bundle-note">{BUNDLE.note}</p>
          </Reveal>
        </div>

        <p className="pv-d-bundle-upsell">
          {BUNDLE.upsellLead} <Link href="/coaching">{BUNDLE.upsellLink}</Link>
        </p>
      </div>
    </section>
  )
}
