"use client"

import Link from "next/link"
import VideoPlayer from "@/components/VideoPlayer.client"
import { RevealLines, Reveal, DrawRule, usePrefersReducedMotion, useInView } from "../Reveal.client"
import { useTopScroll } from "../useScrollProgress.client"
import { HERO } from "../previewContent"

// DIRECTION A hero — "the spread".
//
// Type first, on paper. The film arrives underneath as a plate: a wide
// cinematic band inset to the page gutter, opening from a clipped letterbox
// and settling out of a slow zoom as the reader scrolls in. It reads like a
// magazine opening a photo essay rather than a website playing a background
// video, which is the whole point of this direction.
export default function HeroA({ trailerSrc, posterSrc }: { trailerSrc: string; posterSrc?: string }) {
  const reduced = usePrefersReducedMotion()
  const scrolled = useTopScroll(900)
  const { ref: plateRef, inView: plateIn } = useInView<HTMLDivElement>(0.22)

  // The plate opens from a letterbox slit and the footage eases out of a
  // slight overscale. Both are driven by entry, not by continuous scroll,
  // so the hero settles and then stays still to be read.
  const open = plateIn || reduced
  const scale = reduced ? 1 : 1.07 - Math.min(scrolled, 1) * 0.07

  return (
    <header className="pv-a-hero">
      <style>{`
        .pv-a-hero { background: #f7f4ef; padding: clamp(118px, 13vw, 190px) 0 0; }
        .pv-a-hero-inner { padding: 0 clamp(20px, 5vw, 72px); }
        .pv-a-hero-eyebrow {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 10.5px; font-weight: 600; letter-spacing: 0.32em; text-transform: uppercase;
          color: #a8895e; margin-bottom: clamp(22px, 2.6vw, 38px);
        }
        .pv-a-hero-h1 {
          font-family: var(--font-playfair), serif;
          font-size: clamp(2.4rem, 5.6vw, 5.6rem);
          font-weight: 500; line-height: 0.96; letter-spacing: -0.015em;
          color: #121110; margin: 0;
        }
        .pv-a-hero-h1 i { font-style: italic; color: #a8895e; }
        .pv-a-hero-meta-row {
          display: grid; grid-template-columns: 1.25fr 1fr; gap: clamp(28px, 5vw, 80px);
          align-items: end; margin-top: clamp(30px, 3.4vw, 52px);
        }
        .pv-a-hero-lede {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
          font-size: clamp(1.02rem, 1.3vw, 1.3rem); line-height: 1.62;
          color: rgba(18,17,16,0.78); max-width: 46ch; margin: 0;
        }
        .pv-a-hero-sub {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
          font-size: clamp(0.84rem, 0.95vw, 0.95rem); line-height: 1.75;
          color: rgba(18,17,16,0.5); max-width: 42ch; margin: 0;
        }
        .pv-a-hero-ctas { display: flex; gap: 10px; flex-wrap: wrap; margin-top: clamp(26px, 3vw, 40px); }
        .pv-a-btn {
          position: relative; overflow: hidden;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 11px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase;
          text-decoration: none; padding: 17px 36px; display: inline-block;
          transition: color 560ms cubic-bezier(0.16,1,0.3,1);
        }
        .pv-a-btn span { position: relative; z-index: 1; }
        .pv-a-btn::before {
          content: ""; position: absolute; inset: 0; z-index: 0;
          transform: scaleY(0); transform-origin: bottom;
          transition: transform 620ms cubic-bezier(0.16,1,0.3,1);
        }
        .pv-a-btn-solid { background: #121110; color: #f7f4ef; }
        .pv-a-btn-solid::before { background: #a8895e; }
        .pv-a-btn-solid:hover { color: #121110; }
        .pv-a-btn-solid:hover::before { transform: scaleY(1); }
        .pv-a-btn-ghost { color: #121110; border: 1px solid rgba(18,17,16,0.24); }
        .pv-a-btn-ghost::before { background: #121110; }
        .pv-a-btn-ghost:hover { color: #f7f4ef; }
        .pv-a-btn-ghost:hover::before { transform: scaleY(1); }
        .pv-a-plate-wrap { padding: clamp(36px, 4.5vw, 72px) clamp(20px, 5vw, 72px) 0; }
        .pv-a-plate {
          position: relative; overflow: hidden; background: #121110;
          aspect-ratio: 2.35 / 1; max-height: 74vh;
          transition: clip-path 1500ms cubic-bezier(0.16,1,0.3,1);
        }
        .pv-a-plate-caption {
          display: flex; justify-content: space-between; gap: 18px; flex-wrap: wrap;
          padding-top: 12px;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 10px; font-weight: 500; letter-spacing: 0.22em; text-transform: uppercase;
          color: rgba(18,17,16,0.4);
        }
        .pv-a-hero-facts {
          display: flex; flex-wrap: wrap; gap: 0;
          padding: clamp(30px, 3.6vw, 54px) clamp(20px, 5vw, 72px) clamp(44px, 5vw, 76px);
        }
        .pv-a-hero-fact {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 11px; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase;
          color: rgba(18,17,16,0.45); padding-right: clamp(20px, 2.6vw, 40px); margin-right: clamp(20px, 2.6vw, 40px);
          border-right: 1px solid rgba(18,17,16,0.14);
        }
        .pv-a-hero-fact:last-child { border-right: none; margin-right: 0; padding-right: 0; }
        @media (max-width: 900px) {
          .pv-a-hero-meta-row { grid-template-columns: 1fr; align-items: start; gap: 22px; }
          .pv-a-plate { aspect-ratio: 16 / 10; max-height: none; }
          .pv-a-hero-fact { border-right: none; margin-right: 0; padding-right: 0; flex: 0 0 100%; padding-bottom: 8px; }
        }
      `}</style>

      <div className="pv-a-hero-inner">
        <Reveal variant="fade" duration={900}>
          <p className="pv-a-hero-eyebrow">{HERO.eyebrow}</p>
        </Reveal>

        <h1 className="pv-a-hero-h1">
          <RevealLines
            lines={[HERO.line1, <i key="em">{HERO.line2}</i>]}
            stagger={120}
            delay={120}
          />
        </h1>

        <div style={{ marginTop: "clamp(28px, 3vw, 44px)" }}>
          <DrawRule delay={420} />
        </div>

        <div className="pv-a-hero-meta-row">
          <Reveal variant="up" delay={260} duration={1100}>
            <p className="pv-a-hero-lede">{HERO.lede}</p>
            <div className="pv-a-hero-ctas">
              <Link href="/courses" className="pv-a-btn pv-a-btn-solid">
                <span>Explore Courses</span>
              </Link>
              <Link href="/coaching" className="pv-a-btn pv-a-btn-ghost">
                <span>1:1 Coaching</span>
              </Link>
            </div>
          </Reveal>
          <Reveal variant="up" delay={400} duration={1100}>
            <p className="pv-a-hero-sub">{HERO.sub}</p>
          </Reveal>
        </div>
      </div>

      <div className="pv-a-plate-wrap">
        <div
          ref={plateRef}
          className="pv-a-plate"
          style={{ clipPath: open ? "inset(0% 0% 0% 0%)" : "inset(22% 0% 22% 0%)" }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              transform: `scale(${scale})`,
              transition: reduced ? "none" : "transform 220ms linear",
              willChange: "transform",
            }}
          >
            <VideoPlayer src={trailerSrc} poster={posterSrc} style={{ width: "100%", height: "100%" }} />
          </div>
        </div>
        <div className="pv-a-plate-caption">
          <span>Lisa Fit Method — Miami, FL</span>
          <span>Film still · Training Foundations</span>
        </div>
      </div>

      <div className="pv-a-hero-facts">
        {HERO.meta.map((m, i) => (
          <Reveal key={m} variant="fade" delay={i * 110} className="pv-a-hero-fact">
            {m}
          </Reveal>
        ))}
      </div>
    </header>
  )
}
