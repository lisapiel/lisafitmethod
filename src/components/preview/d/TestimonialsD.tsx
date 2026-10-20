import { ParallaxMedia } from "../ParallaxMedia.client"
import { Reveal, RevealLines, DrawRule } from "../Reveal.client"
import SquareVideo from "./SquareVideo.client"
import { GABY_PHOTO, GABRIELA, GINO, GINO_VIDEO, TESTIMONIALS_HEAD } from "./testimonialContent"

// Clients — two accounts of the same thing, set as one editorial spread.
//
// The structure that keeps it from reading as stacked cards is alternation:
// Gino's square film holds the left, Gabriela's portrait answers it from the
// right, and her block rises into the space beside the end of his. There is
// no rule between them and no second section heading — the eye crosses from
// one to the other diagonally, which is what makes a magazine spread feel
// continuous where a column of boxes does not.
//
// Gino stays the anchor: his plate is half again the size of hers, and his
// results sit in a single compact strip rather than a stack of tiles, so the
// numbers read as one line of evidence instead of three separate panels.
//
// Every word in both testimonials is the approved text, unchanged.
export function TestimonialsD() {
  return (
    <section className="pv-d-clients pv-d-light pv-d-section" data-tone="light" id="clients">
      <style>{`
        .pv-d-clients { overflow: hidden; }

        .pv-d-gino {
          display: grid; grid-template-columns: minmax(0, 0.86fr) minmax(0, 1fr);
          gap: clamp(28px, 4.2vw, 72px); align-items: start;
        }
        .pv-d-gino-head { margin-bottom: var(--d-step-3); max-width: 18ch; }

        /* One strip, not three tiles. Tight vertical padding and a shared
           baseline keep the figures compact at every width — they never
           become a stack of cards on a phone. */
        .pv-d-results {
          display: grid; grid-template-columns: repeat(3, auto); justify-content: start;
          border-top: 1px solid var(--d-rule); border-bottom: 1px solid var(--d-rule);
          margin-bottom: var(--d-step-4);
        }
        .pv-d-result { padding: var(--d-step-2) clamp(14px, 1.6vw, 26px) var(--d-step-2) 0; }
        .pv-d-result + .pv-d-result {
          border-left: 1px solid var(--d-rule); padding-left: clamp(14px, 1.6vw, 26px);
        }
        .pv-d-result-value {
          display: block; font-family: var(--font-playfair), serif; font-weight: 500;
          font-size: clamp(0.98rem, 1.5vw, 1.5rem); line-height: 1.1;
          color: var(--d-accent-dark); white-space: nowrap;
        }
        .pv-d-result-label {
          display: block; margin-top: 5px; font-family: var(--font-dm-sans), sans-serif;
          font-size: clamp(8px, 0.62vw, 9.5px); font-weight: 500; letter-spacing: 0.18em;
          text-transform: uppercase; color: var(--d-muted); white-space: nowrap;
        }

        .pv-d-gino-quote {
          font-family: var(--font-playfair), serif; font-style: italic; font-weight: 400;
          font-size: clamp(1.18rem, 1.85vw, 1.65rem); line-height: 1.52; color: var(--d-text);
          border-left: 2px solid var(--d-accent); padding-left: var(--d-step-3);
          margin: 0 0 var(--d-step-3); max-width: 42ch;
        }
        .pv-d-written {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300; font-size: 0.9rem;
          line-height: 1.82; color: var(--d-muted); margin: 0 0 var(--d-step-3); max-width: 54ch;
        }
        .pv-d-cite {
          font-style: normal; font-family: var(--font-dm-sans), sans-serif; font-size: 10px;
          font-weight: 600; letter-spacing: 0.24em; text-transform: uppercase; color: var(--d-accent-dark);
        }

        /* Gabriela answers from the other side and rides up into the space
           left beside Gino's closing lines — the diagonal that stops the two
           testimonials reading as two rows. */
        .pv-d-gaby {
          display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 0.52fr);
          gap: clamp(28px, 4.2vw, 72px); align-items: center;
          margin-top: clamp(44px, 5vw, 92px);
        }
        .pv-d-gaby-rule { width: 54px; margin-bottom: var(--d-step-3); }
        .pv-d-gaby-quote {
          font-family: var(--font-playfair), serif; font-style: italic; font-weight: 400;
          font-size: clamp(1.12rem, 1.72vw, 1.5rem); line-height: 1.5; color: var(--d-text);
          margin: 0 0 var(--d-step-3); max-width: 44ch;
        }
        .pv-d-gaby-plate { position: relative; }
        .pv-d-gaby-plate::after {
          content: ""; position: absolute; top: 18px; left: 18px; right: -18px; bottom: -18px;
          border: 1px solid rgba(168,137,94,0.32); pointer-events: none;
        }

        @media (max-width: 960px) {
          .pv-d-gino { grid-template-columns: 1fr; gap: var(--d-step-4); }
          .pv-d-gaby {
            grid-template-columns: 1fr; gap: var(--d-step-4);
            margin-top: var(--d-step-5);
          }
          .pv-d-gaby-text { order: 2; }
          .pv-d-gaby-plate { order: 1; max-width: 300px; }
          .pv-d-gaby-plate::after { top: 12px; left: 12px; right: -12px; bottom: -12px; }
        }
        @media (max-width: 420px) {
          .pv-d-result { padding-right: 10px; }
          .pv-d-result + .pv-d-result { padding-left: 10px; }
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
            <Reveal variant="up" delay={200} className="pv-d-results">
              {GINO.metrics.map((m) => (
                <div key={m.label} className="pv-d-result">
                  <span className="pv-d-result-value">{m.value}</span>
                  <span className="pv-d-result-label">{m.label}</span>
                </div>
              ))}
            </Reveal>
            <Reveal variant="up" delay={280} duration={1100}>
              <blockquote className="pv-d-gino-quote">&ldquo;{GINO.quote}&rdquo;</blockquote>
              <p className="pv-d-written">{GINO.written}</p>
              <cite className="pv-d-cite">
                {GINO.name} &middot; {GINO.descriptor}
              </cite>
            </Reveal>
          </div>
        </div>

        <div className="pv-d-gaby">
          <Reveal variant="up" duration={1150} className="pv-d-gaby-text">
            <div className="pv-d-gaby-rule">
              <DrawRule color="rgba(168,137,94,0.55)" />
            </div>
            <blockquote className="pv-d-gaby-quote">&ldquo;{GABRIELA.quote}&rdquo;</blockquote>
            <p className="pv-d-written">{GABRIELA.written}</p>
            <cite className="pv-d-cite">
              {GABRIELA.name} &middot; {GABRIELA.descriptor}
            </cite>
          </Reveal>

          <Reveal variant="fade" duration={1300} className="pv-d-gaby-plate">
            <ParallaxMedia
              src={GABY_PHOTO.src}
              alt={GABY_PHOTO.alt}
              objectPosition="center 30%"
              aspect="3 / 4"
              shift={10}
              sizes="(max-width: 960px) 300px, 30vw"
            />
          </Reveal>
        </div>
      </div>
    </section>
  )
}
