import Link from "next/link"
import { Reveal, RevealLines } from "../Reveal.client"
import { COURSES, BUNDLE } from "../previewContent"

// DIRECTION B courses — lit panels.
//
// Two tall dark panels separated by a single hairline. Hovering one lifts a
// gold wash behind the price and draws the hairline bright; the other does
// nothing, so the attention is unambiguous.
export function CoursesB() {
  return (
    <section className="pv-b-courses" id="courses">
      <style>{`
        .pv-b-courses { background: #0b0b0d; padding: clamp(76px, 10vw, 150px) clamp(20px, 5vw, 72px); }
        .pv-b-courses-head { max-width: 1180px; margin: 0 auto clamp(42px, 5vw, 76px); }
        .pv-b-courses-h2 { font-size: clamp(1.9rem, 4.6vw, 4rem); max-width: 22ch; margin-top: clamp(18px, 2.2vw, 30px); }
        .pv-b-panels { max-width: 1180px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: rgba(201,169,110,0.16); }
        .pv-b-panel {
          position: relative; overflow: hidden; background: #08080a;
          padding: clamp(30px, 3.6vw, 56px); display: flex; flex-direction: column;
          transition: background 800ms ease;
        }
        .pv-b-panel::before {
          content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 60%;
          background: radial-gradient(120% 100% at 50% 100%, rgba(201,169,110,0.16) 0%, transparent 70%);
          opacity: 0; transition: opacity 900ms cubic-bezier(0.16,1,0.3,1); pointer-events: none;
        }
        .pv-b-panel:hover { background: #0d0d10; }
        .pv-b-panel:hover::before { opacity: 1; }
        .pv-b-panel-index {
          position: absolute; top: clamp(24px, 2.8vw, 36px); right: clamp(24px, 2.8vw, 38px);
          font-family: var(--font-cormorant), serif; font-size: 0.9rem; letter-spacing: 0.3em; color: rgba(201,169,110,0.4);
        }
        .pv-b-panel-title {
          font-family: var(--font-cormorant), serif; font-weight: 300;
          font-size: clamp(1.5rem, 2.3vw, 2.2rem); line-height: 1.14; color: #f0e6d3;
          margin: 16px 0 clamp(26px, 3vw, 38px); max-width: 24ch; position: relative;
        }
        .pv-b-panel-points { list-style: none; margin: 0 0 clamp(30px, 3.4vw, 44px); padding: 0; flex: 1; position: relative; }
        .pv-b-panel-point {
          display: grid; grid-template-columns: 18px 1fr; gap: 8px; padding: 12px 0;
          border-top: 1px solid rgba(240,230,211,0.08);
          font-family: var(--font-montserrat), sans-serif; font-weight: 300; font-size: 0.82rem;
          line-height: 1.68; color: rgba(240,230,211,0.56);
        }
        .pv-b-panel-point:last-child { border-bottom: 1px solid rgba(240,230,211,0.08); }
        .pv-b-panel-point span { color: rgba(201,169,110,0.7); }
        .pv-b-panel-price { position: relative; display: flex; align-items: baseline; gap: 14px; flex-wrap: wrap; margin-bottom: clamp(20px, 2.4vw, 30px); }
        .pv-b-panel-now { font-family: var(--font-cormorant), serif; font-weight: 300; font-size: clamp(2.8rem, 4.4vw, 4rem); color: #c9a96e; line-height: 0.85; }
        .pv-b-panel-was { font-family: var(--font-montserrat), sans-serif; font-size: 0.78rem; color: rgba(240,230,211,0.3); text-decoration: line-through; }
        .pv-b-panel-tag {
          font-family: var(--font-montserrat), sans-serif; font-size: 8px; font-weight: 600;
          letter-spacing: 0.2em; text-transform: uppercase; color: #08080a; background: rgba(201,169,110,0.85); padding: 4px 9px;
        }
        .pv-b-panel-actions { position: relative; display: flex; flex-direction: column; gap: 9px; }
        .pv-b-panel-alt {
          text-align: center; text-decoration: none; font-family: var(--font-montserrat), sans-serif;
          font-size: 9.5px; font-weight: 600; letter-spacing: 0.24em; text-transform: uppercase;
          color: rgba(240,230,211,0.6); padding: 15px 20px; border: 1px solid rgba(240,230,211,0.14);
          transition: color 520ms ease, border-color 520ms ease;
        }
        .pv-b-panel-alt:hover { color: #f0e6d3; border-color: rgba(201,169,110,0.5); }
        .pv-b-panel-foot {
          position: relative; margin: 16px 0 0; font-family: var(--font-montserrat), sans-serif;
          font-weight: 300; font-size: 10.5px; line-height: 1.7; color: rgba(240,230,211,0.32);
        }
        .pv-b-panel-cta-wrap { position: relative; }
        .pv-b-bundle { background: #08080a; padding: clamp(60px, 8vw, 120px) clamp(20px, 5vw, 72px); border-top: 1px solid rgba(201,169,110,0.14); position: relative; overflow: hidden; }
        .pv-b-bundle-glow {
          position: absolute; left: 50%; bottom: -40%; width: 1100px; height: 1100px; max-width: 170vw;
          transform: translateX(-50%);
          background: radial-gradient(circle, rgba(201,169,110,0.11) 0%, transparent 66%); pointer-events: none;
        }
        .pv-b-bundle-inner { position: relative; max-width: 1180px; margin: 0 auto; text-align: center; }
        .pv-b-bundle-h2 { font-size: clamp(1.9rem, 4.4vw, 3.6rem); margin: clamp(18px, 2.2vw, 30px) auto clamp(20px, 2.4vw, 30px); max-width: 20ch; }
        .pv-b-bundle-body { max-width: 56ch; margin: 0 auto clamp(30px, 3.4vw, 44px); }
        .pv-b-bundle-price { display: flex; align-items: baseline; gap: 16px; justify-content: center; flex-wrap: wrap; margin-bottom: 10px; }
        .pv-b-bundle-now { font-family: var(--font-cormorant), serif; font-weight: 300; font-size: clamp(3.4rem, 6vw, 5.4rem); color: #c9a96e; line-height: 0.85; }
        .pv-b-bundle-was { font-family: var(--font-montserrat), sans-serif; font-size: 0.85rem; color: rgba(240,230,211,0.28); text-decoration: line-through; }
        .pv-b-bundle-saves { font-family: var(--font-montserrat), sans-serif; font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase; color: rgba(240,230,211,0.38); margin: 0 0 clamp(28px, 3vw, 40px); }
        @media (max-width: 900px) { .pv-b-panels { grid-template-columns: 1fr; } }
      `}</style>

      <div className="pv-b-courses-head">
        <p className="pv-b-label">03 &#8212; The courses</p>
        <h2 className="pv-b-display pv-b-courses-h2">
          <RevealLines lines={["Train at your own pace,", <i key="i">on a real structure.</i>]} stagger={130} />
        </h2>
      </div>

      <div className="pv-b-panels">
        {COURSES.map((c, i) => (
          <Reveal key={c.key} className="pv-b-panel" variant="up" delay={i * 150} duration={1150}>
            <span className="pv-b-panel-index" aria-hidden="true">
              {c.index}
            </span>
            <p className="pv-b-label" style={{ position: "relative" }}>
              {c.eyebrow}
            </p>
            <h3 className="pv-b-panel-title">{c.title}</h3>
            <ul className="pv-b-panel-points">
              {c.points.map((p) => (
                <li key={p} className="pv-b-panel-point">
                  <span aria-hidden="true">&#9671;</span>
                  {p}
                </li>
              ))}
            </ul>
            <div className="pv-b-panel-price">
              <span className="pv-b-panel-now">{c.now}</span>
              <span className="pv-b-panel-was">{c.was}</span>
              <span className="pv-b-panel-tag">Limited time</span>
            </div>
            <div className="pv-b-panel-actions">
              <div className="pv-b-panel-cta-wrap">
                <Link href={c.buyHref} className="pv-b-cta" style={{ display: "block", textAlign: "center" }}>
                  Get instant access
                </Link>
              </div>
              <Link href={c.exploreHref} className="pv-b-panel-alt">
                Explore the course
              </Link>
            </div>
            <p className="pv-b-panel-foot">{c.footnote}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

export function BundleB() {
  return (
    <section className="pv-b-bundle" aria-label="Complete Foundations Bundle">
      <div className="pv-b-bundle-glow" aria-hidden="true" />
      <div className="pv-b-bundle-inner">
        <p className="pv-b-label">
          {BUNDLE.eyebrow} &#9671; Best value
        </p>
        <h2 className="pv-b-display pv-b-bundle-h2">
          <RevealLines lines={["Train right.", <i key="i">Eat to match.</i>]} stagger={130} />
        </h2>
        <Reveal variant="up" delay={160}>
          <p className="pv-b-body pv-b-bundle-body">{BUNDLE.body}</p>
          <div className="pv-b-bundle-price">
            <span className="pv-b-bundle-now">{BUNDLE.now}</span>
            <span className="pv-b-bundle-was">{BUNDLE.was}</span>
          </div>
          <p className="pv-b-bundle-saves">You save {BUNDLE.saves} &#183; one-time payment</p>
          <Link href={BUNDLE.href} className="pv-b-cta">
            Get both courses
          </Link>
        </Reveal>
      </div>
    </section>
  )
}
