import Link from "next/link"
import { Reveal, RevealLines } from "../Reveal.client"
import { CLOSING, FAQS, NAV_LINKS, PREVIEW_PRICES } from "../previewContent"

// DIRECTION B questions — set as a two-column reference page rather than an
// accordion. Everything is already visible, which is itself a tone: nothing
// is being withheld to manufacture a click.
export function FaqB() {
  return (
    <section className="pv-b-faq" id="faq">
      <style>{`
        .pv-b-faq { background: #0b0b0d; padding: clamp(72px, 9vw, 140px) clamp(20px, 5vw, 72px); }
        .pv-b-faq-head { max-width: 1180px; margin: 0 auto clamp(38px, 4.4vw, 62px); display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; flex-wrap: wrap; }
        .pv-b-faq-h2 { font-size: clamp(1.9rem, 4.4vw, 3.6rem); margin-top: clamp(18px, 2.2vw, 30px); }
        .pv-b-faq-grid { max-width: 1180px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: rgba(201,169,110,0.14); }
        .pv-b-faq-cell { background: #0b0b0d; padding: clamp(26px, 3.2vw, 44px); }
        .pv-b-faq-q { font-family: var(--font-cormorant), serif; font-weight: 400; font-size: clamp(1.15rem, 1.7vw, 1.5rem); line-height: 1.22; color: #f0e6d3; margin: 0 0 14px; }
        .pv-b-faq-a { font-size: 0.82rem; max-width: 56ch; }
        .pv-b-faq-more {
          display: inline-flex; align-items: center; gap: 10px;
          font-family: var(--font-montserrat), sans-serif; font-size: 10px; font-weight: 600;
          letter-spacing: 0.26em; text-transform: uppercase; color: #c9a96e; text-decoration: none;
          border-bottom: 1px solid rgba(201,169,110,0.4); padding-bottom: 6px; white-space: nowrap;
          transition: gap 520ms cubic-bezier(0.16,1,0.3,1), color 420ms ease;
        }
        .pv-b-faq-more:hover { gap: 20px; color: #e8c98a; }
        .pv-b-close { background: #08080a; padding: clamp(100px, 13vw, 200px) clamp(20px, 5vw, 72px); position: relative; overflow: hidden; text-align: center; }
        .pv-b-close-glow {
          position: absolute; top: 50%; left: 50%; width: 1100px; height: 1100px; max-width: 170vw;
          transform: translate(-50%, -50%);
          background: radial-gradient(circle, rgba(201,169,110,0.13) 0%, transparent 66%); pointer-events: none;
        }
        .pv-b-close-inner { position: relative; max-width: 1000px; margin: 0 auto; }
        .pv-b-close-h2 { font-size: clamp(2.1rem, 5.6vw, 5rem); margin: clamp(24px, 3vw, 40px) auto clamp(26px, 3vw, 38px); max-width: 22ch; }
        .pv-b-close-body { max-width: 54ch; margin: 0 auto clamp(34px, 4vw, 52px); }
        .pv-b-close-ctas { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
        .pv-b-close-note { margin: clamp(28px, 3vw, 42px) auto 0; max-width: 46ch; font-family: var(--font-montserrat), sans-serif; font-weight: 300; font-size: 11px; line-height: 1.85; color: rgba(240,230,211,0.3); }
        .pv-b-footer { background: #0b0b0d; padding: clamp(44px, 5vw, 76px) clamp(20px, 5vw, 72px); border-top: 1px solid rgba(201,169,110,0.14); }
        .pv-b-footer-top { max-width: 1180px; margin: 0 auto; display: flex; justify-content: space-between; align-items: flex-end; gap: 30px; flex-wrap: wrap; padding-bottom: clamp(26px, 3vw, 40px); border-bottom: 1px solid rgba(240,230,211,0.08); }
        .pv-b-footer-mark { font-family: var(--font-cormorant), serif; font-weight: 300; font-size: clamp(1.5rem, 2.8vw, 2.4rem); letter-spacing: 0.12em; color: #f0e6d3; margin: 0; }
        .pv-b-footer-tag { font-family: var(--font-montserrat), sans-serif; font-weight: 300; font-size: 0.78rem; line-height: 1.8; color: rgba(240,230,211,0.42); max-width: 42ch; margin: 12px 0 0; }
        .pv-b-footer-links { display: flex; gap: clamp(16px, 2vw, 32px); flex-wrap: wrap; }
        .pv-b-footer-link { font-family: var(--font-montserrat), sans-serif; font-size: 9.5px; font-weight: 600; letter-spacing: 0.24em; text-transform: uppercase; color: rgba(240,230,211,0.5); text-decoration: none; transition: color 420ms ease; }
        .pv-b-footer-link:hover { color: #c9a96e; }
        .pv-b-footer-base { max-width: 1180px; margin: 0 auto; padding-top: 20px; display: flex; justify-content: space-between; gap: 18px; flex-wrap: wrap; font-family: var(--font-montserrat), sans-serif; font-size: 9.5px; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(240,230,211,0.26); }
        @media (max-width: 900px) { .pv-b-faq-grid { grid-template-columns: 1fr; } }
      `}</style>

      <div className="pv-b-faq-head">
        <div>
          <p className="pv-b-label">06 &#8212; Questions</p>
          <h2 className="pv-b-display pv-b-faq-h2">
            <RevealLines lines={["Good questions.", <i key="i">Straight answers.</i>]} stagger={130} />
          </h2>
        </div>
        <Link href="/faq" className="pv-b-faq-more">
          See all questions
          <span aria-hidden="true">&#8594;</span>
        </Link>
      </div>

      <div className="pv-b-faq-grid">
        {FAQS.map((f, i) => (
          <Reveal key={f.q} className="pv-b-faq-cell" variant="up" delay={i * 90} duration={1050}>
            <h3 className="pv-b-faq-q">{f.q}</h3>
            <p className="pv-b-body pv-b-faq-a">{f.a}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

export function ClosingB() {
  return (
    <section className="pv-b-close">
      <div className="pv-b-close-glow" aria-hidden="true" />
      <div className="pv-b-close-inner">
        <p className="pv-b-label">{CLOSING.eyebrow}</p>
        <h2 className="pv-b-display pv-b-close-h2">
          <RevealLines lines={[CLOSING.title, <i key="i">{CLOSING.titleEm}</i>]} stagger={150} />
        </h2>
        <Reveal variant="up" delay={200}>
          <p className="pv-b-body pv-b-close-body">{CLOSING.body}</p>
          <div className="pv-b-close-ctas">
            <Link href="/coaching#apply" className="pv-b-cta">
              Apply for coaching
            </Link>
            <Link href="/courses" className="pv-b-cta-ghost">
              Explore the courses
            </Link>
          </div>
          <p className="pv-b-close-note">
            Coaching from {PREVIEW_PRICES.coachingFrom}. The roster stays intentionally small, so every application is
            reviewed personally within 48 hours.
          </p>
        </Reveal>
      </div>
    </section>
  )
}

export function FooterB() {
  return (
    <footer className="pv-b-footer">
      <div className="pv-b-footer-top">
        <div>
          <p className="pv-b-footer-mark">Lisa Fit Method</p>
          <p className="pv-b-footer-tag">
            Strength training built on movement quality, real structure, smart progression, and a body that lasts.
          </p>
        </div>
        <div className="pv-b-footer-links">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="pv-b-footer-link">
              {l.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="pv-b-footer-base">
        <span>Direction B &#183; Nocturne &#183; Design prototype</span>
        <span>Miami, FL &#183; Online worldwide</span>
      </div>
    </footer>
  )
}
