"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { HEADER } from "../c/productionCopy"

// Direction D navigation.
//
// Same idea as C — it samples the tone of the section currently under it and
// inverts — but on a mostly-light page it spends most of its life as ink on
// paper, and only turns to cream over the hero, the bundle and the closing.
// Keeping one bar that adapts, rather than two bars that swap, is what stops
// the tone changes reading as separate pages.
export default function NavD() {
  const [tone, setTone] = useState<"dark" | "light">("dark")
  const [condensed, setCondensed] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let frame = 0
    const measure = () => {
      frame = 0
      const probeY = 32
      let next: "dark" | "light" | null = null
      for (const section of document.querySelectorAll<HTMLElement>("[data-tone]")) {
        const rect = section.getBoundingClientRect()
        if (rect.top <= probeY && rect.bottom > probeY) {
          next = section.dataset.tone === "dark" ? "dark" : "light"
        }
      }
      if (next) setTone(next)
      setCondensed(window.scrollY > 80)
    }
    const schedule = () => {
      if (frame) return
      frame = window.requestAnimationFrame(measure)
    }
    measure()
    window.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule)
    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
    }
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  return (
    <>
      <style>{`
        .pv-d-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 400;
          padding: clamp(17px, 2vw, 26px) var(--d-gutter);
          transition: background 760ms cubic-bezier(0.16,1,0.3,1),
                      padding 760ms cubic-bezier(0.16,1,0.3,1),
                      box-shadow 760ms ease;
        }
        .pv-d-nav[data-condensed="true"] { padding-top: 12px; padding-bottom: 12px; }
        .pv-d-nav[data-condensed="true"][data-nav-tone="dark"] {
          background: rgba(10,10,10,0.76);
          backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
          box-shadow: inset 0 -1px 0 rgba(200,169,126,0.18);
        }
        .pv-d-nav[data-condensed="true"][data-nav-tone="light"] {
          background: rgba(250,248,245,0.86);
          backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
          box-shadow: inset 0 -1px 0 rgba(26,26,26,0.1);
        }
        .pv-d-nav-inner {
          max-width: var(--d-max); margin: 0 auto;
          display: flex; align-items: center; justify-content: space-between;
        }
        .pv-d-nav-mark {
          font-family: var(--font-playfair), serif; font-weight: 500;
          font-size: clamp(0.95rem, 1.05vw, 1.15rem); letter-spacing: 0.26em;
          text-transform: uppercase; text-decoration: none; white-space: nowrap;
          transition: color 760ms cubic-bezier(0.16,1,0.3,1);
        }
        .pv-d-nav[data-nav-tone="dark"] .pv-d-nav-mark { color: var(--d-off-white); }
        .pv-d-nav[data-nav-tone="light"] .pv-d-nav-mark { color: var(--d-text); }
        .pv-d-nav-links { display: flex; align-items: center; gap: clamp(18px, 2.2vw, 34px); }
        .pv-d-nav-link {
          position: relative; font-family: var(--font-dm-sans), sans-serif;
          font-size: 11px; font-weight: 500; letter-spacing: 0.2em;
          text-transform: uppercase; text-decoration: none; padding-bottom: 3px;
          transition: color 760ms cubic-bezier(0.16,1,0.3,1);
        }
        .pv-d-nav[data-nav-tone="dark"] .pv-d-nav-link { color: rgba(245,242,238,0.64); }
        .pv-d-nav[data-nav-tone="light"] .pv-d-nav-link { color: rgba(26,26,26,0.62); }
        .pv-d-nav[data-nav-tone="dark"] .pv-d-nav-link:hover { color: var(--d-off-white); }
        .pv-d-nav[data-nav-tone="light"] .pv-d-nav-link:hover { color: var(--d-text); }
        .pv-d-nav-link::after {
          content: ""; position: absolute; left: 0; bottom: 0; height: 1px; width: 100%;
          background: var(--d-accent); transform: scaleX(0); transform-origin: left;
          transition: transform 620ms cubic-bezier(0.16,1,0.3,1);
        }
        .pv-d-nav-link:hover::after { transform: scaleX(1); }
        .pv-d-nav-cta {
          font-family: var(--font-dm-sans), sans-serif; font-size: 10px; font-weight: 600;
          letter-spacing: 0.2em; text-transform: uppercase; text-decoration: none;
          padding: 11px 22px; border: 1px solid;
          transition: background 520ms ease, color 520ms ease, border-color 760ms ease;
        }
        .pv-d-nav[data-nav-tone="dark"] .pv-d-nav-cta { color: var(--d-accent); border-color: rgba(200,169,126,0.42); }
        .pv-d-nav[data-nav-tone="dark"] .pv-d-nav-cta:hover { background: var(--d-accent); color: var(--d-black); }
        .pv-d-nav[data-nav-tone="light"] .pv-d-nav-cta { color: var(--d-text); border-color: rgba(26,26,26,0.24); }
        .pv-d-nav[data-nav-tone="light"] .pv-d-nav-cta:hover { background: var(--d-text); color: var(--d-warm-white); }
        .pv-d-burger { display: none; background: none; border: none; cursor: pointer; padding: 6px; }
        .pv-d-burger span {
          display: block; width: 24px; height: 1px; margin: 6px 0;
          transition: transform 420ms ease, opacity 300ms ease, background 760ms ease;
        }
        .pv-d-nav[data-nav-tone="dark"] .pv-d-burger span { background: var(--d-off-white); }
        .pv-d-nav[data-nav-tone="light"] .pv-d-burger span { background: var(--d-text); }
        .pv-d-sheet {
          position: fixed; inset: 0; z-index: 390; background: var(--d-black);
          display: flex; flex-direction: column; justify-content: center;
          padding: 0 28px; transition: opacity 620ms cubic-bezier(0.16,1,0.3,1);
        }
        .pv-d-sheet-link {
          font-family: var(--font-playfair), serif; font-weight: 400;
          font-size: clamp(1.55rem, 7.5vw, 2.2rem); color: var(--d-off-white);
          text-decoration: none; line-height: 1.3; padding: 11px 0;
          border-bottom: 1px solid rgba(200,169,126,0.16);
        }
        .pv-d-sheet-cta {
          font-family: var(--font-dm-sans), sans-serif; font-size: 11px; font-weight: 600;
          letter-spacing: 0.2em; text-transform: uppercase; color: var(--d-accent);
          text-decoration: none; padding: 14px 0;
        }
        @media (max-width: 960px) {
          .pv-d-nav-links { display: none; }
          .pv-d-burger { display: block; }
        }
      `}</style>

      <nav className="pv-d-nav" data-nav-tone={tone} data-condensed={condensed} aria-label="Main">
        <div className="pv-d-nav-inner">
          <Link href="/" className="pv-d-nav-mark">
            {HEADER.wordmark}
          </Link>
          <div className="pv-d-nav-links">
            {HEADER.links.map((l) => (
              <Link key={l.href} href={l.href} className="pv-d-nav-link">
                {l.label}
              </Link>
            ))}
            <Link href="/login" className="pv-d-nav-cta">
              {HEADER.logIn}
            </Link>
          </div>
          <button
            type="button"
            className="pv-d-burger"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            style={{ position: "relative", zIndex: 400 }}
          >
            <span style={open ? { transform: "translateY(7px) rotate(45deg)" } : undefined} />
            <span style={open ? { opacity: 0 } : undefined} />
            <span style={open ? { transform: "translateY(-7px) rotate(-45deg)" } : undefined} />
          </button>
        </div>
      </nav>

      <div
        className="pv-d-sheet"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none" }}
        aria-hidden={!open}
      >
        {HEADER.mobileLinks.map((l) => (
          <Link key={l.href} href={l.href} className="pv-d-sheet-link" onClick={() => setOpen(false)} tabIndex={open ? 0 : -1}>
            {l.label}
          </Link>
        ))}
        <Link href="/courses" className="pv-d-sheet-cta" onClick={() => setOpen(false)} tabIndex={open ? 0 : -1}>
          {HEADER.mobileCtaCourses}
        </Link>
        <Link href="/coaching#apply" className="pv-d-sheet-cta" onClick={() => setOpen(false)} tabIndex={open ? 0 : -1}>
          {HEADER.mobileCtaCoaching}
        </Link>
        <Link href="/login" className="pv-d-sheet-cta" onClick={() => setOpen(false)} tabIndex={open ? 0 : -1}>
          {HEADER.logIn}
        </Link>
      </div>
    </>
  )
}
