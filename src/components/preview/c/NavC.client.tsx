"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { HEADER } from "./productionCopy"

// Direction C navigation — it inverts against the section behind it.
//
// This is the device that makes an alternating light/dark page read as one
// design. Rather than a bar that is always dark or always light, the nav
// samples the tone of whatever section currently sits under it and crossfades
// its own ground and type to match. Scrolling from the dark hero into the
// light story, the nav turns from cream-on-film to ink-on-paper without the
// reader noticing a boundary.
//
// Tone is read from section rects once per animation frame rather than with
// IntersectionObserver, because what matters is the single section crossing a
// specific line (the nav's own midpoint), not visibility ratios.
export default function NavC() {
  const [tone, setTone] = useState<"dark" | "light">("dark")
  const [condensed, setCondensed] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let frame = 0

    const measure = () => {
      frame = 0
      const probeY = 34
      const sections = document.querySelectorAll<HTMLElement>("[data-tone]")
      let next: "dark" | "light" | null = null
      for (const section of sections) {
        const rect = section.getBoundingClientRect()
        if (rect.top <= probeY && rect.bottom > probeY) {
          next = section.dataset.tone === "dark" ? "dark" : "light"
        }
      }
      if (next) setTone(next)
      setCondensed(window.scrollY > 90)
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
        .pv-c-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 400;
          display: flex; align-items: center; justify-content: space-between;
          padding: clamp(18px, 2.1vw, 28px) var(--c-gutter);
          transition: background 760ms cubic-bezier(0.16,1,0.3,1),
                      padding 760ms cubic-bezier(0.16,1,0.3,1),
                      box-shadow 760ms ease;
        }
        .pv-c-nav[data-condensed="true"] { padding-top: 13px; padding-bottom: 13px; }
        .pv-c-nav[data-condensed="true"][data-tone="dark"] {
          background: rgba(10,10,10,0.76);
          backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
          box-shadow: inset 0 -1px 0 rgba(200,169,126,0.18);
        }
        .pv-c-nav[data-condensed="true"][data-tone="light"] {
          background: rgba(250,248,245,0.84);
          backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
          box-shadow: inset 0 -1px 0 rgba(26,26,26,0.1);
        }
        .pv-c-nav-mark {
          font-family: var(--font-playfair), serif; font-weight: 500;
          font-size: clamp(0.95rem, 1.05vw, 1.15rem); letter-spacing: 0.26em;
          text-transform: uppercase; text-decoration: none; white-space: nowrap;
          transition: color 760ms cubic-bezier(0.16,1,0.3,1);
        }
        .pv-c-nav[data-tone="dark"] .pv-c-nav-mark { color: var(--c-off-white); }
        .pv-c-nav[data-tone="light"] .pv-c-nav-mark { color: var(--c-text); }

        .pv-c-nav-links { display: flex; align-items: center; gap: clamp(18px, 2.3vw, 36px); }
        .pv-c-nav-link {
          position: relative; font-family: var(--font-dm-sans), sans-serif;
          font-size: 11px; font-weight: 500; letter-spacing: 0.2em;
          text-transform: uppercase; text-decoration: none; padding-bottom: 3px;
          transition: color 760ms cubic-bezier(0.16,1,0.3,1);
        }
        .pv-c-nav[data-tone="dark"] .pv-c-nav-link { color: rgba(245,242,238,0.62); }
        .pv-c-nav[data-tone="light"] .pv-c-nav-link { color: rgba(26,26,26,0.62); }
        .pv-c-nav[data-tone="dark"] .pv-c-nav-link:hover { color: var(--c-off-white); }
        .pv-c-nav[data-tone="light"] .pv-c-nav-link:hover { color: var(--c-text); }
        .pv-c-nav-link::after {
          content: ""; position: absolute; left: 0; bottom: 0; height: 1px; width: 100%;
          background: var(--c-accent); transform: scaleX(0); transform-origin: left;
          transition: transform 620ms cubic-bezier(0.16,1,0.3,1);
        }
        .pv-c-nav-link:hover::after { transform: scaleX(1); }

        .pv-c-nav-cta {
          font-family: var(--font-dm-sans), sans-serif; font-size: 10px; font-weight: 600;
          letter-spacing: 0.2em; text-transform: uppercase; text-decoration: none;
          padding: 11px 22px; border: 1px solid;
          transition: background 520ms ease, color 520ms ease, border-color 760ms ease;
        }
        .pv-c-nav[data-tone="dark"] .pv-c-nav-cta { color: var(--c-accent); border-color: rgba(200,169,126,0.4); }
        .pv-c-nav[data-tone="dark"] .pv-c-nav-cta:hover { background: var(--c-accent); color: var(--c-black); }
        .pv-c-nav[data-tone="light"] .pv-c-nav-cta { color: var(--c-text); border-color: rgba(26,26,26,0.24); }
        .pv-c-nav[data-tone="light"] .pv-c-nav-cta:hover { background: var(--c-text); color: var(--c-warm-white); }

        .pv-c-burger { display: none; background: none; border: none; cursor: pointer; padding: 6px; }
        .pv-c-burger span {
          display: block; width: 24px; height: 1px; margin: 6px 0;
          transition: transform 420ms ease, opacity 300ms ease, background 760ms ease;
        }
        .pv-c-nav[data-tone="dark"] .pv-c-burger span { background: var(--c-off-white); }
        .pv-c-nav[data-tone="light"] .pv-c-burger span { background: var(--c-text); }

        .pv-c-sheet {
          position: fixed; inset: 0; z-index: 390; background: var(--c-black);
          display: flex; flex-direction: column; justify-content: center;
          padding: 0 28px; transition: opacity 620ms cubic-bezier(0.16,1,0.3,1);
        }
        .pv-c-sheet-link {
          font-family: var(--font-playfair), serif; font-weight: 400;
          font-size: clamp(1.6rem, 8vw, 2.3rem); color: var(--c-off-white);
          text-decoration: none; line-height: 1.3; padding: 11px 0;
          border-bottom: 1px solid rgba(200,169,126,0.16);
        }
        .pv-c-sheet-cta {
          font-family: var(--font-dm-sans), sans-serif; font-size: 11px; font-weight: 600;
          letter-spacing: 0.2em; text-transform: uppercase; color: var(--c-accent);
          text-decoration: none; padding: 14px 0;
        }
        @media (max-width: 960px) {
          .pv-c-nav-links { display: none; }
          .pv-c-burger { display: block; }
        }
      `}</style>

      <nav className="pv-c-nav" data-tone={tone} data-condensed={condensed} aria-label="Main">
        <Link href="/preview/c" className="pv-c-nav-mark">
          {HEADER.wordmark}
        </Link>

        <div className="pv-c-nav-links">
          {HEADER.links.map((l) => (
            <Link key={l.href} href={l.href} className="pv-c-nav-link">
              {l.label}
            </Link>
          ))}
          <Link href="/login" className="pv-c-nav-cta">
            {HEADER.logIn}
          </Link>
        </div>

        <button
          type="button"
          className="pv-c-burger"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          style={{ position: "relative", zIndex: 400 }}
        >
          <span style={open ? { transform: "translateY(7px) rotate(45deg)" } : undefined} />
          <span style={open ? { opacity: 0 } : undefined} />
          <span style={open ? { transform: "translateY(-7px) rotate(-45deg)" } : undefined} />
        </button>
      </nav>

      <div
        className="pv-c-sheet"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none" }}
        aria-hidden={!open}
      >
        {HEADER.mobileLinks.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="pv-c-sheet-link"
            onClick={() => setOpen(false)}
            tabIndex={open ? 0 : -1}
          >
            {l.label}
          </Link>
        ))}
        <Link href="/courses" className="pv-c-sheet-cta" onClick={() => setOpen(false)} tabIndex={open ? 0 : -1}>
          {HEADER.mobileCtaCourses}
        </Link>
        <Link href="/coaching#apply" className="pv-c-sheet-cta" onClick={() => setOpen(false)} tabIndex={open ? 0 : -1}>
          {HEADER.mobileCtaCoaching}
        </Link>
        <Link href="/login" className="pv-c-sheet-cta" onClick={() => setOpen(false)} tabIndex={open ? 0 : -1}>
          {HEADER.logIn}
        </Link>
      </div>
    </>
  )
}
