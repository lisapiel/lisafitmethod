"use client"

import Link from "next/link"
import VideoPlayer from "@/components/VideoPlayer.client"
import { RevealLines, Reveal, usePrefersReducedMotion } from "../Reveal.client"
import { useTopScroll } from "../useScrollProgress.client"
import { HERO } from "../previewContent"

// DIRECTION B hero — the title sequence.
//
// Full-bleed film at 100vh. As the reader scrolls out, three things move at
// different rates: the footage pushes further into a slow zoom, the scrim
// deepens, and the type lifts and dissolves. Parallax between those layers
// is what makes it read as a camera move rather than a page scrolling.
export default function HeroB({ trailerSrc, posterSrc }: { trailerSrc: string; posterSrc?: string }) {
  const reduced = usePrefersReducedMotion()
  const p = useTopScroll(900)

  const zoom = reduced ? 1 : 1 + p * 0.14
  const scrim = reduced ? 0.58 : 0.58 + p * 0.3
  const lift = reduced ? 0 : p * -70
  const fade = reduced ? 1 : 1 - Math.min(p * 1.5, 1)

  return (
    <header className="pv-b-hero">
      <style>{`
        .pv-b-hero { position: relative; height: 100vh; min-height: 620px; overflow: hidden; background: #08080a; }
        .pv-b-hero-film { position: absolute; inset: 0; will-change: transform; }
        .pv-b-hero-scrim { position: absolute; inset: 0; pointer-events: none; }
        .pv-b-hero-vignette {
          position: absolute; inset: 0; pointer-events: none;
          background: radial-gradient(130% 100% at 50% 40%, transparent 38%, rgba(8,8,10,0.82) 100%);
        }
        /* Holds the type column dark no matter what the footage is doing
           behind it — the hero must stay readable on every frame, not just
           the one it was art-directed against. */
        .pv-b-hero-side {
          position: absolute; inset: 0; pointer-events: none;
          background: linear-gradient(to right, rgba(8,8,10,0.78) 0%, rgba(8,8,10,0.46) 34%, rgba(8,8,10,0.08) 62%, transparent 78%);
        }
        .pv-b-hero-inner {
          position: absolute; inset: 0; z-index: 2;
          display: flex; flex-direction: column; justify-content: flex-end;
          padding: 0 clamp(20px, 5vw, 72px) clamp(54px, 7vw, 96px);
        }
        .pv-b-hero-h1 { font-size: clamp(2.6rem, 7.4vw, 7.2rem); max-width: 20ch; }
        .pv-b-hero-row { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: clamp(28px, 5vw, 80px); align-items: end; margin-top: clamp(26px, 3vw, 44px); }
        .pv-b-hero-lede { max-width: 44ch; color: rgba(240,230,211,0.72); font-size: clamp(0.92rem, 1.1vw, 1.08rem); }
        .pv-b-hero-ctas { display: flex; gap: 10px; flex-wrap: wrap; margin-top: clamp(26px, 3vw, 38px); }
        .pv-b-hero-meta { display: flex; flex-direction: column; gap: 10px; align-items: flex-end; text-align: right; }
        .pv-b-hero-meta-item {
          font-family: var(--font-montserrat), sans-serif; font-size: 10px; font-weight: 500;
          letter-spacing: 0.2em; text-transform: uppercase; color: rgba(240,230,211,0.42);
        }
        .pv-b-scroll-cue { position: absolute; left: 50%; bottom: 18px; z-index: 3; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; gap: 10px; }
        .pv-b-scroll-cue span {
          font-family: var(--font-montserrat), sans-serif; font-size: 8.5px; font-weight: 500;
          letter-spacing: 0.34em; text-transform: uppercase; color: rgba(240,230,211,0.34);
        }
        .pv-b-scroll-line { width: 1px; height: 54px; background: rgba(201,169,110,0.22); overflow: hidden; position: relative; }
        .pv-b-scroll-line::after {
          content: ""; position: absolute; left: 0; top: 0; width: 1px; height: 18px; background: #c9a96e;
          animation: pvBCue 2600ms cubic-bezier(0.45, 0, 0.2, 1) infinite;
        }
        @keyframes pvBCue {
          0% { transform: translateY(-20px); opacity: 0; }
          34% { opacity: 1; }
          100% { transform: translateY(56px); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .pv-b-scroll-line::after { animation: none; opacity: 0.8; }
        }
        @media (max-width: 900px) {
          .pv-b-hero-row { grid-template-columns: 1fr; align-items: start; gap: 22px; }
          .pv-b-hero-meta { align-items: flex-start; text-align: left; flex-direction: row; flex-wrap: wrap; gap: 14px; }
          .pv-b-scroll-cue { display: none; }
        }
      `}</style>

      <div className="pv-b-hero-film" style={{ transform: `scale(${zoom})`, transition: reduced ? "none" : "transform 200ms linear" }}>
        <VideoPlayer src={trailerSrc} poster={posterSrc} style={{ width: "100%", height: "100%" }} />
      </div>
      <div
        className="pv-b-hero-scrim"
        style={{ background: `linear-gradient(to top, rgba(8,8,10,${Math.min(scrim + 0.22, 1)}) 0%, rgba(8,8,10,${scrim * 0.5}) 45%, rgba(8,8,10,${scrim * 0.72}) 100%)` }}
        aria-hidden="true"
      />
      <div className="pv-b-hero-side" aria-hidden="true" />
      <div className="pv-b-hero-vignette" aria-hidden="true" />

      <div
        className="pv-b-hero-inner"
        style={{ transform: `translate3d(0, ${lift}px, 0)`, opacity: fade, transition: reduced ? "none" : "transform 200ms linear, opacity 200ms linear" }}
      >
        <Reveal variant="fade" duration={1200}>
          <p className="pv-b-label" style={{ marginBottom: "clamp(20px, 2.4vw, 34px)" }}>
            {HERO.eyebrow}
          </p>
        </Reveal>

        <h1 className="pv-b-display pv-b-hero-h1">
          <RevealLines lines={[HERO.line1, <i key="i">{HERO.line2}</i>]} stagger={150} delay={160} />
        </h1>

        <div className="pv-b-hero-row">
          <Reveal variant="up" delay={360} duration={1200}>
            <p className="pv-b-body pv-b-hero-lede">{HERO.lede}</p>
            <div className="pv-b-hero-ctas">
              <Link href="/courses" className="pv-b-cta">
                Explore Courses
              </Link>
              <Link href="/coaching" className="pv-b-cta-ghost">
                1:1 Coaching
              </Link>
            </div>
          </Reveal>
          <Reveal variant="up" delay={520} duration={1200} className="pv-b-hero-meta">
            {HERO.meta.map((m) => (
              <span key={m} className="pv-b-hero-meta-item">
                {m}
              </span>
            ))}
          </Reveal>
        </div>
      </div>

      <div className="pv-b-scroll-cue" aria-hidden="true">
        <div className="pv-b-scroll-line" />
        <span>Scroll</span>
      </div>
    </header>
  )
}
