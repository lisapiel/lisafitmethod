import { Reveal, RevealLines, DrawRule } from "../Reveal.client"
import SquareVideo from "./SquareVideo.client"
import { GABRIELA, GINO, GINO_VIDEO, TESTIMONIALS_HEAD } from "./testimonialContent"

// Clients — an editorial feature, not a review widget.
//
// Composition: Gino is the anchor. His square video holds the left column and
// everything beside it is set to the video's own edges — the results row sits
// flush under his headline, the quote hangs off a gold rule, and his longer
// message sits beneath at body size. Three figures, one row, the same figure
// treatment the bundle uses, so the numbers read as part of the page rather
// than a stats widget.
//
// Gabriela follows as a single wide pull quote. With no photograph she is
// composed as typography on purpose — a measured column, a gold rule and her
// attribution — so nothing is missing rather than something being absent. If
// a portrait arrives later it drops into the optional column below without
// the rest of the section changing.
export function TestimonialsD({ gabyPortraitUrl = null }: { gabyPortraitUrl?: string | null }) {
  return (
    <section className="pv-d-clients pv-d-light pv-d-section" data-tone="light" id="clients">
      <style>{`
        .pv-d-gino {
          display: grid; grid-template-columns: minmax(0, 0.82fr) minmax(0, 1fr);
          gap: clamp(28px, 4.4vw, 76px); align-items: start;
        }
        .pv-d-gino-head { margin-bottom: var(--d-step-3); max-width: 18ch; }
        .pv-d-gino-figures { grid-template-columns: repeat(3, 1fr); margin-bottom: var(--d-step-4); }
        .pv-d-gino-quote {
          font-family: var(--font-playfair), serif; font-style: italic; font-weight: 400;
          font-size: clamp(1.18rem, 1.85vw, 1.65rem); line-height: 1.52; color: var(--d-text);
          border-left: 2px solid var(--d-accent); padding-left: var(--d-step-3);
          margin: 0 0 var(--d-step-3); max-width: 42ch;
        }
        .pv-d-gino-written {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300; font-size: 0.9rem;
          line-height: 1.82; color: var(--d-muted); margin: 0 0 var(--d-step-3); max-width: 54ch;
        }
        .pv-d-cite {
          font-style: normal; font-family: var(--font-dm-sans), sans-serif; font-size: 10px;
          font-weight: 600; letter-spacing: 0.24em; text-transform: uppercase; color: var(--d-accent-dark);
        }
        .pv-d-gaby {
          margin-top: var(--d-step-5); padding-top: var(--d-step-5);
          border-top: 1px solid var(--d-rule);
          display: grid; grid-template-columns: minmax(0, 0.34fr) minmax(0, 1fr);
          gap: clamp(24px, 4vw, 72px); align-items: start;
        }
        .pv-d-gaby[data-has-portrait="false"] { grid-template-columns: minmax(0, 0.22fr) minmax(0, 1fr); }
        .pv-d-gaby-rail { padding-top: 6px; }
        .pv-d-gaby-portrait {
          width: 100%; aspect-ratio: 1 / 1; overflow: hidden; border-radius: 50%;
          background: var(--d-off-white);
        }
        .pv-d-gaby-portrait img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .pv-d-gaby-quote {
          font-family: var(--font-playfair), serif; font-style: italic; font-weight: 400;
          font-size: clamp(1.12rem, 1.75vw, 1.52rem); line-height: 1.5; color: var(--d-text);
          margin: 0 0 var(--d-step-3); max-width: 44ch;
        }
        .pv-d-gaby-written {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300; font-size: 0.9rem;
          line-height: 1.82; color: var(--d-muted); margin: 0 0 var(--d-step-3); max-width: 52ch;
        }
        @media (max-width: 960px) {
          .pv-d-gino { grid-template-columns: 1fr; gap: var(--d-step-4); }
          .pv-d-gaby, .pv-d-gaby[data-has-portrait="false"] { grid-template-columns: 1fr; gap: var(--d-step-3); }
          .pv-d-gaby-rail { max-width: 120px; }
        }
        @media (max-width: 560px) {
          .pv-d-gino-figures { grid-template-columns: 1fr; }
          .pv-d-gino-figures .pv-d-figure + .pv-d-figure {
            border-left: none; padding-left: 0;
            border-top: 1px solid var(--d-rule); padding-top: var(--d-step-3);
          }
        }
      `}</style>

      <div className="pv-d-inner">
        <div className="pv-d-open pv-d-open--centre">
          <p className="pv-d-eyebrow">{TESTIMONIALS_HEAD.eyebrow}</p>
          <div className="pv-d-open-rule">
            <DrawRule color="rgba(168,137,94,0.55)" origin="center" />
          </div>
          <h2 className="pv-d-display pv-d-h2">
            <RevealLines lines={[TESTIMONIALS_HEAD.heading]} />
          </h2>
          <Reveal variant="up" delay={140}>
            <p className="pv-d-body" style={{ maxWidth: "48ch", margin: "var(--d-step-2) auto 0" }}>
              {TESTIMONIALS_HEAD.sub}
            </p>
          </Reveal>
        </div>

        <div className="pv-d-gino">
          <Reveal variant="fade" duration={1200}>
            <SquareVideo src={GINO_VIDEO.src} poster={GINO_VIDEO.poster} label={`${GINO.name}, video testimonial`} />
          </Reveal>

          <div>
            <Reveal variant="up" delay={120} duration={1100}>
              <h3 className="pv-d-display pv-d-h3 pv-d-gino-head">{GINO.headline}</h3>
            </Reveal>
            <Reveal variant="up" delay={200} className="pv-d-figures pv-d-gino-figures">
              {GINO.metrics.map((m) => (
                <div key={m.label} className="pv-d-figure">
                  <span className="pv-d-figure-value">{m.value}</span>
                  <span className="pv-d-figure-label">{m.label}</span>
                </div>
              ))}
            </Reveal>
            <Reveal variant="up" delay={280} duration={1100}>
              <blockquote className="pv-d-gino-quote">&ldquo;{GINO.quote}&rdquo;</blockquote>
              <p className="pv-d-gino-written">{GINO.written}</p>
              <cite className="pv-d-cite">
                {GINO.name} &middot; {GINO.descriptor}
              </cite>
            </Reveal>
          </div>
        </div>

        <div className="pv-d-gaby" data-has-portrait={Boolean(gabyPortraitUrl)}>
          <div className="pv-d-gaby-rail">
            {gabyPortraitUrl ? (
              <div className="pv-d-gaby-portrait">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={gabyPortraitUrl} alt={GABRIELA.name} />
              </div>
            ) : (
              <DrawRule color="rgba(168,137,94,0.55)" />
            )}
          </div>
          <Reveal variant="up" duration={1100}>
            <blockquote className="pv-d-gaby-quote">&ldquo;{GABRIELA.quote}&rdquo;</blockquote>
            <p className="pv-d-gaby-written">{GABRIELA.written}</p>
            <cite className="pv-d-cite">
              {GABRIELA.name} &middot; {GABRIELA.descriptor}
            </cite>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
