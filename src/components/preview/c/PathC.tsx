import Link from "next/link"
import { Reveal, RevealLines } from "../Reveal.client"
import { ParallaxMedia } from "../ParallaxMedia.client"
import { PATH } from "./productionCopy"

// "Choose how you want to start." — kept on the dark ground so the hero's
// mood carries one section further before the page opens into daylight for
// the story. Copy is the live section, unchanged.
export function PathC() {
  return (
    <section className="pv-c-path pv-c-dark pv-c-section" data-tone="dark" aria-label="Choose how you want to start">
      <style>{`
        .pv-c-path { padding-top: clamp(56px, 7vw, 110px); }
        .pv-c-path-head { text-align: center; margin: 0 auto clamp(34px, 4vw, 58px); max-width: 24ch; }
        .pv-c-path-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: rgba(200,169,126,0.18); max-width: 1000px; margin: 0 auto; }
        .pv-c-path-card {
          position: relative; overflow: hidden; background: var(--c-black);
          padding: clamp(30px, 3.6vw, 54px); display: flex; flex-direction: column;
          text-decoration: none; color: inherit;
          transition: background 760ms cubic-bezier(0.16,1,0.3,1);
        }
        .pv-c-path-card::before {
          content: ""; position: absolute; inset: 0; pointer-events: none;
          background: radial-gradient(120% 100% at 50% 100%, rgba(200,169,126,0.14) 0%, transparent 72%);
          opacity: 0; transition: opacity 900ms cubic-bezier(0.16,1,0.3,1);
        }
        .pv-c-path-card:hover::before { opacity: 1; }
        .pv-c-path-card > * { position: relative; }
        .pv-c-path-body {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
          font-size: clamp(1rem, 1.2vw, 1.15rem); line-height: 1.6;
          color: rgba(245,242,238,0.74); margin: 16px 0 22px; max-width: 30ch;
        }
        .pv-c-path-price {
          font-family: var(--font-dm-sans), sans-serif; font-size: 12px; font-weight: 400;
          letter-spacing: 0.08em; color: rgba(245,242,238,0.42); margin: 0 0 30px;
        }
        .pv-c-path-cta {
          margin-top: auto; display: inline-flex; align-items: center; gap: 10px;
          font-family: var(--font-dm-sans), sans-serif; font-size: 11px; font-weight: 600;
          letter-spacing: 0.2em; text-transform: uppercase; color: var(--c-accent);
          transition: gap 560ms cubic-bezier(0.16,1,0.3,1);
        }
        .pv-c-path-card:hover .pv-c-path-cta { gap: 20px; }
        @media (max-width: 860px) { .pv-c-path-grid { grid-template-columns: 1fr; } }
      `}</style>

      <h2 className="pv-c-display pv-c-h2 pv-c-path-head">
        <RevealLines lines={[PATH.heading]} />
      </h2>

      <div className="pv-c-path-grid">
        {PATH.cards.map((card, i) => (
          <Reveal key={card.href} variant="up" delay={i * 130} duration={1100}>
            <Link href={card.href} className="pv-c-path-card" style={{ height: "100%" }}>
              <p className="pv-c-eyebrow">{card.eyebrow}</p>
              <p className="pv-c-path-body">{card.body}</p>
              <p className="pv-c-path-price">{card.price}</p>
              <span className="pv-c-path-cta">{card.cta}</span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

// A full-bleed plate that drifts against the scroll. Production shows this
// same photograph beside the hero headline; here it gets a band of its own,
// where it does the work of carrying the eye out of the dark chapter.
export function PhotoBandC({ src, objectPosition }: { src: string; objectPosition: string }) {
  return (
    <section className="pv-c-dark" data-tone="dark">
      <style>{`
        .pv-c-band { height: clamp(300px, 52vh, 560px); }
        @media (max-width: 768px) { .pv-c-band { height: 76vw; } }
      `}</style>
      <div className="pv-c-band">
        <ParallaxMedia
          src={src}
          alt="Lisa McPherson, Lisa Fit Method"
          objectPosition={objectPosition}
          aspect="auto"
          shift={14}
          hoverZoom={false}
          frameStyle={{ aspectRatio: "auto", height: "100%" }}
          sizes="100vw"
        />
      </div>
    </section>
  )
}
