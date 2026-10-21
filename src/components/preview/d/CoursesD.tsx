import Link from "next/link"
import { Reveal, RevealLines, DrawRule } from "../Reveal.client"
import MovementReelD from "./MovementReelD.client"
import { Atmosphere } from "./FlowD"
import { COURSES, COURSES_HEAD, PRICES } from "../c/productionCopy"

// The two courses.
//
// Copy, bullets, prices, badges and both calls to action are the live
// section verbatim. The work is in the lockup: a single price composition
// shared by both cards, benefit rows separated by hairlines rather than
// bullets, and a strip of real course footage underneath so the "50+
// exercise videos" line has something to stand on.
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
        .pv-d-courses-sub {
          font-family: var(--font-playfair), serif; font-style: italic;
          font-size: clamp(1.05rem, 1.5vw, 1.4rem); color: var(--d-accent-dark);
          margin: var(--d-step-2) auto 0; max-width: 46ch;
        }
        .pv-d-cards { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(16px, 2vw, 28px); }
        .pv-d-card {
          position: relative; background: #fff; border: 1px solid var(--d-rule);
          padding: var(--d-step-5) var(--d-step-4); display: flex; flex-direction: column;
          transition: transform 760ms cubic-bezier(0.16,1,0.3,1), border-color 760ms ease, box-shadow 760ms ease;
        }
        .pv-d-card::before {
          content: ""; position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: var(--d-accent-dark); transform: scaleX(0); transform-origin: left;
          transition: transform 900ms cubic-bezier(0.16,1,0.3,1);
        }
        .pv-d-card:hover { transform: translateY(-7px); border-color: rgba(26,26,26,0.2); box-shadow: 0 34px 66px -46px rgba(26,26,26,0.5); }
        .pv-d-card:hover::before { transform: scaleX(1); }
        .pv-d-card-title { margin: var(--d-step-2) 0 var(--d-step-3); max-width: 26ch; }
        .pv-d-card-points { list-style: none; margin: 0 0 var(--d-step-4); padding: 0; flex: 1; }
        .pv-d-card-point {
          display: grid; grid-template-columns: 20px 1fr; gap: 8px; padding: 12px 0;
          border-top: 1px solid rgba(26,26,26,0.08);
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
          font-size: 0.875rem; line-height: 1.66; color: var(--d-muted);
        }
        .pv-d-card-point:last-child { border-bottom: 1px solid rgba(26,26,26,0.08); }
        .pv-d-card-point span { color: var(--d-accent-dark); }
        .pv-d-price { display: flex; align-items: baseline; gap: 14px; flex-wrap: wrap; margin-bottom: var(--d-step-3); }
        .pv-d-price-now {
          font-family: var(--font-playfair), serif; font-size: clamp(2.5rem, 3.6vw, 3.4rem);
          font-weight: 500; color: var(--d-accent-dark); line-height: 0.88;
        }
        .pv-d-price-was {
          font-family: var(--font-dm-sans), sans-serif; font-size: 0.82rem;
          color: rgba(26,26,26,0.32); text-decoration: line-through;
        }
        .pv-d-price-tag {
          font-family: var(--font-dm-sans), sans-serif; font-size: 8.5px; font-weight: 600;
          letter-spacing: 0.16em; text-transform: uppercase; color: #fff;
          background: var(--d-accent-dark); padding: 4px 9px;
        }
        .pv-d-card-actions { display: flex; flex-direction: column; gap: 9px; }
        .pv-d-card-foot {
          margin: var(--d-step-2) 0 0; font-family: var(--font-dm-sans), sans-serif;
          font-weight: 300; font-size: 11.5px; line-height: 1.7; color: rgba(26,26,26,0.42);
        }
        @media (max-width: 900px) { .pv-d-cards { grid-template-columns: 1fr; } }
      `}</style>

      {backdrop && <Atmosphere src={backdrop} tone="light" opacity={0.2} position="center 40%" />}
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

        <div className="pv-d-cards">
          {COURSES.map((course, i) => {
            const now = course.key === "training" ? `$${coursePrice}` : PRICES.nutritionNow
            const was = course.key === "training" ? PRICES.courseRegular : PRICES.nutritionRegular
            return (
              <Reveal key={course.key} className="pv-d-card" variant="up" delay={i * 140} duration={1100}>
                <p className="pv-d-eyebrow">{course.eyebrow}</p>
                <h3 className="pv-d-display pv-d-h3 pv-d-card-title">{course.title}</h3>
                <ul className="pv-d-card-points">
                  {course.points.map((point) => (
                    <li key={point} className="pv-d-card-point">
                      <span aria-hidden="true">&rarr;</span>
                      {point}
                    </li>
                  ))}
                </ul>
                <div className="pv-d-price">
                  <span className="pv-d-price-was">{was}</span>
                  <span className="pv-d-price-now">{now}</span>
                  <span className="pv-d-price-tag">{course.tag}</span>
                </div>
                <div className="pv-d-card-actions">
                  <Link href={course.buyHref} className="pv-d-btn pv-d-btn--primary">
                    <span>{course.ctaPrimary}</span>
                  </Link>
                  <Link href={course.exploreHref} className="pv-d-btn pv-d-btn--outline">
                    <span>{course.ctaSecondary}</span>
                  </Link>
                </div>
                <p className="pv-d-card-foot">{course.footnote}</p>
              </Reveal>
            )
          })}
        </div>

        <MovementReelD urls={movementUrls} />
      </div>
    </section>
  )
}
