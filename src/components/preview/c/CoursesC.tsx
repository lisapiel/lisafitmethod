import Link from "next/link"
import { Reveal, RevealLines } from "../Reveal.client"
import MovementReelC from "./MovementReelC.client"
import { COURSES, COURSES_HEAD, PRICES } from "./productionCopy"

// The two courses, as sheets of paper on the light ground.
//
// Copy, bullets, prices, badges and both calls to action are the live
// section verbatim. What changed is the presentation: a real editorial
// price lockup, hairline-separated benefit rows, a gold rule that draws
// across the head of a sheet on hover, and a band of real course footage
// underneath standing in for the "50+ exercise videos" the card promises.
export function CoursesC({ coursePrice, movementUrls }: { coursePrice: string; movementUrls: string[] }) {
  return (
    <section className="pv-c-courses pv-c-light pv-c-section" data-tone="light" id="courses">
      <style>{`
        .pv-c-courses-head { text-align: center; max-width: 740px; margin: 0 auto clamp(40px, 5vw, 70px); }
        .pv-c-courses-sub {
          font-family: var(--font-playfair), serif; font-style: italic;
          font-size: clamp(1.05rem, 1.5vw, 1.4rem); color: var(--c-accent-dark);
          margin: 16px 0 0;
        }
        .pv-c-cards { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(16px, 2vw, 28px); }
        .pv-c-card {
          position: relative; background: #fff; border: 1px solid rgba(26,26,26,0.1);
          padding: clamp(28px, 3.4vw, 50px); display: flex; flex-direction: column;
          transition: transform 760ms cubic-bezier(0.16,1,0.3,1), border-color 760ms ease, box-shadow 760ms ease;
        }
        .pv-c-card::before {
          content: ""; position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: var(--c-accent-dark); transform: scaleX(0); transform-origin: left;
          transition: transform 900ms cubic-bezier(0.16,1,0.3,1);
        }
        .pv-c-card:hover { transform: translateY(-7px); border-color: rgba(26,26,26,0.18); box-shadow: 0 32px 64px -44px rgba(26,26,26,0.5); }
        .pv-c-card:hover::before { transform: scaleX(1); }
        .pv-c-card-title { margin: 14px 0 clamp(22px, 2.4vw, 32px); max-width: 26ch; }
        .pv-c-card-points { list-style: none; margin: 0 0 clamp(26px, 3vw, 38px); padding: 0; flex: 1; }
        .pv-c-card-point {
          display: grid; grid-template-columns: 20px 1fr; gap: 8px; padding: 12px 0;
          border-top: 1px solid rgba(26,26,26,0.08);
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
          font-size: 0.875rem; line-height: 1.66; color: var(--c-muted);
        }
        .pv-c-card-point:last-child { border-bottom: 1px solid rgba(26,26,26,0.08); }
        .pv-c-card-point span { color: var(--c-accent-dark); }
        .pv-c-price { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; margin-bottom: clamp(20px, 2.2vw, 28px); }
        .pv-c-price-now {
          font-family: var(--font-playfair), serif; font-size: clamp(2.5rem, 3.6vw, 3.4rem);
          font-weight: 500; color: var(--c-accent-dark); line-height: 0.88;
        }
        .pv-c-price-was {
          font-family: var(--font-dm-sans), sans-serif; font-size: 0.82rem;
          color: rgba(26,26,26,0.32); text-decoration: line-through;
        }
        .pv-c-price-tag {
          font-family: var(--font-dm-sans), sans-serif; font-size: 8.5px; font-weight: 600;
          letter-spacing: 0.16em; text-transform: uppercase; color: #fff;
          background: var(--c-accent-dark); padding: 4px 9px;
        }
        .pv-c-card-actions { display: flex; flex-direction: column; gap: 9px; }
        .pv-c-card-foot {
          margin: 15px 0 0; font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
          font-size: 11.5px; line-height: 1.7; color: rgba(26,26,26,0.42);
        }
        @media (max-width: 900px) { .pv-c-cards { grid-template-columns: 1fr; } }
      `}</style>

      <div className="pv-c-inner">
        <div className="pv-c-courses-head">
          <p className="pv-c-eyebrow">{COURSES_HEAD.eyebrow}</p>
          <h2 className="pv-c-display pv-c-h2" style={{ marginTop: 18 }}>
            <RevealLines lines={[COURSES_HEAD.heading]} />
          </h2>
          <Reveal variant="up" delay={140}>
            <p className="pv-c-courses-sub">{COURSES_HEAD.sub}</p>
          </Reveal>
        </div>

        <div className="pv-c-cards">
          {COURSES.map((course, i) => {
            const now = course.key === "training" ? `$${coursePrice}` : PRICES.nutritionNow
            const was = course.key === "training" ? PRICES.courseRegular : PRICES.nutritionRegular
            return (
              <Reveal key={course.key} className="pv-c-card" variant="up" delay={i * 140} duration={1100}>
                <p className="pv-c-eyebrow">{course.eyebrow}</p>
                <h3 className="pv-c-display pv-c-h3 pv-c-card-title">{course.title}</h3>
                <ul className="pv-c-card-points">
                  {course.points.map((point) => (
                    <li key={point} className="pv-c-card-point">
                      <span aria-hidden="true">&rarr;</span>
                      {point}
                    </li>
                  ))}
                </ul>
                <div className="pv-c-price">
                  <span className="pv-c-price-was">{was}</span>
                  <span className="pv-c-price-now">{now}</span>
                  <span className="pv-c-price-tag">{course.tag}</span>
                </div>
                <div className="pv-c-card-actions">
                  <Link href={course.buyHref} className="pv-c-btn pv-c-btn--ink">
                    <span>{course.ctaPrimary}</span>
                  </Link>
                  <Link href={course.exploreHref} className="pv-c-btn pv-c-btn--ghost-light">
                    <span>{course.ctaSecondary}</span>
                  </Link>
                </div>
                <p className="pv-c-card-foot">{course.footnote}</p>
              </Reveal>
            )
          })}
        </div>

        <MovementReelC urls={movementUrls} />
      </div>
    </section>
  )
}
