import Link from "next/link"
import { Reveal, RevealLines, DrawRule } from "../Reveal.client"
import { FINAL, FOOTER } from "../c/productionCopy"

// The closing ask, and the footer that carries it out.
// Both are the live wording, unchanged.
export function FinalCtaD() {
  return (
    <section className="pv-d-final pv-d-dark pv-d-section" data-tone="dark">
      <style>{`
        .pv-d-final { text-align: center; }
        .pv-d-final-glow {
          position: absolute; top: 50%; left: 50%; width: 940px; height: 940px; max-width: 165vw;
          transform: translate(-50%, -50%); pointer-events: none;
          background: radial-gradient(circle, rgba(200,169,126,0.13) 0%, transparent 70%);
        }
        .pv-d-final-inner { position: relative; max-width: 980px; margin: 0 auto; }
        .pv-d-final-h2 { max-width: 22ch; margin: 0 auto var(--d-step-3); }
        .pv-d-final-body { max-width: 56ch; margin: 0 auto var(--d-step-4); }
        .pv-d-final-note {
          font-family: var(--font-dm-sans), sans-serif; font-size: 12.5px; font-weight: 300;
          line-height: 1.75; color: rgba(245,242,238,0.32); margin: var(--d-step-2) auto 0; max-width: 48ch;
        }
        .pv-d-final-alt {
          margin: var(--d-step-3) auto 0; font-family: var(--font-dm-sans), sans-serif;
          font-size: 12.5px; color: rgba(245,242,238,0.28);
        }
        .pv-d-final-alt a {
          color: rgba(200,169,126,0.72); text-decoration: underline; text-underline-offset: 3px;
          transition: color 420ms ease;
        }
        .pv-d-final-alt a:hover { color: var(--d-accent); }
      `}</style>

      <div className="pv-d-final-glow" aria-hidden="true" />
      <div className="pv-d-final-inner">
        <div className="pv-d-open pv-d-open--centre" style={{ marginBottom: 0 }}>
          <p className="pv-d-eyebrow">{FINAL.eyebrow}</p>
          <div className="pv-d-open-rule">
            <DrawRule color="rgba(200,169,126,0.5)" origin="center" />
          </div>
          <h2 className="pv-d-display pv-d-h2 pv-d-final-h2">
            <RevealLines lines={[FINAL.headingLine1, <i key="em">{FINAL.headingLine2}</i>]} stagger={140} />
          </h2>
        </div>
        <Reveal variant="up" delay={180}>
          <p className="pv-d-body pv-d-final-body">{FINAL.body}</p>
          <Link href={FINAL.href} className="pv-d-btn pv-d-btn--gold">
            <span>{FINAL.cta}</span>
          </Link>
          <p className="pv-d-final-note">{FINAL.note1}</p>
          <p className="pv-d-final-note">{FINAL.note2}</p>
          <p className="pv-d-final-alt">
            {FINAL.altLead} <Link href="/courses">{FINAL.altLink}</Link>
          </p>
        </Reveal>
      </div>
    </section>
  )
}

export function FooterD() {
  return (
    <footer className="pv-d-footer pv-d-dark" data-tone="dark">
      <style>{`
        .pv-d-footer { padding: var(--d-step-4) var(--d-gutter) var(--d-step-3); border-top: 1px solid rgba(245,242,238,0.07); }
        .pv-d-footer-top {
          max-width: var(--d-max); margin: 0 auto; display: flex; justify-content: space-between;
          align-items: flex-start; gap: clamp(30px, 5vw, 72px); flex-wrap: wrap;
        }
        .pv-d-footer-mark {
          font-family: var(--font-playfair), serif; font-weight: 500; font-size: clamp(1.3rem, 2.2vw, 1.8rem);
          letter-spacing: 0.1em; color: var(--d-off-white); margin: 0 0 var(--d-step-1);
        }
        .pv-d-footer-tag {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300; font-size: 12.5px;
          line-height: 1.75; color: rgba(245,242,238,0.42); max-width: 34ch; margin: 0;
        }
        .pv-d-footer-ig {
          display: inline-block; margin-top: var(--d-step-2); font-family: var(--font-dm-sans), sans-serif;
          font-size: 11px; font-weight: 500; letter-spacing: 0.16em; text-transform: uppercase;
          color: var(--d-accent); text-decoration: none; transition: color 420ms ease;
        }
        .pv-d-footer-ig:hover { color: var(--d-off-white); }
        .pv-d-footer-navs { display: flex; gap: clamp(34px, 5vw, 76px); flex-wrap: wrap; }
        .pv-d-footer-label {
          font-family: var(--font-dm-sans), sans-serif; font-size: 10px; font-weight: 600;
          letter-spacing: 0.22em; text-transform: uppercase; color: rgba(245,242,238,0.3); margin: 0 0 var(--d-step-2);
        }
        .pv-d-footer-link {
          display: block; font-family: var(--font-dm-sans), sans-serif; font-size: 12.5px;
          color: rgba(245,242,238,0.55); text-decoration: none; margin-bottom: 10px;
          transition: color 420ms ease;
        }
        .pv-d-footer-link:hover { color: var(--d-accent); }
        .pv-d-footer-base {
          max-width: var(--d-max); margin: var(--d-step-4) auto 0; padding-top: var(--d-step-3);
          border-top: 1px solid rgba(245,242,238,0.06);
          display: flex; justify-content: space-between; align-items: center; gap: 14px; flex-wrap: wrap;
        }
        .pv-d-footer-copy {
          font-family: var(--font-dm-sans), sans-serif; font-size: 11px; color: rgba(245,242,238,0.25); margin: 0;
        }
        .pv-d-footer-legal { display: flex; gap: 20px; flex-wrap: wrap; }
        .pv-d-footer-legal a {
          font-family: var(--font-dm-sans), sans-serif; font-size: 12px; color: rgba(245,242,238,0.6);
          text-decoration: underline; text-underline-offset: 3px; transition: color 420ms ease;
        }
        .pv-d-footer-legal a:hover { color: var(--d-accent); }
      `}</style>

      <div className="pv-d-footer-top">
        <div>
          <p className="pv-d-footer-mark">{FOOTER.wordmark}</p>
          <p className="pv-d-footer-tag">{FOOTER.tagline}</p>
          <a href={FOOTER.instagramHref} target="_blank" rel="noopener noreferrer" className="pv-d-footer-ig">
            {FOOTER.instagram}
          </a>
        </div>
        <nav className="pv-d-footer-navs">
          <div>
            <p className="pv-d-footer-label">{FOOTER.siteLabel}</p>
            {FOOTER.siteLinks.map((l) => (
              <Link key={l.href} href={l.href} className="pv-d-footer-link">
                {l.label}
              </Link>
            ))}
          </div>
          <div>
            <p className="pv-d-footer-label">{FOOTER.membersLabel}</p>
            {FOOTER.memberLinks.map((l) => (
              <Link key={l.href} href={l.href} className="pv-d-footer-link">
                {l.label}
              </Link>
            ))}
          </div>
        </nav>
      </div>

      <div className="pv-d-footer-base">
        <p className="pv-d-footer-copy">&copy; {new Date().getFullYear()} Lisa Fit Method. All rights reserved.</p>
        <div className="pv-d-footer-legal">
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
