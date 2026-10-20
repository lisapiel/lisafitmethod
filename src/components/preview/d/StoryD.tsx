import Link from "next/link"
import { ParallaxMedia } from "../ParallaxMedia.client"
import { Reveal, RevealLines, DrawRule } from "../Reveal.client"
import { STORY } from "../c/productionCopy"

// The story, set as a feature.
//
// Four real paragraphs, unchanged. The density is handled with measure and
// leading rather than with cuts: the opening paragraph carries a larger
// lede weight, the rest sit at a 62-character measure, and the portrait
// holds the left column so the text never runs the full page width.
//
// The pull quote stays on black inside the light section. It is the one
// dark accent in the middle of the page, and it earns its place: it is the
// sentence the whole section is building to.
export function StoryD({ portraitUrl, portraitCrop }: { portraitUrl: string | null; portraitCrop: string }) {
  const [lead, ...rest] = STORY.paragraphs

  return (
    <section className="pv-d-story pv-d-light-alt pv-d-section" data-tone="light" id="story">
      <style>{`
        .pv-d-story-grid {
          display: grid; grid-template-columns: minmax(0, 0.68fr) minmax(0, 1fr);
          gap: clamp(32px, 5vw, 88px); align-items: start;
        }
        .pv-d-story-plate { position: sticky; top: 100px; }
        .pv-d-story-lead {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
          font-size: clamp(1.08rem, 1.42vw, 1.34rem); line-height: 1.68;
          color: var(--d-text); margin: 0 0 var(--d-step-3); max-width: 56ch;
        }
        .pv-d-story-p {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
          font-size: clamp(0.95rem, 1.05vw, 1.0625rem); line-height: 1.86;
          color: var(--d-muted); margin: 0 0 var(--d-step-3); max-width: 62ch;
        }
        .pv-d-quote {
          position: relative;
          margin: var(--d-step-5) auto 0; max-width: var(--d-max);
          padding: var(--d-step-5) 0 0; border-top: 1px solid var(--d-rule);
          text-align: center;
        }
        .pv-d-quote-mark {
          display: block; font-family: var(--font-playfair), serif;
          font-size: clamp(3.4rem, 7.5vw, 6.4rem); line-height: 0.6;
          color: rgba(168,137,94,0.3); user-select: none; margin-bottom: 0.1em;
        }
        .pv-d-quote-text {
          font-family: var(--font-playfair), serif; font-style: italic; font-weight: 400;
          font-size: clamp(1.4rem, 3vw, 2.6rem); line-height: 1.34;
          color: var(--d-text); max-width: 26ch; margin: 0 auto; text-wrap: balance;
        }
        .pv-d-quote-cite {
          display: block; margin-top: var(--d-step-3); font-style: normal;
          font-family: var(--font-dm-sans), sans-serif; font-size: 10px; font-weight: 600;
          letter-spacing: 0.26em; text-transform: uppercase; color: var(--d-accent-dark);
        }
        @media (max-width: 960px) {
          .pv-d-story-grid { grid-template-columns: 1fr; gap: var(--d-step-5); }
          .pv-d-story-plate { position: static; max-width: 460px; }
        }
      `}</style>

      <div className="pv-d-inner">
        <div className="pv-d-open">
          <p className="pv-d-eyebrow">{STORY.eyebrow}</p>
          <div className="pv-d-open-rule">
            <DrawRule color="rgba(168,137,94,0.55)" />
          </div>
          <h2 className="pv-d-display pv-d-h2" style={{ maxWidth: "20ch" }}>
            <RevealLines lines={[STORY.heading]} />
          </h2>
        </div>

        <div className="pv-d-story-grid">
          <div>
            {portraitUrl && (
              <Reveal variant="fade" duration={1300}>
                <div className="pv-d-story-plate">
                  <ParallaxMedia
                    src={portraitUrl}
                    alt="Lisa McPherson, Certified Personal Trainer"
                    objectPosition={portraitCrop}
                    aspect="3 / 4"
                    shift={12}
                    sizes="(max-width: 960px) 100vw, 34vw"
                  />
                </div>
              </Reveal>
            )}
          </div>

          <div>
            <Reveal variant="up" duration={1100}>
              <p className="pv-d-story-lead">{lead}</p>
            </Reveal>
            {rest.map((para, i) => (
              <Reveal key={para.slice(0, 40)} variant="up" delay={i * 90} duration={1100}>
                <p className="pv-d-story-p">{para}</p>
              </Reveal>
            ))}
            <Reveal variant="up" delay={120}>
              <Link href="/about" className="pv-d-link">
                {STORY.link}
              </Link>
            </Reveal>
          </div>
        </div>
      </div>

      <figure className="pv-d-quote">
        <span className="pv-d-quote-mark" aria-hidden="true">
          &ldquo;
        </span>
        <blockquote className="pv-d-quote-text">
          <RevealLines lines={[STORY.quote]} />
        </blockquote>
        <cite className="pv-d-quote-cite">{STORY.cite}</cite>
      </figure>
    </section>
  )
}
