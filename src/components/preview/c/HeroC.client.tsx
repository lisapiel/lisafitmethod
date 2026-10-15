"use client"

import Link from "next/link"
import VideoPlayer from "@/components/VideoPlayer.client"
import { Reveal, RevealLines, usePrefersReducedMotion } from "../Reveal.client"
import { useTopScroll } from "../useScrollProgress.client"
import { HERO } from "./productionCopy"

// Direction C hero — the production hero, shot as a title sequence.
//
// Production stacks a 62vh video band above a separate dark text block. Here
// the same video becomes the ground the headline sits on, which is the single
// biggest change in perceived quality on the page and costs no copy: every
// word below is the live hero, unchanged.
//
// Three layers move at different rates as the reader scrolls out — the
// footage pushes into a slow zoom, the scrim deepens, the type lifts and
// dissolves. That rate difference is what reads as a camera move instead of
// a page scrolling.
export default function HeroC({ trailerSrc, posterSrc }: { trailerSrc: string; posterSrc?: string }) {
  const reduced = usePrefersReducedMotion()
  const p = useTopScroll(900)

  const zoom = reduced ? 1 : 1 + p * 0.13
  const scrim = reduced ? 0.6 : 0.6 + p * 0.28
  const lift = reduced ? 0 : p * -64
  const fade = reduced ? 1 : 1 - Math.min(p * 1.45, 1)

  return (
    <header className="pv-c-hero pv-c-dark" data-tone="dark">
      <style>{`
        .pv-c-hero { position: relative; height: 100vh; min-height: 620px; overflow: hidden; }
        .pv-c-hero::before { z-index: 3; }
        .pv-c-hero-film { position: absolute; inset: 0; will-change: transform; }
        .pv-c-hero-scrim, .pv-c-hero-side, .pv-c-hero-vignette { position: absolute; inset: 0; pointer-events: none; }
        /* Holds the type column legible whatever frame the film is on. */
        .pv-c-hero-side {
          background: linear-gradient(to right, rgba(10,10,10,0.8) 0%, rgba(10,10,10,0.48) 34%, rgba(10,10,10,0.08) 64%, transparent 80%);
        }
        .pv-c-hero-vignette {
          background: radial-gradient(130% 100% at 50% 40%, transparent 36%, rgba(10,10,10,0.8) 100%);
        }
        .pv-c-hero-inner {
          position: absolute; inset: 0; z-index: 4;
          display: flex; flex-direction: column; justify-content: flex-end;
          padding: 0 var(--c-gutter) clamp(58px, 7.5vw, 104px);
        }
        .pv-c-hero-h1 {
          font-size: clamp(2.5rem, 6.6vw, 6.2rem); max-width: 19ch;
          margin-bottom: clamp(22px, 2.6vw, 36px);
        }
        .pv-c-hero-row {
          display: grid; grid-template-columns: 1.05fr 0.95fr;
          gap: clamp(26px, 5vw, 76px); align-items: end;
        }
        .pv-c-hero-lede {
          color: rgba(245,242,238,0.78); max-width: 46ch;
          font-size: clamp(1rem, 1.25vw, 1.2rem); line-height: 1.6; margin: 0;
        }
        .pv-c-hero-sub {
          color: rgba(245,242,238,0.46); max-width: 44ch; margin: 14px 0 0;
          font-size: clamp(0.86rem, 0.98vw, 0.98rem); line-height: 1.75;
        }
        .pv-c-hero-ctas { display: flex; gap: 10px; flex-wrap: wrap; margin-top: clamp(26px, 3vw, 38px); }
        .pv-c-hero-meta { display: flex; flex-direction: column; gap: 9px; align-items: flex-end; text-align: right; }
        .pv-c-hero-meta p {
          font-family: var(--font-dm-sans), sans-serif; font-size: 11px; font-weight: 500;
          letter-spacing: 0.16em; text-transform: uppercase; color: rgba(245,242,238,0.42); margin: 0;
        }
        .pv-c-cue { position: absolute; left: 50%; bottom: 16px; z-index: 5; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; gap: 9px; }
        .pv-c-cue-line { width: 1px; height: 48px; background: rgba(200,169,126,0.22); overflow: hidden; position: relative; }
        .pv-c-cue-line::after {
          content: ""; position: absolute; left: 0; top: 0; width: 1px; height: 16px; background: var(--c-accent);
          animation: pvCCue 2600ms cubic-bezier(0.45, 0, 0.2, 1) infinite;
        }
        @keyframes pvCCue {
          0% { transform: translateY(-18px); opacity: 0; }
          34% { opacity: 1; }
          100% { transform: translateY(50px); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) { .pv-c-cue-line::after { animation: none; opacity: 0.8; } }
        @media (max-width: 960px) {
          .pv-c-hero-row { grid-template-columns: 1fr; align-items: start; gap: 20px; }
          .pv-c-hero-meta { align-items: flex-start; text-align: left; }
          .pv-c-cue { display: none; }
        }
        @media (max-width: 600px) {
          .pv-c-hero-ctas > a { flex: 1 1 100%; }
        }
      `}</style>

      <div
        className="pv-c-hero-film"
        style={{ transform: `scale(${zoom})`, transition: reduced ? "none" : "transform 200ms linear" }}
      >
        <VideoPlayer src={trailerSrc} poster={posterSrc} style={{ width: "100%", height: "100%" }} />
      </div>
      <div
        className="pv-c-hero-scrim"
        style={{
          background: `linear-gradient(to top, rgba(10,10,10,${Math.min(scrim + 0.22, 1)}) 0%, rgba(10,10,10,${scrim * 0.46}) 46%, rgba(10,10,10,${scrim * 0.7}) 100%)`,
        }}
        aria-hidden="true"
      />
      <div className="pv-c-hero-side" aria-hidden="true" />
      <div className="pv-c-hero-vignette" aria-hidden="true" />

      <div
        className="pv-c-hero-inner"
        style={{
          transform: `translate3d(0, ${lift}px, 0)`,
          opacity: fade,
          transition: reduced ? "none" : "transform 200ms linear, opacity 200ms linear",
        }}
      >
        <Reveal variant="fade" duration={1100}>
          <p className="pv-c-eyebrow" style={{ marginBottom: "clamp(20px, 2.3vw, 32px)" }}>
            {HERO.eyebrow}
          </p>
        </Reveal>

        <h1 className="pv-c-display pv-c-hero-h1">
          <RevealLines
            lines={[HERO.headlineLine1, <i key="em">{HERO.headlineLine2}</i>]}
            stagger={140}
            delay={140}
          />
        </h1>

        <div className="pv-c-hero-row">
          <Reveal variant="up" delay={340} duration={1150}>
            <p className="pv-c-hero-lede">{HERO.lede}</p>
            <p className="pv-c-hero-sub">{HERO.sub}</p>
            <div className="pv-c-hero-ctas">
              <Link href="/courses" className="pv-c-btn pv-c-btn--gold">
                <span>{HERO.ctaPrimary}</span>
              </Link>
              <Link href="/coaching" className="pv-c-btn pv-c-btn--ghost-dark">
                <span>{HERO.ctaSecondary}</span>
              </Link>
            </div>
          </Reveal>
          <Reveal variant="up" delay={480} duration={1150} className="pv-c-hero-meta">
            <p>{HERO.metaCourses}</p>
            <p>{HERO.metaCoaching}</p>
          </Reveal>
        </div>
      </div>

      <div className="pv-c-cue" aria-hidden="true">
        <div className="pv-c-cue-line" />
      </div>
    </header>
  )
}
