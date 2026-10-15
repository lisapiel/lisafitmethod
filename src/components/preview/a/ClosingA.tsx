import Link from "next/link"
import { Reveal, RevealLines } from "../Reveal.client"
import { CLOSING, NAV_LINKS, PREVIEW_PRICES } from "../previewContent"

// DIRECTION A close — one line, set large, on ink.
//
// No countdown, no scarcity, no second ask. The invitation is the typography.
export function ClosingA() {
  return (
    <section className="pv-a-close">
      <style>{`
        .pv-a-close { background: #121110; padding: clamp(90px, 12vw, 190px) clamp(20px, 5vw, 72px); position: relative; overflow: hidden; }
        .pv-a-close-glow {
          position: absolute; top: 50%; left: 50%; width: 900px; height: 900px; max-width: 160vw;
          transform: translate(-50%, -50%);
          background: radial-gradient(circle, rgba(168,137,94,0.12) 0%, transparent 68%);
          pointer-events: none;
        }
        .pv-a-close-inner { position: relative; max-width: 1100px; margin: 0 auto; text-align: center; }
        .pv-a-close-eyebrow {
          font-family: var(--font-dm-sans), sans-serif; font-size: 10px; font-weight: 600;
          letter-spacing: 0.3em; text-transform: uppercase; color: #c8a97e; margin: 0 0 clamp(26px, 3vw, 40px);
        }
        .pv-a-close-h2 {
          font-family: var(--font-playfair), serif; font-size: clamp(2.1rem, 5vw, 4.4rem);
          font-weight: 500; line-height: 1.04; color: #f7f4ef; margin: 0 auto clamp(26px, 3vw, 38px); max-width: 22ch;
        }
        .pv-a-close-h2 i { font-style: italic; color: #c8a97e; }
        .pv-a-close-body {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300; font-size: clamp(0.9rem, 1.1vw, 1.05rem);
          line-height: 1.8; color: rgba(247,244,239,0.5); max-width: 56ch; margin: 0 auto clamp(34px, 4vw, 52px);
        }
        .pv-a-close-ctas { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
        .pv-a-close-primary {
          position: relative; overflow: hidden; display: inline-block; text-decoration: none;
          font-family: var(--font-dm-sans), sans-serif; font-size: 11px; font-weight: 600;
          letter-spacing: 0.22em; text-transform: uppercase; color: #121110; background: #c8a97e;
          padding: 19px 48px; transition: background 520ms ease, transform 640ms cubic-bezier(0.16,1,0.3,1);
        }
        .pv-a-close-primary:hover { background: #e2c79b; transform: translateY(-3px); }
        .pv-a-close-ghost {
          display: inline-block; text-decoration: none;
          font-family: var(--font-dm-sans), sans-serif; font-size: 11px; font-weight: 600;
          letter-spacing: 0.22em; text-transform: uppercase; color: rgba(247,244,239,0.8);
          padding: 19px 48px; border: 1px solid rgba(247,244,239,0.22);
          transition: border-color 520ms ease, color 520ms ease;
        }
        .pv-a-close-ghost:hover { border-color: #c8a97e; color: #c8a97e; }
        .pv-a-close-note {
          margin: clamp(28px, 3vw, 40px) auto 0; max-width: 46ch;
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300; font-size: 11.5px;
          line-height: 1.8; color: rgba(247,244,239,0.3);
        }
      `}</style>
      <div className="pv-a-close-glow" aria-hidden="true" />
      <div className="pv-a-close-inner">
        <p className="pv-a-close-eyebrow">{CLOSING.eyebrow}</p>
        <h2 className="pv-a-close-h2">
          <RevealLines lines={[CLOSING.title, <i key="i">{CLOSING.titleEm}</i>]} stagger={130} />
        </h2>
        <Reveal variant="up" delay={200}>
          <p className="pv-a-close-body">{CLOSING.body}</p>
          <div className="pv-a-close-ctas">
            <Link href="/coaching#apply" className="pv-a-close-primary">
              Apply for coaching
            </Link>
            <Link href="/courses" className="pv-a-close-ghost">
              Explore the courses
            </Link>
          </div>
          <p className="pv-a-close-note">
            Coaching from {PREVIEW_PRICES.coachingFrom}. The roster stays intentionally small, so every application is
            reviewed personally within 48 hours.
          </p>
        </Reveal>
      </div>
    </section>
  )
}

export function FooterA() {
  return (
    <footer className="pv-a-footer">
      <style>{`
        .pv-a-footer { background: #efe9e1; padding: clamp(44px, 5vw, 72px) clamp(20px, 5vw, 72px); }
        .pv-a-footer-top { display: flex; justify-content: space-between; align-items: flex-end; gap: 28px; flex-wrap: wrap; padding-bottom: clamp(26px, 3vw, 40px); border-bottom: 1px solid rgba(18,17,16,0.14); }
        .pv-a-footer-mark {
          font-family: var(--font-playfair), serif; font-size: clamp(1.4rem, 2.6vw, 2.2rem);
          font-weight: 500; letter-spacing: 0.08em; color: #121110; margin: 0;
        }
        .pv-a-footer-tag {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300; font-size: 0.82rem;
          line-height: 1.7; color: rgba(18,17,16,0.5); max-width: 42ch; margin: 10px 0 0;
        }
        .pv-a-footer-links { display: flex; gap: clamp(16px, 2vw, 30px); flex-wrap: wrap; }
        .pv-a-footer-link {
          font-family: var(--font-dm-sans), sans-serif; font-size: 10px; font-weight: 600;
          letter-spacing: 0.2em; text-transform: uppercase; color: rgba(18,17,16,0.6); text-decoration: none;
          transition: color 420ms ease;
        }
        .pv-a-footer-link:hover { color: #a8895e; }
        .pv-a-footer-base {
          padding-top: 20px; display: flex; justify-content: space-between; gap: 18px; flex-wrap: wrap;
          font-family: var(--font-dm-sans), sans-serif; font-size: 10px; letter-spacing: 0.14em;
          text-transform: uppercase; color: rgba(18,17,16,0.35);
        }
      `}</style>
      <div className="pv-a-footer-top">
        <div>
          <p className="pv-a-footer-mark">Lisa Fit Method</p>
          <p className="pv-a-footer-tag">
            Strength training built on movement quality, real structure, smart progression, and a body that lasts.
          </p>
        </div>
        <div className="pv-a-footer-links">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="pv-a-footer-link">
              {l.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="pv-a-footer-base">
        <span>Direction A &#183; Atelier &#183; Design prototype</span>
        <span>Miami, FL &#183; Online worldwide</span>
      </div>
    </footer>
  )
}
