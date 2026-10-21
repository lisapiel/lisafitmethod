import Image from "next/image"
import Link from "next/link"
import { Reveal, RevealLines, DrawRule } from "../Reveal.client"
import MovementGridD from "./MovementGridD.client"
import { Atmosphere } from "./FlowD"
import { COURSES_HEAD } from "../c/productionCopy"
import { NUTRITION, TRAINING } from "./coursesContent"

// The two courses, as a pair of editorial showcases.
//
// What changed from the previous pass: the specification lists are gone.
// Each course now leads with a headline, one sentence of orientation and
// three numbered benefits, which is the amount a reader will actually take
// in before deciding. Body type is up from 14px to roughly 16, the headlines
// have room to sit on one or two lines instead of three, and the price sits
// inside the course rather than beneath it as a separate transaction.
//
// The two alternate: Training is text left with its own movement footage
// right; Nutrition reverses, with the photograph on the left feathered into
// the cream so it belongs to the page rather than sitting on top of it.
//
// Prices, badges, payment terms, CTA labels and destinations are unchanged.
export function CoursesD({
  coursePrice,
  movementUrls,
  backdrop,
}: {
  coursePrice: string
  movementUrls: string[]
  backdrop?: string
}) {
  return (
    <section className="pv-d-courses pv-d-light pv-d-section" data-tone="light" id="courses">
      <style>{`
        .pv-d-courses { overflow: hidden; }
        .pv-d-courses-sub {
          font-family: var(--font-playfair), serif; font-style: italic;
          font-size: clamp(1.05rem, 1.5vw, 1.4rem); color: var(--d-accent-dark);
          margin: var(--d-step-2) auto 0; max-width: 46ch;
        }

        /* ── shared course language ─────────────────────────────────── */
        .pv-d-cshow { display: grid; gap: clamp(32px, 4.8vw, 84px); align-items: center; }
        .pv-d-cshow-title {
          font-family: var(--font-playfair), serif; font-weight: 500;
          font-size: clamp(1.75rem, 2.9vw, 2.75rem); line-height: 1.1;
          letter-spacing: -0.012em; color: var(--d-text);
          margin: var(--d-step-2) 0 var(--d-step-3); max-width: 30ch;
        }
        .pv-d-cshow-intro {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
          font-size: clamp(1rem, 1.2vw, 1.15rem); line-height: 1.72;
          color: var(--d-text); margin: 0 0 var(--d-step-4); max-width: 52ch;
        }
        .pv-d-benefit {
          display: grid; grid-template-columns: 42px 1fr; gap: clamp(12px, 1.4vw, 20px);
          padding: clamp(15px, 1.7vw, 22px) 0; border-top: 1px solid rgba(26,26,26,0.13);
        }
        .pv-d-benefit:last-of-type { border-bottom: 1px solid rgba(26,26,26,0.13); }
        .pv-d-benefit-num {
          font-family: var(--font-playfair), serif; font-size: clamp(0.95rem, 1.2vw, 1.12rem);
          color: var(--d-accent-dark); line-height: 1.5;
        }
        .pv-d-benefit h4 {
          font-family: var(--font-playfair), serif; font-weight: 500;
          font-size: clamp(1.05rem, 1.35vw, 1.25rem); line-height: 1.26;
          color: var(--d-text); margin: 0 0 5px;
        }
        .pv-d-benefit p {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
          font-size: clamp(0.92rem, 1.02vw, 1rem); line-height: 1.68;
          color: var(--d-muted); margin: 0; max-width: 50ch;
        }

        /* Price and buttons live on one line with the course, not stacked
           underneath it as a separate block. */
        .pv-d-cbuy {
          display: flex; align-items: center; gap: clamp(18px, 2.4vw, 36px);
          flex-wrap: wrap; margin-top: var(--d-step-4);
        }
        .pv-d-cprice { display: flex; align-items: baseline; gap: 11px; flex-wrap: wrap; }
        .pv-d-cprice-now {
          font-family: var(--font-playfair), serif; font-size: clamp(2.5rem, 3.4vw, 3.3rem);
          font-weight: 500; color: var(--d-accent-dark); line-height: 0.86;
        }
        .pv-d-cprice-was {
          font-family: var(--font-dm-sans), sans-serif; font-size: 0.85rem;
          color: rgba(26,26,26,0.42); text-decoration: line-through;
        }
        .pv-d-cprice-tag {
          font-family: var(--font-dm-sans), sans-serif; font-size: 8.5px; font-weight: 600;
          letter-spacing: 0.16em; text-transform: uppercase; color: #fff;
          background: var(--d-accent-dark); padding: 4px 9px; align-self: center;
        }
        .pv-d-cactions { display: flex; align-items: center; gap: clamp(14px, 1.8vw, 26px); flex-wrap: wrap; }
        .pv-d-cfoot {
          margin: var(--d-step-3) 0 0; font-family: var(--font-dm-sans), sans-serif;
          font-weight: 400; font-size: 12px; line-height: 1.72;
          color: rgba(26,26,26,0.62); max-width: 54ch;
        }

        /* ── training ───────────────────────────────────────────────── */
        .pv-d-cshow--training {
          grid-template-columns: minmax(0, 1fr) minmax(0, 0.82fr);
          margin-top: clamp(44px, 5.4vw, 86px);
        }

        /* ── nutrition: reversed, photograph feathered into the page ── */
        .pv-d-cshow--nutrition {
          grid-template-columns: minmax(0, 0.9fr) minmax(0, 1fr);
          margin-top: clamp(56px, 7vw, 118px); padding-top: clamp(44px, 5.4vw, 84px);
          border-top: 1px solid rgba(26,26,26,0.13);
        }
        .pv-d-nphoto { position: relative; }
        .pv-d-nphoto-frame {
          position: relative; width: 100%; aspect-ratio: 4 / 3; overflow: hidden;
          /* Radial sizes are radii, not diameters: at 88% the ellipse reached
             well past the box and the edges barely softened. These radii sit
             just outside the box so the frame dissolves into the cream while
             the bowl itself stays at full strength. */
          -webkit-mask-image: radial-gradient(ellipse 64% 72% at 50% 50%, #000 0%, #000 44%, rgba(0,0,0,0.5) 74%, rgba(0,0,0,0) 100%);
          mask-image: radial-gradient(ellipse 64% 72% at 50% 50%, #000 0%, #000 44%, rgba(0,0,0,0.5) 74%, rgba(0,0,0,0) 100%);
        }
        .pv-d-nphoto-frame img { object-fit: cover; object-position: center 56%; }
        /* A warm wash tied to the page's own cream, so the photograph sits in
           the same light as everything around it. */
        .pv-d-nphoto-wash {
          position: absolute; inset: 0; pointer-events: none;
          background: linear-gradient(to bottom, rgba(250,248,245,0.2) 0%, rgba(250,248,245,0.04) 42%, rgba(250,248,245,0.3) 100%);
        }

        @media (max-width: 960px) {
          .pv-d-cshow--training,
          .pv-d-cshow--nutrition { grid-template-columns: 1fr; gap: var(--d-step-4); }
          .pv-d-cshow--nutrition .pv-d-nphoto { order: -1; }
          .pv-d-nphoto-frame { aspect-ratio: 5 / 4; }
        }
      `}</style>

      {backdrop && <Atmosphere src={backdrop} tone="light" opacity={0.5} position="center 45%" scrim="edges" />}

      <div className="pv-d-inner pv-d-above">
        <div className="pv-d-open pv-d-open--centre">
          <p className="pv-d-eyebrow">{COURSES_HEAD.eyebrow}</p>
          <div className="pv-d-open-rule">
            <DrawRule color="rgba(168,137,94,0.55)" origin="center" />
          </div>
          <h2 className="pv-d-display pv-d-h2">
            <RevealLines lines={[COURSES_HEAD.heading]} />
          </h2>
          <Reveal variant="up" delay={140}>
            <p className="pv-d-courses-sub">{COURSES_HEAD.sub}</p>
          </Reveal>
        </div>

        {/* Training Foundations */}
        <div className="pv-d-cshow pv-d-cshow--training">
          <div>
            <Reveal variant="up" duration={1050}>
              <p className="pv-d-eyebrow">{TRAINING.eyebrow}</p>
              <h3 className="pv-d-cshow-title">{TRAINING.heading}</h3>
              <p className="pv-d-cshow-intro">{TRAINING.intro}</p>
            </Reveal>

            {TRAINING.benefits.map((benefit, i) => (
              <Reveal key={benefit.index} className="pv-d-benefit" variant="up" delay={i * 80} duration={1000}>
                <span className="pv-d-benefit-num" aria-hidden="true">
                  {benefit.index}
                </span>
                <div>
                  <h4>{benefit.title}</h4>
                  <p>{benefit.body}</p>
                </div>
              </Reveal>
            ))}

            <Reveal variant="up" delay={120}>
              <div className="pv-d-cbuy">
                <div className="pv-d-cprice">
                  <span className="pv-d-cprice-was">{TRAINING.priceWas}</span>
                  <span className="pv-d-cprice-now">${coursePrice}</span>
                  <span className="pv-d-cprice-tag">{TRAINING.tag}</span>
                </div>
                <div className="pv-d-cactions">
                  <Link href={TRAINING.buyHref} className="pv-d-btn pv-d-btn--primary">
                    <span>{TRAINING.ctaPrimary}</span>
                  </Link>
                  <Link href={TRAINING.exploreHref} className="pv-d-link">
                    {TRAINING.ctaSecondary}
                    <span aria-hidden="true">&rarr;</span>
                  </Link>
                </div>
              </div>
              <p className="pv-d-cfoot">{TRAINING.footnote}</p>
            </Reveal>
          </div>

          <Reveal variant="fade" duration={1250}>
            <MovementGridD urls={movementUrls} />
          </Reveal>
        </div>

        {/* Nutrition Foundations */}
        <div className="pv-d-cshow pv-d-cshow--nutrition">
          <Reveal variant="fade" duration={1300} className="pv-d-nphoto">
            <div className="pv-d-nphoto-frame">
              <Image
                src={NUTRITION.photo}
                alt="A salmon, quinoa and roasted vegetable bowl"
                fill
                sizes="(max-width: 960px) 100vw, 44vw"
              />
              <span className="pv-d-nphoto-wash" aria-hidden="true" />
            </div>
          </Reveal>

          <div>
            <Reveal variant="up" duration={1050}>
              <p className="pv-d-eyebrow">{NUTRITION.eyebrow}</p>
              <h3 className="pv-d-cshow-title">{NUTRITION.heading}</h3>
              <p className="pv-d-cshow-intro">{NUTRITION.intro}</p>
            </Reveal>

            {NUTRITION.benefits.map((benefit, i) => (
              <Reveal key={benefit.index} className="pv-d-benefit" variant="up" delay={i * 80} duration={1000}>
                <span className="pv-d-benefit-num" aria-hidden="true">
                  {benefit.index}
                </span>
                <div>
                  <h4>{benefit.title}</h4>
                  <p>{benefit.body}</p>
                </div>
              </Reveal>
            ))}

            <Reveal variant="up" delay={120}>
              <div className="pv-d-cbuy">
                <div className="pv-d-cprice">
                  <span className="pv-d-cprice-was">{NUTRITION.priceWas}</span>
                  <span className="pv-d-cprice-now">{NUTRITION.priceNow}</span>
                  <span className="pv-d-cprice-tag">{NUTRITION.tag}</span>
                </div>
                <div className="pv-d-cactions">
                  <Link href={NUTRITION.buyHref} className="pv-d-btn pv-d-btn--primary">
                    <span>{NUTRITION.ctaPrimary}</span>
                  </Link>
                  <Link href={NUTRITION.exploreHref} className="pv-d-link">
                    {NUTRITION.ctaSecondary}
                    <span aria-hidden="true">&rarr;</span>
                  </Link>
                </div>
              </div>
              <p className="pv-d-cfoot">{NUTRITION.footnote}</p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
