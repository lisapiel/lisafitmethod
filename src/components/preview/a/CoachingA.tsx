import Link from "next/link"
import { ParallaxMedia } from "../ParallaxMedia.client"
import { Reveal, RevealLines, DrawRule } from "../Reveal.client"
import { COACHING, COACHING_PILLARS, PREVIEW_PRICES } from "../previewContent"

// DIRECTION A coaching — "by application".
//
// The refinement here is restraint: no urgency, no scarcity theatre. A
// portrait, four numbered terms of service set as an index, and one quiet
// line about the roster being small. Premium services sell by looking
// unbothered about whether you apply.
export function CoachingA() {
  return (
    <section className="pv-a-coach" id="coaching">
      <style>{`
        .pv-a-coach { background: #efe9e1; padding: clamp(72px, 9vw, 140px) clamp(20px, 5vw, 72px); }
        .pv-a-coach-head { display: grid; grid-template-columns: 180px 1fr; gap: clamp(24px, 4vw, 64px); align-items: end; margin-bottom: clamp(40px, 5vw, 70px); }
        .pv-a-coach-h2 {
          font-family: var(--font-playfair), serif; font-size: clamp(1.9rem, 4vw, 3.6rem);
          font-weight: 500; line-height: 1.04; color: #121110; margin: 0; max-width: 20ch;
        }
        .pv-a-coach-h2 i { font-style: italic; color: #a8895e; }
        .pv-a-coach-grid { display: grid; grid-template-columns: 0.78fr 1fr; gap: clamp(32px, 5vw, 86px); align-items: start; }
        .pv-a-coach-lede {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
          font-size: clamp(0.95rem, 1.15vw, 1.1rem); line-height: 1.75;
          color: rgba(18,17,16,0.68); margin: 0 0 clamp(30px, 3.4vw, 46px); max-width: 52ch;
        }
        .pv-a-pillar { display: grid; grid-template-columns: 54px 1fr; gap: clamp(14px, 2vw, 26px); padding: clamp(20px, 2.2vw, 28px) 0; border-bottom: 1px solid rgba(18,17,16,0.14); }
        .pv-a-pillar:first-child { border-top: 1px solid rgba(18,17,16,0.14); }
        .pv-a-pillar-num {
          font-family: var(--font-playfair), serif; font-size: clamp(1.1rem, 1.5vw, 1.4rem);
          color: rgba(168,137,94,0.7); line-height: 1.1;
        }
        .pv-a-pillar-title {
          font-family: var(--font-playfair), serif; font-size: clamp(1.1rem, 1.5vw, 1.4rem);
          font-weight: 500; color: #121110; margin: 0 0 8px; line-height: 1.24;
        }
        .pv-a-pillar-body {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300; font-size: 0.875rem;
          line-height: 1.75; color: rgba(18,17,16,0.6); margin: 0; max-width: 56ch;
        }
        .pv-a-coach-foot { display: flex; align-items: center; justify-content: space-between; gap: 24px; flex-wrap: wrap; padding-top: clamp(32px, 3.6vw, 50px); }
        .pv-a-coach-note {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300; font-size: 0.82rem;
          line-height: 1.7; color: rgba(18,17,16,0.5); margin: 0; max-width: 40ch;
        }
        .pv-a-coach-price { font-family: var(--font-playfair), serif; font-size: clamp(1.3rem, 2vw, 1.75rem); color: #121110; }
        .pv-a-coach-cta {
          position: relative; overflow: hidden; display: inline-block; text-decoration: none;
          font-family: var(--font-dm-sans), sans-serif; font-size: 10.5px; font-weight: 600;
          letter-spacing: 0.22em; text-transform: uppercase; color: #f7f4ef; background: #121110;
          padding: 18px 44px; transition: color 560ms ease;
        }
        .pv-a-coach-cta span { position: relative; z-index: 1; }
        .pv-a-coach-cta::before {
          content: ""; position: absolute; inset: 0; background: #a8895e;
          transform: scaleY(0); transform-origin: bottom; transition: transform 640ms cubic-bezier(0.16,1,0.3,1);
        }
        .pv-a-coach-cta:hover { color: #121110; }
        .pv-a-coach-cta:hover::before { transform: scaleY(1); }
        @media (max-width: 900px) {
          .pv-a-coach-head { grid-template-columns: 1fr; gap: 16px; align-items: start; }
          .pv-a-coach-grid { grid-template-columns: 1fr; gap: 40px; }
          .pv-a-pillar { grid-template-columns: 40px 1fr; }
        }
      `}</style>

      <div className="pv-a-coach-head">
        <p className="pv-a-runhead">
          04 — Coaching
          <span>{COACHING.eyebrow}</span>
        </p>
        <h2 className="pv-a-coach-h2">
          <RevealLines lines={["Coaching built", <i key="i">around you.</i>]} stagger={110} />
        </h2>
      </div>

      <div className="pv-a-coach-grid">
        <Reveal variant="fade" duration={1300}>
          <ParallaxMedia
            src="/lisa-coaching-hero.jpg"
            alt="Lisa McPherson coaching a client through a lift"
            objectPosition="center 30%"
            aspect="4 / 5"
            shift={11}
            sizes="(max-width: 900px) 100vw, 38vw"
          />
        </Reveal>

        <div>
          <Reveal variant="up">
            <p className="pv-a-coach-lede">{COACHING.body}</p>
          </Reveal>
          {COACHING_PILLARS.map((p, i) => (
            <Reveal key={p.index} className="pv-a-pillar" variant="up" delay={i * 100} duration={1000}>
              <span className="pv-a-pillar-num" aria-hidden="true">
                {p.index}
              </span>
              <div>
                <h3 className="pv-a-pillar-title">{p.title}</h3>
                <p className="pv-a-pillar-body">{p.body}</p>
              </div>
            </Reveal>
          ))}

          <div className="pv-a-coach-foot">
            <div>
              <p className="pv-a-coach-price">{PREVIEW_PRICES.coachingFrom}</p>
              <p className="pv-a-coach-note">{COACHING.note}</p>
            </div>
            <Link href={COACHING.href} className="pv-a-coach-cta">
              <span>Apply for coaching</span>
            </Link>
          </div>
          <div style={{ marginTop: "clamp(26px, 3vw, 40px)" }}>
            <DrawRule />
          </div>
        </div>
      </div>
    </section>
  )
}
