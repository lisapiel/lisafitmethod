import Link from "next/link"
import { ParallaxMedia } from "../ParallaxMedia.client"
import { Reveal, RevealLines, DrawRule } from "../Reveal.client"
import { Atmosphere } from "./FlowD"
import { COACHING, COACHING_PILLARS } from "./coachingContent"

// 1:1 Coaching.
//
// The hero names coaching as one of two routes; this is where the reader
// finds out what the route actually involves. It arrives straight after the
// banner, so the page moves film, offer, film, then a person — which is the
// point in the scroll where the proposition becomes individual rather than
// product.
//
// Composition: Lisa's portrait holds the left for the full height of the
// section while the four terms run down the right, numbered, hairline
// separated. The price and the application sit under the terms rather than
// floating beside them, so the section closes on the ask.
export function CoachingD({ portraitUrl, backdrop }: { portraitUrl: string; backdrop?: string }) {
  return (
    <section className="pv-d-coach pv-d-light-alt pv-d-section" data-tone="light" id="coaching">
      <style>{`
        .pv-d-coach { overflow: hidden; }
        .pv-d-coach-grid {
          display: grid; grid-template-columns: minmax(0, 0.76fr) minmax(0, 1fr);
          gap: clamp(32px, 5vw, 86px); align-items: start;
        }
        .pv-d-coach-plate { position: sticky; top: 104px; }
        .pv-d-coach-plate::after {
          content: ""; position: absolute; top: 20px; left: -20px; right: 20px; bottom: -20px;
          border: 1px solid rgba(168,137,94,0.34); pointer-events: none;
        }
        .pv-d-coach-lede {
          max-width: 54ch; margin-bottom: var(--d-step-4);
          /* This paragraph was near-black over the strongest backdrop on the
             page, which read as harsh beside the muted body text directly
             under it. Softened so the intro sits on the photograph the way
             the rest of the section does. Size, weight and layout unchanged. */
          color: rgba(26,26,26,0.74);
        }
        .pv-d-pillar {
          display: grid; grid-template-columns: 46px 1fr; gap: clamp(14px, 1.8vw, 26px);
          padding: clamp(18px, 2.1vw, 26px) 0; border-top: 1px solid var(--d-rule);
        }
        .pv-d-pillar:last-of-type { border-bottom: 1px solid var(--d-rule); }
        .pv-d-pillar-num {
          font-family: var(--font-playfair), serif; font-size: clamp(1rem, 1.3vw, 1.2rem);
          color: var(--d-accent-dark); line-height: 1.3;
        }
        .pv-d-pillar h3 {
          font-family: var(--font-playfair), serif; font-weight: 500;
          font-size: clamp(1.08rem, 1.45vw, 1.34rem); color: var(--d-text);
          margin: 0 0 7px; line-height: 1.24;
        }
        .pv-d-pillar p { font-size: 0.875rem; line-height: 1.78; max-width: 56ch; }
        .pv-d-coach-foot {
          display: flex; align-items: flex-end; justify-content: space-between;
          gap: var(--d-step-3); flex-wrap: wrap; margin-top: var(--d-step-4);
          /* Line the price, its note and the button up with the pillar copy
             above rather than with the column edge. Each pillar is a 46px
             number column plus the grid gap, so the same offset puts this
             block on the left edge of the text it belongs to. */
          padding-left: calc(46px + clamp(14px, 1.8vw, 26px));
        }
        .pv-d-coach-price {
          font-family: var(--font-playfair), serif; font-weight: 500;
          font-size: clamp(1.5rem, 2.2vw, 2rem); color: var(--d-text); margin: 0;
        }
        .pv-d-coach-note {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300; font-size: 12.5px;
          line-height: 1.7; color: var(--d-muted); margin: 6px 0 0; max-width: 34ch;
        }
        @media (max-width: 960px) {
          .pv-d-coach-grid { grid-template-columns: 1fr; gap: var(--d-step-5); }
          /* relative, not static. The frame below is absolutely positioned,
             so turning the plate static let it escape to .pv-d-inner and be
             drawn as a ~1985px box around the whole section — the long
             border running past the numbered steps down to the price. */
          /* top: auto matters as much as the position. The desktop rule is
             sticky with top 104px, so switching to relative without clearing
             top left the photograph shifted 104px down over the paragraph
             below it. Static used to ignore top; relative does not. */
          .pv-d-coach-plate { position: relative; top: auto; max-width: 420px; }
          /* The offset frame is a two-column device: once the layout stacks
             it was drawn 8px from the left edge and 36px from the right,
             which made the whole section read as shifted even though every
             other element is centred at 22px. Centred on the photo here. */
          .pv-d-coach-plate::after { top: -12px; left: -12px; right: -12px; bottom: -12px; }
        }
      `}</style>

      {backdrop && <Atmosphere src={backdrop} tone="light" opacity={0.5} position="center 30%" scrim="right" />}

      <div className="pv-d-inner pv-d-above">
        <div className="pv-d-open">
          <p className="pv-d-eyebrow">{COACHING.eyebrow}</p>
          <div className="pv-d-open-rule">
            <DrawRule color="rgba(168,137,94,0.55)" />
          </div>
          <h2 className="pv-d-display pv-d-h2" style={{ maxWidth: "18ch" }}>
            <RevealLines lines={[COACHING.heading]} />
          </h2>
        </div>

        <div className="pv-d-coach-grid">
          <Reveal variant="fade" duration={1300} className="pv-d-coach-plate">
            <ParallaxMedia
              src={portraitUrl}
              alt="Lisa McPherson, Certified Personal Trainer"
              objectPosition="center 16%"
              aspect="3 / 4"
              shift={11}
              sizes="(max-width: 960px) 420px, 32vw"
            />
          </Reveal>

          <div>
            <Reveal variant="up" duration={1100}>
              <p className="pv-d-lede pv-d-coach-lede">{COACHING.body}</p>
            </Reveal>

            {COACHING_PILLARS.map((pillar, i) => (
              <Reveal key={pillar.index} className="pv-d-pillar" variant="up" delay={i * 90} duration={1050}>
                <span className="pv-d-pillar-num" aria-hidden="true">
                  {pillar.index}
                </span>
                <div>
                  <h3>{pillar.title}</h3>
                  <p className="pv-d-body">{pillar.body}</p>
                </div>
              </Reveal>
            ))}

            <Reveal variant="up" delay={140} className="pv-d-coach-foot">
              <div>
                <p className="pv-d-coach-price">{COACHING.price}</p>
                <p className="pv-d-coach-note">{COACHING.note}</p>
              </div>
              <Link href={COACHING.href} className="pv-d-btn pv-d-btn--primary">
                <span>{COACHING.cta}</span>
              </Link>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
