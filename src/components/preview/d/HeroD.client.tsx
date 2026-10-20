"use client"

import Link from "next/link"
import VideoPlayer from "@/components/VideoPlayer.client"
import { Reveal, RevealLines, usePrefersReducedMotion } from "../Reveal.client"
import { useTopScroll } from "../useScrollProgress.client"
import { HERO } from "../c/productionCopy"

// Direction D hero.
//
// Height is capped as well as proportional: 92vh so the page shows a hint of
// what follows, but never more than 960px, because on a 2560-wide display an
// unbounded vh hero crops the footage to a letterbox slot and cuts the
// subject off at the chest. Capping the height and biasing object-position
// upward keeps the framing intact from laptop to ultrawide.
//
// Copy is the live hero, word for word.
export default function HeroD({ trailerSrc, posterSrc }: { trailerSrc: string; posterSrc?: string }) {
  const reduced = usePrefersReducedMotion()
  const p = useTopScroll(880)

  const zoom = reduced ? 1 : 1 + p * 0.11
  const lift = reduced ? 0 : p * -58
  const fade = reduced ? 1 : 1 - Math.min(p * 1.4, 1)
  const scrim = reduced ? 0.58 : 0.58 + p * 0.26

  return (
    <header className="pv-d-hero pv-d-dark" data-tone="dark">
      <style>{`
        .pv-d-hero {
          position: relative; display: flex;
          min-height: min(88vh, 920px);
          overflow: hidden;
        }
        .pv-d-hero::before { z-index: 3; }
        .pv-d-hero-film { position: absolute; inset: 0; will-change: transform; }
        /* VideoPlayer sets object-fit inline but leaves position to CSS, so the
           framing can be biased here without touching the shared component. */
        .pv-d-hero-film video, .pv-d-hero-film img { object-position: center 20%; }
        @media (min-width: 1800px) {
          .pv-d-hero-film video, .pv-d-hero-film img { object-position: center 10%; }
        }
        .pv-d-hero-scrim, .pv-d-hero-side, .pv-d-hero-vignette { position: absolute; inset: 0; pointer-events: none; }
        .pv-d-hero-side {
          background: linear-gradient(to right, rgba(10,10,10,0.82) 0%, rgba(10,10,10,0.5) 36%, rgba(10,10,10,0.08) 66%, transparent 82%);
        }
        .pv-d-hero-vignette {
          background: radial-gradient(135% 105% at 50% 38%, transparent 34%, rgba(10,10,10,0.82) 100%);
        }
        .pv-d-hero-inner {
          position: relative; z-index: 4; flex: 1;
          display: flex; flex-direction: column; justify-content: flex-end;
          padding: clamp(112px, 14vh, 164px) var(--d-gutter) clamp(56px, 7vw, 96px);
        }
        .pv-d-hero-grid { max-width: var(--d-max); margin: 0 auto; width: 100%; }
        .pv-d-hero-h1 {
          font-size: clamp(2.5rem, 6.2vw, 5.6rem); max-width: 18ch;
          margin-bottom: var(--d-step-3);
        }
        .pv-d-hero-row {
          display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
          gap: clamp(26px, 4.5vw, 72px); align-items: end;
        }
        .pv-d-hero-lede { max-width: 44ch; }
        .pv-d-hero-sub {
          color: rgba(245,242,238,0.46); max-width: 42ch; margin: var(--d-step-2) 0 0;
          font-size: clamp(0.86rem, 0.98vw, 0.98rem); line-height: 1.75;
        }
        .pv-d-hero-ctas { display: flex; gap: 10px; flex-wrap: wrap; margin-top: var(--d-step-3); }
        .pv-d-hero-meta { display: flex; flex-direction: column; gap: 9px; align-items: flex-end; text-align: right; }
        .pv-d-hero-meta p {
          font-family: var(--font-dm-sans), sans-serif; font-size: 11px; font-weight: 500;
          letter-spacing: 0.16em; text-transform: uppercase; color: rgba(245,242,238,0.44); margin: 0;
        }
        .pv-d-cue { position: absolute; left: 50%; bottom: 14px; z-index: 5; transform: translateX(-50%); }
        .pv-d-cue-line { width: 1px; height: 44px; background: rgba(200,169,126,0.22); overflow: hidden; position: relative; }
        .pv-d-cue-line::after {
          content: ""; position: absolute; left: 0; top: 0; width: 1px; height: 15px; background: var(--d-accent);
          animation: pvDCue 2600ms cubic-bezier(0.45, 0, 0.2, 1) infinite;
        }
        @keyframes pvDCue {
          0% { transform: translateY(-17px); opacity: 0; }
          34% { opacity: 1; }
          100% { transform: translateY(46px); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) { .pv-d-cue-line::after { animation: none; opacity: 0.8; } }
        @media (max-width: 960px) {
          .pv-d-hero { min-height: min(86vh, 860px); }
          .pv-d-hero-row { grid-template-columns: 1fr; align-items: start; gap: 20px; }
          .pv-d-hero-meta { align-items: flex-start; text-align: left; }
          .pv-d-cue { display: none; }
        }
        @media (max-width: 600px) {
          .pv-d-hero-ctas > a { flex: 1 1 100%; }
          .pv-d-hero-h1 { font-size: clamp(2.1rem, 10vw, 3rem); }
        }
      `}</style>

      <div
        className="pv-d-hero-film"
        style={{ transform: `scale(${zoom})`, transition: reduced ? "none" : "transform 200ms linear" }}
      >
        <VideoPlayer src={trailerSrc} poster={posterSrc} style={{ width: "100%", height: "100%" }} />
      </div>
      <div
        className="pv-d-hero-scrim"
        style={{
          background: `linear-gradient(to top, rgba(10,10,10,${Math.min(scrim + 0.2, 1)}) 0%, rgba(10,10,10,${scrim * 0.44}) 48%, rgba(10,10,10,${scrim * 0.66}) 100%)`,
        }}
        aria-hidden="true"
      />
      <div className="pv-d-hero-side" aria-hidden="true" />
      <div className="pv-d-hero-vignette" aria-hidden="true" />

      <div
        className="pv-d-hero-inner"
        style={{
          transform: `translate3d(0, ${lift}px, 0)`,
          opacity: fade,
          transition: reduced ? "none" : "transform 200ms linear, opacity 200ms linear",
        }}
      >
        <div className="pv-d-hero-grid">
          <Reveal variant="fade" duration={1100}>
            <p className="pv-d-eyebrow" style={{ marginBottom: "var(--d-step-3)" }}>
              {HERO.eyebrow}
            </p>
          </Reveal>

          <h1 className="pv-d-display pv-d-hero-h1">
            <RevealLines
              lines={[HERO.headlineLine1, <i key="em">{HERO.headlineLine2}</i>]}
              stagger={140}
              delay={140}
            />
          </h1>

          <div className="pv-d-hero-row">
            <Reveal variant="up" delay={340} duration={1150}>
              <p className="pv-d-lede pv-d-hero-lede">{HERO.lede}</p>
              <p className="pv-d-hero-sub">{HERO.sub}</p>
              <div className="pv-d-hero-ctas">
                <Link href="/courses" className="pv-d-btn pv-d-btn--gold">
                  <span>{HERO.ctaPrimary}</span>
                </Link>
                <Link href="/coaching" className="pv-d-btn pv-d-btn--ghost-dark">
                  <span>{HERO.ctaSecondary}</span>
                </Link>
              </div>
            </Reveal>
            <Reveal variant="up" delay={480} duration={1150} className="pv-d-hero-meta">
              <p>{HERO.metaCourses}</p>
              <p>{HERO.metaCoaching}</p>
            </Reveal>
          </div>
        </div>
      </div>

      <div className="pv-d-cue" aria-hidden="true">
        <div className="pv-d-cue-line" />
      </div>
    </header>
  )
}
