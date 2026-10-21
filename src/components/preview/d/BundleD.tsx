import Link from "next/link"
import { ParallaxMedia } from "../ParallaxMedia.client"
import { Reveal, RevealLines, DrawRule } from "../Reveal.client"
import { Atmosphere } from "./FlowD"
import { BUNDLE, PRICES } from "../c/productionCopy"

// The bundle — the page's mid-point dark moment.
//
// The two value lines are rendered with the page's shared figure treatment,
// the same one the testimonial results use later, so numbers never look like
// a different component dropped in. Copy is the live section verbatim.
export function BundleD({
  coursePrice,
  portraitUrl,
  backdrop,
}: {
  coursePrice: string
  portraitUrl?: string
  backdrop?: string
}) {
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
          display: grid; grid-template-columns: minmax(0, 1.08fr) minmax(0, 0.62fr);
          gap: clamp(32px, 5vw, 76px); align-items: center;
        }
        .pv-d-bundle-portrait { position: relative; }
        .pv-d-bundle-portrait::after {
          content: ""; position: absolute; top: -18px; right: -18px; bottom: 18px; left: 18px;
          border: 1px solid rgba(200,169,126,0.28); pointer-events: none;
        }
        .pv-d-bundle-buy { margin-top: var(--d-step-4); }
        .pv-d-bundle-body { max-width: 60ch; margin-bottom: var(--d-step-4); }
        .pv-d-bundle-figures { grid-template-columns: 1fr 1fr; max-width: 440px; }
        .pv-d-bundle-price-row { display: flex; align-items: baseline; gap: 18px; flex-wrap: wrap; margin-bottom: var(--d-step-2); }
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
          /* The two course values stay side by side on a phone, with the
             bundle price underneath them. Stacking them left the right half
             of the panel empty and pushed the price a screen further down. */
          .pv-d-bundle-figures { grid-template-columns: 1fr 1fr; gap: 0; }
          .pv-d-bundle-figures .pv-d-figure { padding-right: 12px; }
          .pv-d-bundle-figures .pv-d-figure + .pv-d-figure { padding-left: 14px; }
          .pv-d-bundle-figures .pv-d-figure-label { letter-spacing: 0.12em; }
        }
        /* Mobile only: the bundle follows the same order as the two
           courses above it — heading, portrait, description, value, price.
           Desktop keeps the portrait beside the copy, untouched. */
        @media (max-width: 900px) {
          .pv-d-bundle-grid { grid-template-columns: 1fr; gap: var(--d-step-4); align-items: start; }
          .pv-d-bundle-left { display: contents; }
          .pv-d-bundle-portrait { order: 1; max-width: 340px; }
          .pv-d-bundle-copy { order: 2; }
          .pv-d-bundle-figures { order: 3; max-width: none; }
          .pv-d-bundle-buy { order: 4; margin-top: 0; }
          .pv-d-bundle-copy .pv-d-bundle-body { margin-bottom: 0; }
          .pv-d-bundle-portrait::after { top: -12px; right: -12px; bottom: 12px; left: 12px; }
        }
      `}</style>

      {backdrop && <Atmosphere src={backdrop} tone="dark" opacity={0.24} position="center 60%" />}
      <div className="pv-d-bundle-glow" aria-hidden="true" />
      <div className="pv-d-inner pv-d-bundle-inner pv-d-above">
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
          <div className="pv-d-bundle-left">
            <Reveal className="pv-d-bundle-copy" variant="up" delay={120}>
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

            <Reveal variant="up" delay={260} className="pv-d-bundle-buy">
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

          {portraitUrl && (
            <Reveal variant="fade" duration={1300} className="pv-d-bundle-portrait">
              <ParallaxMedia
                src={portraitUrl}
                alt="Lisa McPherson, Certified Personal Trainer"
                objectPosition="center 18%"
                aspect="4 / 5"
                shift={10}
                sizes="(max-width: 900px) 92vw, 34vw"
                // On a phone the browser selects the 3840w candidate for this
                // one file and then never completes the load, so the portrait
                // stayed blank while every other image on the page was fine.
                // Forcing a smaller variant by hand loads instantly, so the
                // candidate is the problem, not the file or the server. The
                // source is only 998x1388 and renders at most ~430px wide
                // here, so serving it unprocessed is both reliable and cheap.
                unoptimized
              />
            </Reveal>
          )}
        </div>

        <p className="pv-d-bundle-upsell">
          {BUNDLE.upsellLead} <Link href="/coaching">{BUNDLE.upsellLink}</Link>
        </p>
      </div>
    </section>
  )
}
