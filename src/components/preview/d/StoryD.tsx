import Link from "next/link"
import { ParallaxMedia } from "../ParallaxMedia.client"
import { Reveal, RevealLines, DrawRule } from "../Reveal.client"
import { Atmosphere } from "./FlowD"
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
export function StoryD({
  portraitUrl,
  portraitCrop,
  backdrop,
}: {
  portraitUrl: string | null
  portraitCrop: string
  backdrop?: string
}) {
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
        @media (max-width: 960px) {
          .pv-d-story-grid { grid-template-columns: 1fr; gap: var(--d-step-5); }
          .pv-d-story-plates { max-width: 480px; }
          .pv-d-story-plate-sub { width: 62%; }
        }
      `}</style>

      {backdrop && <Atmosphere src={backdrop} tone="light" opacity={0.12} position="center 30%" />}
      <div className="pv-d-inner pv-d-above">
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

    </section>
  )
}
