import Link from "next/link"
import { Reveal, RevealLines, DrawRule } from "../Reveal.client"
import MovementGridD from "./MovementGridD.client"
import { Atmosphere } from "./FlowD"
import { COURSES, COURSES_HEAD, PRICES } from "../c/productionCopy"

// The two courses, set as open editorial spreads.
//
// They used to be two white panels with borders and shadows, which is a
// pricing table however it is styled: the box tells you this is a product
// listing before you have read a word. The boxes are gone. What remains is
// type on the photograph, separated by rules rather than enclosed by them,
// so the warm gym imagery runs behind both courses and carries them into the
// dark bundle underneath.
//
// The two spreads deliberately differ in shape. Training is a text column
// answered by a grid of its own movement footage. Nutrition has no footage
// to show — there is no food or recipe photography anywhere in this project —
// so rather than borrow an unrelated image it is set as a wide spread with
// its features in two columns and the price lifted to the top right. Same
// typography, same rules, same price lockup; different composition.
//
// Every description, feature, price and call to action is unchanged.
export function CoursesD({
  coursePrice,
  movementUrls,
  backdrop,
}: {
  coursePrice: string
  movementUrls: string[]
  backdrop?: string
}) {
  const training = COURSES[0]
  const nutrition = COURSES[1]

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
        .pv-d-course-title { margin: var(--d-step-2) 0 var(--d-step-3); max-width: 24ch; }
        .pv-d-feature {
          display: grid; grid-template-columns: 20px 1fr; gap: 9px;
          padding: clamp(11px, 1.2vw, 15px) 0;
          border-top: 1px solid rgba(26,26,26,0.12);
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
          font-size: 0.875rem; line-height: 1.68; color: var(--d-text);
        }
        .pv-d-feature:last-child { border-bottom: 1px solid rgba(26,26,26,0.12); }
        .pv-d-feature span { color: var(--d-accent-dark); }
        .pv-d-price { display: flex; align-items: baseline; gap: 14px; flex-wrap: wrap; }
        .pv-d-price-now {
          font-family: var(--font-playfair), serif; font-size: clamp(2.6rem, 3.8vw, 3.6rem);
          font-weight: 500; color: var(--d-accent-dark); line-height: 0.86;
        }
        .pv-d-price-was {
          font-family: var(--font-dm-sans), sans-serif; font-size: 0.82rem;
          color: rgba(26,26,26,0.4); text-decoration: line-through;
        }
        .pv-d-price-tag {
          font-family: var(--font-dm-sans), sans-serif; font-size: 8.5px; font-weight: 600;
          letter-spacing: 0.16em; text-transform: uppercase; color: #fff;
          background: var(--d-accent-dark); padding: 4px 9px;
        }
        .pv-d-course-actions { display: flex; align-items: center; gap: clamp(16px, 2vw, 28px); flex-wrap: wrap; }
        .pv-d-course-foot {
          margin: var(--d-step-2) 0 0; font-family: var(--font-dm-sans), sans-serif;
          font-weight: 400; font-size: 11.5px; line-height: 1.7; color: rgba(26,26,26,0.66);
          max-width: 56ch;
        }

        /* ── spread one: training, answered by its own footage ──────── */
        .pv-d-spread-training {
          display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 0.88fr);
          gap: clamp(30px, 4.6vw, 80px); align-items: start;
          margin-top: clamp(40px, 5vw, 80px);
        }

        /* ── spread two: nutrition, wider, price lifted to the head ─── */
        .pv-d-spread-nutrition {
          margin-top: clamp(56px, 7vw, 116px); padding-top: clamp(40px, 5vw, 76px);
          border-top: 1px solid rgba(26,26,26,0.14);
        }
        .pv-d-nutrition-head {
          display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 0.58fr);
          gap: clamp(26px, 4vw, 66px); align-items: end; margin-bottom: clamp(26px, 3.2vw, 44px);
        }
        .pv-d-nutrition-buy { text-align: right; }
        .pv-d-nutrition-buy .pv-d-price { justify-content: flex-end; }
        .pv-d-nutrition-buy .pv-d-course-actions { justify-content: flex-end; margin-top: var(--d-step-3); }
        .pv-d-nutrition-features {
          display: grid; grid-template-columns: 1fr 1fr; column-gap: clamp(26px, 4vw, 66px);
        }

        @media (max-width: 960px) {
          .pv-d-spread-training { grid-template-columns: 1fr; gap: var(--d-step-4); }
          .pv-d-nutrition-head { grid-template-columns: 1fr; gap: var(--d-step-3); align-items: start; }
          .pv-d-nutrition-buy { text-align: left; }
          .pv-d-nutrition-buy .pv-d-price,
          .pv-d-nutrition-buy .pv-d-course-actions { justify-content: flex-start; }
          .pv-d-nutrition-features { grid-template-columns: 1fr; }
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
        <div className="pv-d-spread-training">
          <div>
            <Reveal variant="up" duration={1050}>
              <p className="pv-d-eyebrow">{training.eyebrow}</p>
              <h3 className="pv-d-display pv-d-h3 pv-d-course-title">{training.title}</h3>
            </Reveal>
            <ul style={{ listStyle: "none", margin: `0 0 var(--d-step-4)`, padding: 0 }}>
              {training.points.map((point, i) => (
                <Reveal key={point} className="pv-d-feature" variant="up" delay={i * 70} duration={950}>
                  <span aria-hidden="true">&rarr;</span>
                  {point}
                </Reveal>
              ))}
            </ul>
            <Reveal variant="up" delay={120}>
              <div className="pv-d-price">
                <span className="pv-d-price-was">{PRICES.courseRegular}</span>
                <span className="pv-d-price-now">${coursePrice}</span>
                <span className="pv-d-price-tag">{training.tag}</span>
              </div>
              <div className="pv-d-course-actions" style={{ marginTop: "var(--d-step-3)" }}>
                <Link href={training.buyHref} className="pv-d-btn pv-d-btn--primary">
                  <span>{training.ctaPrimary}</span>
                </Link>
                <Link href={training.exploreHref} className="pv-d-link">
                  {training.ctaSecondary}
                  <span aria-hidden="true">&rarr;</span>
                </Link>
              </div>
              <p className="pv-d-course-foot">{training.footnote}</p>
            </Reveal>
          </div>

          <Reveal variant="fade" duration={1200}>
            <MovementGridD urls={movementUrls} />
          </Reveal>
        </div>

        {/* Nutrition Foundations */}
        <div className="pv-d-spread-nutrition">
          <div className="pv-d-nutrition-head">
            <Reveal variant="up" duration={1050}>
              <p className="pv-d-eyebrow">{nutrition.eyebrow}</p>
              <h3 className="pv-d-display pv-d-h3 pv-d-course-title" style={{ maxWidth: "20ch" }}>
                {nutrition.title}
              </h3>
            </Reveal>
            <Reveal variant="up" delay={120} className="pv-d-nutrition-buy">
              <div className="pv-d-price">
                <span className="pv-d-price-was">{PRICES.nutritionRegular}</span>
                <span className="pv-d-price-now">{PRICES.nutritionNow}</span>
                <span className="pv-d-price-tag">{nutrition.tag}</span>
              </div>
              <div className="pv-d-course-actions">
                <Link href={nutrition.buyHref} className="pv-d-btn pv-d-btn--primary">
                  <span>{nutrition.ctaPrimary}</span>
                </Link>
                <Link href={nutrition.exploreHref} className="pv-d-link">
                  {nutrition.ctaSecondary}
                  <span aria-hidden="true">&rarr;</span>
                </Link>
              </div>
            </Reveal>
          </div>

          <ul className="pv-d-nutrition-features" style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {nutrition.points.map((point, i) => (
              <Reveal key={point} className="pv-d-feature" variant="up" delay={i * 70} duration={950}>
                <span aria-hidden="true">&rarr;</span>
                {point}
              </Reveal>
            ))}
          </ul>
          <Reveal variant="up" delay={100}>
            <p className="pv-d-course-foot">{nutrition.footnote}</p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
