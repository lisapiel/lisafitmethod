import Link from "next/link"
import { Reveal, RevealLines } from "../Reveal.client"
import { FINAL, FOOTER } from "./productionCopy"

// The closing ask, on black — the page's last cinematic beat.
// Headline, body, button and both notes beneath are the live section verbatim.
export function FinalCtaC() {
  return (
    <section className="pv-c-final pv-c-dark pv-c-section" data-tone="dark">
      <style>{`
        .pv-c-final { text-align: center; }
        .pv-c-final-glow {
          position: absolute; top: 50%; left: 50%; width: 900px; height: 900px; max-width: 160vw;
          transform: translate(-50%, -50%); pointer-events: none;
          background: radial-gradient(circle, rgba(200,169,126,0.12) 0%, transparent 70%);
        }
        .pv-c-final-inner { position: relative; max-width: 1000px; margin: 0 auto; }
        .pv-c-final-h2 { max-width: 22ch; margin: clamp(22px, 2.6vw, 34px) auto clamp(24px, 2.8vw, 36px); }
        .pv-c-final-body { max-width: 56ch; margin: 0 auto clamp(32px, 3.8vw, 50px); }
        .pv-c-final-note {
          font-family: var(--font-dm-sans), sans-serif; font-size: 12.5px; font-weight: 300;
          line-height: 1.75; color: rgba(245,242,238,0.3); margin: 16px auto 0; max-width: 48ch;
        }
        .pv-c-final-alt {
          margin: clamp(26px, 3vw, 38px) auto 0; font-family: var(--font-dm-sans), sans-serif;
          font-size: 12.5px; color: rgba(245,242,238,0.26);
        }
        .pv-c-final-alt a {
          color: rgba(200,169,126,0.7); text-decoration: underline; text-underline-offset: 3px;
          transition: color 420ms ease;
        }
        .pv-c-final-alt a:hover { color: var(--c-accent); }
      `}</style>

      <div className="pv-c-final-glow" aria-hidden="true" />
      <div className="pv-c-final-inner">
        <p className="pv-c-eyebrow">{FINAL.eyebrow}</p>
        <h2 className="pv-c-display pv-c-h2 pv-c-final-h2">
          <RevealLines lines={[FINAL.headingLine1, <i key="em">{FINAL.headingLine2}</i>]} stagger={140} />
        </h2>
        <Reveal variant="up" delay={180}>
          <p className="pv-c-body pv-c-final-body">{FINAL.body}</p>
          <Link href={FINAL.href} className="pv-c-btn pv-c-btn--gold">
            <span>{FINAL.cta}</span>
          </Link>
          <p className="pv-c-final-note">{FINAL.note1}</p>
          <p className="pv-c-final-note">{FINAL.note2}</p>
          <p className="pv-c-final-alt">
            {FINAL.altLead} <Link href="/courses">{FINAL.altLink}</Link>
          </p>
        </Reveal>
      </div>
    </section>
  )
}

// The live footer, re-set. Every label, link and line is production's.
export function FooterC() {
  return (
    <footer className="pv-c-footer pv-c-dark" data-tone="dark">
      <style>{`
        .pv-c-footer { padding: clamp(50px, 6vw, 86px) var(--c-gutter) clamp(28px, 3vw, 44px); border-top: 1px solid rgba(245,242,238,0.07); }
        .pv-c-footer-top {
          max-width: 1180px; margin: 0 auto; display: flex; justify-content: space-between;
          align-items: flex-start; gap: clamp(32px, 5vw, 72px); flex-wrap: wrap;
        }
        .pv-c-footer-mark {
          font-family: var(--font-playfair), serif; font-weight: 500; font-size: clamp(1.4rem, 2.4vw, 2rem);
          letter-spacing: 0.1em; color: var(--c-off-white); margin: 0 0 12px;
        }
        .pv-c-footer-tag {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300; font-size: 12.5px;
          line-height: 1.75; color: rgba(245,242,238,0.42); max-width: 34ch; margin: 0;
        }
        .pv-c-footer-ig {
          display: inline-block; margin-top: 18px; font-family: var(--font-dm-sans), sans-serif;
          font-size: 11px; font-weight: 500; letter-spacing: 0.16em; text-transform: uppercase;
          color: var(--c-accent); text-decoration: none; transition: color 420ms ease;
        }
        .pv-c-footer-ig:hover { color: var(--c-off-white); }
        .pv-c-footer-navs { display: flex; gap: clamp(36px, 5vw, 80px); flex-wrap: wrap; }
        .pv-c-footer-label {
          font-family: var(--font-dm-sans), sans-serif; font-size: 10px; font-weight: 600;
          letter-spacing: 0.22em; text-transform: uppercase; color: rgba(245,242,238,0.3); margin: 0 0 16px;
        }
        .pv-c-footer-link {
          display: block; font-family: var(--font-dm-sans), sans-serif; font-size: 12.5px;
          color: rgba(245,242,238,0.55); text-decoration: none; margin-bottom: 11px;
          transition: color 420ms ease;
        }
        .pv-c-footer-link:hover { color: var(--c-accent); }
        .pv-c-footer-base {
          max-width: 1180px; margin: clamp(36px, 4vw, 56px) auto 0; padding-top: 22px;
          border-top: 1px solid rgba(245,242,238,0.06);
          display: flex; justify-content: space-between; align-items: center; gap: 14px; flex-wrap: wrap;
        }
        .pv-c-footer-copy {
          font-family: var(--font-dm-sans), sans-serif; font-size: 11px; color: rgba(245,242,238,0.25); margin: 0;
        }
        .pv-c-footer-legal { display: flex; gap: 20px; flex-wrap: wrap; }
        .pv-c-footer-legal a {
          font-family: var(--font-dm-sans), sans-serif; font-size: 12px; color: rgba(245,242,238,0.6);
          text-decoration: underline; text-underline-offset: 3px; transition: color 420ms ease;
        }
        .pv-c-footer-legal a:hover { color: var(--c-accent); }
      `}</style>

      <div className="pv-c-footer-top">
        <div>
          <p className="pv-c-footer-mark">{FOOTER.wordmark}</p>
          <p className="pv-c-footer-tag">{FOOTER.tagline}</p>
          <a href={FOOTER.instagramHref} target="_blank" rel="noopener noreferrer" className="pv-c-footer-ig">
            {FOOTER.instagram}
          </a>
        </div>
        <nav className="pv-c-footer-navs">
          <div>
            <p className="pv-c-footer-label">{FOOTER.siteLabel}</p>
            {FOOTER.siteLinks.map((l) => (
              <Link key={l.href} href={l.href} className="pv-c-footer-link">
                {l.label}
              </Link>
            ))}
          </div>
          <div>
            <p className="pv-c-footer-label">{FOOTER.membersLabel}</p>
            {FOOTER.memberLinks.map((l) => (
              <Link key={l.href} href={l.href} className="pv-c-footer-link">
                {l.label}
              </Link>
            ))}
          </div>
        </nav>
      </div>

      <div className="pv-c-footer-base">
        <p className="pv-c-footer-copy">&copy; {new Date().getFullYear()} Lisa Fit Method. All rights reserved.</p>
        <div className="pv-c-footer-legal">
          {FOOTER.legal.map((l) => (
            <Link key={l.href} href={l.href}>
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  )
}
