import Link from "next/link"
import { Reveal, RevealLines, DrawRule } from "../Reveal.client"
import { PATH } from "../c/productionCopy"

// "Choose how you want to start." — on paper in Direction D.
//
// Production runs this on black directly under the hero, which makes the top
// of the page one long dark stretch. Moving it into the light lets the page
// open up immediately after the film, and gives the two routes the clarity
// they deserve. The words are unchanged.
export function PathD() {
  return (
    <section className="pv-d-path pv-d-light pv-d-section" data-tone="light" aria-label="Choose how you want to start">
      <style>{`
        .pv-d-path-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 1px;
          background: var(--d-rule); border-top: 1px solid var(--d-rule);
          border-bottom: 1px solid var(--d-rule);
        }
        .pv-d-path-card {
          position: relative; overflow: hidden; background: var(--d-warm-white);
          padding: var(--d-step-5) var(--d-step-4);
          display: flex; flex-direction: column; text-decoration: none; color: inherit;
          transition: background 700ms cubic-bezier(0.16,1,0.3,1);
        }
        .pv-d-path-card::before {
          content: ""; position: absolute; inset: 0; pointer-events: none;
          background: linear-gradient(to top, rgba(200,169,126,0.1), transparent 62%);
          opacity: 0; transition: opacity 820ms cubic-bezier(0.16,1,0.3,1);
        }
        .pv-d-path-card:hover::before { opacity: 1; }
        .pv-d-path-card > * { position: relative; }
        .pv-d-path-body {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
          font-size: clamp(1.02rem, 1.25vw, 1.2rem); line-height: 1.62;
          color: var(--d-text); margin: var(--d-step-2) 0 var(--d-step-3); max-width: 30ch;
        }
        .pv-d-path-price {
          font-family: var(--font-dm-sans), sans-serif; font-size: 12px;
          letter-spacing: 0.08em; color: var(--d-muted); margin: 0 0 var(--d-step-4);
        }
        .pv-d-path-cta {
          margin-top: auto; display: inline-flex; align-items: center; gap: 10px;
          font-family: var(--font-dm-sans), sans-serif; font-size: 11px; font-weight: 600;
          letter-spacing: 0.2em; text-transform: uppercase; color: var(--d-accent-dark);
          transition: gap 560ms cubic-bezier(0.16,1,0.3,1);
        }
        .pv-d-path-card:hover .pv-d-path-cta { gap: 20px; }
        @media (max-width: 860px) { .pv-d-path-grid { grid-template-columns: 1fr; } }
      `}</style>

      <div className="pv-d-inner">
        <div className="pv-d-open pv-d-open--centre">
          <h2 className="pv-d-display pv-d-h2">
            <RevealLines lines={[PATH.heading]} />
          </h2>
          <div className="pv-d-open-rule" style={{ marginTop: "var(--d-step-3)", marginBottom: 0 }}>
            <DrawRule color="rgba(168,137,94,0.55)" origin="center" />
          </div>
        </div>

        <div className="pv-d-path-grid">
          {PATH.cards.map((card, i) => (
            <Reveal key={card.href} variant="up" delay={i * 130} duration={1100}>
              <Link href={card.href} className="pv-d-path-card" style={{ height: "100%" }}>
                <p className="pv-d-eyebrow">{card.eyebrow}</p>
                <p className="pv-d-path-body">{card.body}</p>
                <p className="pv-d-path-price">{card.price}</p>
                <span className="pv-d-path-cta">{card.cta}</span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
