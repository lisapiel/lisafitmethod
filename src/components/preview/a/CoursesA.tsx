import Link from "next/link"
import { Reveal, RevealLines } from "../Reveal.client"
import { COURSES, BUNDLE } from "../previewContent"

// DIRECTION A courses — tear sheets.
//
// Each course is a sheet of white paper laid on the cream page: hairline
// border, no shadow, no rounding, the price set in the display serif at
// editorial scale. On hover the sheet lifts a few pixels and a gold rule
// draws across its head — the only movement, because a price is not
// something to animate at.
export function CoursesA() {
  return (
    <section className="pv-a-courses" id="courses">
      <style>{`
        .pv-a-courses { background: #f7f4ef; padding: clamp(66px, 8vw, 130px) clamp(20px, 5vw, 72px) clamp(72px, 9vw, 140px); }
        .pv-a-courses-head { display: grid; grid-template-columns: 180px 1fr; gap: clamp(24px, 4vw, 64px); align-items: end; margin-bottom: clamp(40px, 5vw, 72px); }
        .pv-a-courses-h2 {
          font-family: var(--font-playfair), serif; font-size: clamp(1.9rem, 4vw, 3.6rem);
          font-weight: 500; line-height: 1.04; color: #121110; margin: 0; max-width: 22ch;
        }
        .pv-a-courses-h2 i { font-style: italic; color: #a8895e; }
        .pv-a-sheets { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(16px, 2vw, 28px); }
        .pv-a-sheet-card {
          position: relative; background: #fffefc; border: 1px solid rgba(18,17,16,0.12);
          padding: clamp(28px, 3.4vw, 50px); display: flex; flex-direction: column;
          transition: transform 760ms cubic-bezier(0.16,1,0.3,1), border-color 760ms ease, box-shadow 760ms ease;
        }
        .pv-a-sheet-card::before {
          content: ""; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: #a8895e;
          transform: scaleX(0); transform-origin: left;
          transition: transform 900ms cubic-bezier(0.16,1,0.3,1);
        }
        .pv-a-sheet-card:hover { transform: translateY(-7px); border-color: rgba(18,17,16,0.2); box-shadow: 0 30px 60px -40px rgba(18,17,16,0.45); }
        .pv-a-sheet-card:hover::before { transform: scaleX(1); }
        .pv-a-sheet-index {
          position: absolute; top: clamp(20px, 2.4vw, 32px); right: clamp(22px, 2.6vw, 36px);
          font-family: var(--font-playfair), serif; font-size: 0.95rem; letter-spacing: 0.2em; color: rgba(18,17,16,0.22);
        }
        .pv-a-sheet-eyebrow {
          font-family: var(--font-dm-sans), sans-serif; font-size: 10px; font-weight: 600;
          letter-spacing: 0.26em; text-transform: uppercase; color: #a8895e; margin: 0 0 14px;
        }
        .pv-a-sheet-title {
          font-family: var(--font-playfair), serif; font-size: clamp(1.3rem, 1.9vw, 1.85rem);
          font-weight: 500; line-height: 1.16; color: #121110; margin: 0 0 clamp(22px, 2.4vw, 32px); max-width: 26ch;
        }
        .pv-a-sheet-points { list-style: none; margin: 0 0 clamp(26px, 3vw, 38px); padding: 0; flex: 1; }
        .pv-a-sheet-point {
          display: grid; grid-template-columns: 22px 1fr; gap: 6px; padding: 11px 0;
          border-top: 1px solid rgba(18,17,16,0.09);
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300; font-size: 0.855rem;
          line-height: 1.62; color: rgba(18,17,16,0.62);
        }
        .pv-a-sheet-point:last-child { border-bottom: 1px solid rgba(18,17,16,0.09); }
        .pv-a-sheet-point span { color: rgba(168,137,94,0.8); }
        .pv-a-sheet-price { display: flex; align-items: baseline; gap: 12px; margin-bottom: clamp(18px, 2vw, 26px); flex-wrap: wrap; }
        .pv-a-sheet-now { font-family: var(--font-playfair), serif; font-size: clamp(2.4rem, 3.4vw, 3.2rem); font-weight: 500; color: #121110; line-height: 0.9; }
        .pv-a-sheet-was { font-family: var(--font-dm-sans), sans-serif; font-size: 0.8rem; color: rgba(18,17,16,0.32); text-decoration: line-through; }
        .pv-a-sheet-tag {
          font-family: var(--font-dm-sans), sans-serif; font-size: 8.5px; font-weight: 600;
          letter-spacing: 0.18em; text-transform: uppercase; color: #fffefc; background: #a8895e; padding: 4px 9px;
        }
        .pv-a-sheet-actions { display: flex; flex-direction: column; gap: 8px; }
        .pv-a-sheet-cta {
          position: relative; overflow: hidden; text-align: center; text-decoration: none;
          font-family: var(--font-dm-sans), sans-serif; font-size: 10.5px; font-weight: 600;
          letter-spacing: 0.2em; text-transform: uppercase; padding: 16px 20px;
          background: #121110; color: #fffefc; transition: color 560ms ease;
        }
        .pv-a-sheet-cta span { position: relative; z-index: 1; }
        .pv-a-sheet-cta::before {
          content: ""; position: absolute; inset: 0; background: #a8895e;
          transform: scaleY(0); transform-origin: bottom; transition: transform 620ms cubic-bezier(0.16,1,0.3,1);
        }
        .pv-a-sheet-cta:hover { color: #121110; }
        .pv-a-sheet-cta:hover::before { transform: scaleY(1); }
        .pv-a-sheet-alt {
          text-align: center; text-decoration: none; font-family: var(--font-dm-sans), sans-serif;
          font-size: 10.5px; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase;
          color: rgba(18,17,16,0.6); padding: 14px 20px; border: 1px solid rgba(18,17,16,0.16);
          transition: color 500ms ease, border-color 500ms ease;
        }
        .pv-a-sheet-alt:hover { color: #121110; border-color: rgba(18,17,16,0.4); }
        .pv-a-sheet-foot {
          margin: 14px 0 0; font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
          font-size: 11px; line-height: 1.65; color: rgba(18,17,16,0.4);
        }
        .pv-a-bundle { background: #121110; padding: clamp(56px, 7vw, 110px) clamp(20px, 5vw, 72px); }
        .pv-a-bundle-inner { max-width: 1180px; margin: 0 auto; display: grid; grid-template-columns: 1.3fr 0.7fr; gap: clamp(32px, 5vw, 80px); align-items: end; }
        .pv-a-bundle-eyebrow {
          font-family: var(--font-dm-sans), sans-serif; font-size: 10px; font-weight: 600;
          letter-spacing: 0.28em; text-transform: uppercase; color: #c8a97e; margin: 0 0 18px;
        }
        .pv-a-bundle-h2 {
          font-family: var(--font-playfair), serif; font-size: clamp(1.8rem, 3.4vw, 3rem);
          font-weight: 500; line-height: 1.06; color: #f7f4ef; margin: 0 0 20px;
        }
        .pv-a-bundle-h2 i { font-style: italic; color: #c8a97e; }
        .pv-a-bundle-body {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300; font-size: 0.92rem;
          line-height: 1.75; color: rgba(247,244,239,0.56); max-width: 58ch; margin: 0;
        }
        .pv-a-bundle-price { text-align: right; }
        .pv-a-bundle-now { font-family: var(--font-playfair), serif; font-size: clamp(3rem, 5.4vw, 4.6rem); font-weight: 500; color: #c8a97e; line-height: 0.9; display: block; }
        .pv-a-bundle-meta { font-family: var(--font-dm-sans), sans-serif; font-size: 11px; letter-spacing: 0.1em; color: rgba(247,244,239,0.34); margin: 14px 0 22px; }
        .pv-a-bundle-cta {
          display: inline-block; text-decoration: none; font-family: var(--font-dm-sans), sans-serif;
          font-size: 10.5px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase;
          color: #121110; background: #c8a97e; padding: 17px 38px;
          transition: background 520ms ease, transform 620ms cubic-bezier(0.16,1,0.3,1);
        }
        .pv-a-bundle-cta:hover { background: #e2c79b; transform: translateY(-3px); }
        @media (max-width: 900px) {
          .pv-a-courses-head { grid-template-columns: 1fr; gap: 16px; align-items: start; }
          .pv-a-sheets { grid-template-columns: 1fr; }
          .pv-a-bundle-inner { grid-template-columns: 1fr; gap: 32px; }
          .pv-a-bundle-price { text-align: left; }
        }
      `}</style>

      <div className="pv-a-courses-head">
        <p className="pv-a-runhead">
          03 — The Courses
          <span>Self-guided</span>
        </p>
        <h2 className="pv-a-courses-h2">
          <RevealLines lines={["Train at your own pace,", <i key="i">on a real structure.</i>]} stagger={110} />
        </h2>
      </div>

      <div className="pv-a-sheets">
        {COURSES.map((c, i) => (
          <Reveal key={c.key} className="pv-a-sheet-card" variant="up" delay={i * 140} duration={1100}>
            <span className="pv-a-sheet-index" aria-hidden="true">
              {c.index}
            </span>
            <p className="pv-a-sheet-eyebrow">{c.eyebrow}</p>
            <h3 className="pv-a-sheet-title">{c.title}</h3>
            <ul className="pv-a-sheet-points">
              {c.points.map((p) => (
                <li key={p} className="pv-a-sheet-point">
                  <span aria-hidden="true">&#8212;</span>
                  {p}
                </li>
              ))}
            </ul>
            <div className="pv-a-sheet-price">
              <span className="pv-a-sheet-now">{c.now}</span>
              <span className="pv-a-sheet-was">{c.was}</span>
              <span className="pv-a-sheet-tag">Limited time</span>
            </div>
            <div className="pv-a-sheet-actions">
              <Link href={c.buyHref} className="pv-a-sheet-cta">
                <span>Get instant access</span>
              </Link>
              <Link href={c.exploreHref} className="pv-a-sheet-alt">
                Explore the course
              </Link>
            </div>
            <p className="pv-a-sheet-foot">{c.footnote}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

export function BundleA() {
  return (
    <section className="pv-a-bundle" aria-label="Complete Foundations Bundle">
      <div className="pv-a-bundle-inner">
        <div>
          <p className="pv-a-bundle-eyebrow">{BUNDLE.eyebrow} &#9671; Best value</p>
          <h2 className="pv-a-bundle-h2">
            <RevealLines lines={["Train right.", <i key="i">Eat to match.</i>]} stagger={110} />
          </h2>
          <Reveal variant="up" delay={160}>
            <p className="pv-a-bundle-body">{BUNDLE.body}</p>
          </Reveal>
        </div>
        <Reveal variant="up" delay={240} className="pv-a-bundle-price">
          <span className="pv-a-bundle-now">{BUNDLE.now}</span>
          <p className="pv-a-bundle-meta">
            {BUNDLE.was} separately &#183; you save {BUNDLE.saves}
          </p>
          <Link href={BUNDLE.href} className="pv-a-bundle-cta">
            Get both courses
          </Link>
        </Reveal>
      </div>
    </section>
  )
}
