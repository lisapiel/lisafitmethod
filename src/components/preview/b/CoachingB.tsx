import Link from "next/link"
import { ParallaxMedia } from "../ParallaxMedia.client"
import { Reveal, RevealLines } from "../Reveal.client"
import { COACHING, COACHING_PILLARS, PREVIEW_PRICES } from "../previewContent"

// DIRECTION B coaching — the private room.
//
// Full-bleed portrait on the left running to the screen edge, terms on the
// right. The restraint is the same as Direction A's: no countdown, no
// scarcity theatre, one quiet line about the roster.
export function CoachingB() {
  return (
    <section className="pv-b-coach" id="coaching">
      <style>{`
        .pv-b-coach { background: #0b0b0d; display: grid; grid-template-columns: 0.86fr 1fr; align-items: stretch; }
        .pv-b-coach-media { position: relative; min-height: 70vh; }
        .pv-b-coach-media-inner { position: absolute; inset: 0; }
        .pv-b-coach-body { padding: clamp(64px, 8vw, 130px) clamp(20px, 5vw, 72px); display: flex; flex-direction: column; justify-content: center; }
        .pv-b-coach-h2 { font-size: clamp(1.9rem, 4.2vw, 3.6rem); max-width: 18ch; margin: clamp(18px, 2.2vw, 30px) 0 clamp(22px, 2.6vw, 34px); }
        .pv-b-coach-lede { max-width: 50ch; margin-bottom: clamp(34px, 4vw, 52px); }
        .pv-b-coach-pillar { display: grid; grid-template-columns: 42px 1fr; gap: clamp(14px, 1.8vw, 24px); padding: clamp(18px, 2.1vw, 26px) 0; border-top: 1px solid rgba(240,230,211,0.09); }
        .pv-b-coach-pillar:last-of-type { border-bottom: 1px solid rgba(240,230,211,0.09); }
        .pv-b-coach-pillar-num { font-family: var(--font-cormorant), serif; font-size: 1.15rem; color: rgba(201,169,110,0.65); line-height: 1.2; }
        .pv-b-coach-pillar h3 { font-family: var(--font-cormorant), serif; font-weight: 400; font-size: clamp(1.1rem, 1.5vw, 1.4rem); color: #f0e6d3; margin: 0 0 8px; line-height: 1.22; }
        .pv-b-coach-pillar p { font-size: 0.82rem; max-width: 52ch; }
        .pv-b-coach-foot { display: flex; align-items: flex-end; justify-content: space-between; gap: 26px; flex-wrap: wrap; margin-top: clamp(34px, 4vw, 50px); }
        .pv-b-coach-price { font-family: var(--font-cormorant), serif; font-weight: 300; font-size: clamp(1.5rem, 2.2vw, 2rem); color: #f0e6d3; margin: 0; }
        .pv-b-coach-note { font-family: var(--font-montserrat), sans-serif; font-weight: 300; font-size: 11px; line-height: 1.8; color: rgba(240,230,211,0.38); margin: 8px 0 0; max-width: 38ch; }
        @media (max-width: 900px) {
          .pv-b-coach { grid-template-columns: 1fr; }
          .pv-b-coach-media { min-height: 0; aspect-ratio: 4 / 5; }
          .pv-b-coach-media-inner { position: relative; height: 100%; }
        }
      `}</style>

      <div className="pv-b-coach-media">
        <div className="pv-b-coach-media-inner">
          <ParallaxMedia
            src="/lisa-coaching-hero.jpg"
            alt="Lisa McPherson coaching a client through a lift"
            objectPosition="center 30%"
            aspect="auto"
            shift={9}
            frameStyle={{ height: "100%", aspectRatio: "auto" }}
            sizes="(max-width: 900px) 100vw, 46vw"
          />
        </div>
      </div>

      <div className="pv-b-coach-body">
        <p className="pv-b-label">04 &#8212; {COACHING.eyebrow}</p>
        <h2 className="pv-b-display pv-b-coach-h2">
          <RevealLines lines={["Coaching built", <i key="i">around you.</i>]} stagger={130} />
        </h2>
        <Reveal variant="up">
          <p className="pv-b-body pv-b-coach-lede">{COACHING.body}</p>
        </Reveal>

        {COACHING_PILLARS.map((p, i) => (
          <Reveal key={p.index} className="pv-b-coach-pillar" variant="up" delay={i * 100} duration={1000}>
            <span className="pv-b-coach-pillar-num" aria-hidden="true">
              {p.index}
            </span>
            <div>
              <h3>{p.title}</h3>
              <p className="pv-b-body">{p.body}</p>
            </div>
          </Reveal>
        ))}

        <div className="pv-b-coach-foot">
          <div>
            <p className="pv-b-coach-price">{PREVIEW_PRICES.coachingFrom}</p>
            <p className="pv-b-coach-note">{COACHING.note}</p>
          </div>
          <Link href={COACHING.href} className="pv-b-cta">
            Apply for coaching
          </Link>
        </div>
      </div>
    </section>
  )
}
