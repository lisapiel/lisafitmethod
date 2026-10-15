import Link from "next/link"
import { ParallaxMedia } from "../ParallaxMedia.client"
import { Reveal, RevealLines, DrawRule } from "../Reveal.client"
import { STORY } from "./productionCopy"

// The story, on paper.
//
// This is where the page turns light, and the reason it does: four real
// paragraphs need a reading ground, not a film set. Every word is the live
// section — the work here is measure, leading, a lead-paragraph weight on
// the opening line, and a portrait that drifts against the scroll.
//
// The pull quote stays on black inside the light section. That inset is
// deliberate: it keeps the two tones talking to each other instead of
// sitting in separate halves of the page.
export function StoryC({ portraitUrl, portraitCrop }: { portraitUrl: string | null; portraitCrop: string }) {
  const [lead, ...rest] = STORY.paragraphs

  return (
    <section className="pv-c-story pv-c-light pv-c-section" data-tone="light" id="story">
      <style>{`
        .pv-c-story-head {
          display: grid; grid-template-columns: 190px 1fr; gap: clamp(22px, 4vw, 64px);
          align-items: start; margin-bottom: clamp(40px, 5vw, 72px);
        }
        .pv-c-story-h2 { max-width: 20ch; }
        .pv-c-story-grid {
          display: grid; grid-template-columns: 0.72fr 1fr; gap: clamp(32px, 5vw, 88px);
          align-items: start;
        }
        .pv-c-story-plate { position: sticky; top: 104px; }
        .pv-c-story-cap {
          margin: 12px 0 0; font-family: var(--font-dm-sans), sans-serif; font-size: 10px;
          font-weight: 500; letter-spacing: 0.22em; text-transform: uppercase; color: rgba(26,26,26,0.38);
        }
        .pv-c-story-lead {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
          font-size: clamp(1.08rem, 1.45vw, 1.38rem); line-height: 1.66;
          color: var(--c-text); margin: 0 0 clamp(20px, 2.2vw, 30px); max-width: 58ch;
        }
        .pv-c-story-p {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
          font-size: clamp(0.95rem, 1.05vw, 1.0625rem); line-height: 1.86;
          color: var(--c-muted); margin: 0 0 clamp(18px, 2vw, 26px); max-width: 62ch;
        }
        .pv-c-quote {
          position: relative; background: var(--c-black); color: var(--c-off-white);
          padding: clamp(44px, 5.5vw, 88px) clamp(28px, 5vw, 80px);
          margin-top: clamp(52px, 6.5vw, 110px); overflow: hidden;
        }
        .pv-c-quote-glow {
          position: absolute; top: 50%; left: 50%; width: 760px; height: 760px; max-width: 150vw;
          transform: translate(-50%, -50%); pointer-events: none;
          background: radial-gradient(circle, rgba(200,169,126,0.12) 0%, transparent 68%);
        }
        .pv-c-quote-inner { position: relative; max-width: 1180px; margin: 0 auto; text-align: center; }
        .pv-c-quote-mark {
          display: block; font-family: var(--font-playfair), serif;
          font-size: clamp(4rem, 9vw, 8rem); line-height: 0.6; color: rgba(200,169,126,0.32);
          user-select: none; margin-bottom: 0.08em;
        }
        .pv-c-quote-text {
          font-family: var(--font-playfair), serif; font-style: italic; font-weight: 400;
          font-size: clamp(1.4rem, 3.1vw, 2.8rem); line-height: 1.32; color: var(--c-off-white);
          max-width: 26ch; margin: 0 auto; text-wrap: balance;
        }
        .pv-c-quote-cite {
          display: block; margin-top: clamp(22px, 2.6vw, 34px); font-style: normal;
          font-family: var(--font-dm-sans), sans-serif; font-size: 10px; font-weight: 600;
          letter-spacing: 0.26em; text-transform: uppercase; color: var(--c-accent);
        }
        @media (max-width: 960px) {
          .pv-c-story-head { grid-template-columns: 1fr; gap: 16px; }
          .pv-c-story-grid { grid-template-columns: 1fr; gap: 42px; }
          .pv-c-story-plate { position: static; }
        }
      `}</style>

      <div className="pv-c-inner">
        <div className="pv-c-story-head">
          <div>
            <p className="pv-c-eyebrow">{STORY.eyebrow}</p>
            <div style={{ marginTop: 16, maxWidth: 120 }}>
              <DrawRule color="rgba(168,137,94,0.5)" />
            </div>
          </div>
          <h2 className="pv-c-display pv-c-h2 pv-c-story-h2">
            <RevealLines lines={[STORY.heading]} />
          </h2>
        </div>

        <div className="pv-c-story-grid">
          <div>
            {portraitUrl && (
              <Reveal variant="fade" duration={1300}>
                <div className="pv-c-story-plate">
                  <ParallaxMedia
                    src={portraitUrl}
                    alt="Lisa McPherson, Certified Personal Trainer"
                    objectPosition={portraitCrop}
                    aspect="3 / 4"
                    shift={12}
                    sizes="(max-width: 960px) 100vw, 36vw"
                  />
                </div>
              </Reveal>
            )}
          </div>

          <div>
            <Reveal variant="up" duration={1100}>
              <p className="pv-c-story-lead">{lead}</p>
            </Reveal>
            {rest.map((para, i) => (
              <Reveal key={para.slice(0, 40)} variant="up" delay={i * 90} duration={1100}>
                <p className="pv-c-story-p">{para}</p>
              </Reveal>
            ))}
            <Reveal variant="up" delay={120}>
              <Link href="/about" className="pv-c-link">
                {STORY.link}
              </Link>
            </Reveal>
          </div>
        </div>
      </div>

      <figure className="pv-c-quote pv-c-dark" data-tone="dark">
        <div className="pv-c-quote-glow" aria-hidden="true" />
        <div className="pv-c-quote-inner">
          <span className="pv-c-quote-mark" aria-hidden="true">
            &ldquo;
          </span>
          <blockquote className="pv-c-quote-text">
            <RevealLines lines={[STORY.quote]} />
          </blockquote>
          <cite className="pv-c-quote-cite">{STORY.cite}</cite>
        </div>
      </figure>
    </section>
  )
}
