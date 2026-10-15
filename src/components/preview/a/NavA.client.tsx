"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { NAV_LINKS } from "../previewContent"

// DIRECTION A navigation — a masthead, not a header bar.
//
// Sits transparently over the cream page, then condenses onto a paper band
// with a single hairline once the reader leaves the masthead. The wordmark
// is set in the display serif at small size with wide tracking, the way a
// magazine sets its own name in the running head.
export default function NavA() {
  const [condensed, setCondensed] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let frame = 0
    const measure = () => {
      frame = 0
      setCondensed(window.scrollY > 120)
    }
    const schedule = () => {
      if (frame) return
      frame = window.requestAnimationFrame(measure)
    }
    measure()
    window.addEventListener("scroll", schedule, { passive: true })
    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener("scroll", schedule)
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
        .pv-a-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 400;
          display: flex; align-items: center; justify-content: space-between;
          padding: clamp(18px, 2vw, 28px) clamp(20px, 5vw, 72px);
          transition: background 700ms cubic-bezier(0.16,1,0.3,1), padding 700ms cubic-bezier(0.16,1,0.3,1), box-shadow 700ms ease;
        }
        .pv-a-nav[data-condensed="true"] {
          background: rgba(247,244,239,0.88);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          padding-top: 14px; padding-bottom: 14px;
          box-shadow: inset 0 -1px 0 rgba(18,17,16,0.1);
        }
        .pv-a-wordmark {
          font-family: var(--font-playfair), serif;
          font-size: clamp(0.95rem, 1.05vw, 1.15rem);
          font-weight: 500; letter-spacing: 0.26em; text-transform: uppercase;
          color: #121110; text-decoration: none; white-space: nowrap;
        }
        .pv-a-nav-links { display: flex; align-items: center; gap: clamp(20px, 2.4vw, 38px); }
        .pv-a-nav-link {
          position: relative;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 11px; font-weight: 500; letter-spacing: 0.2em; text-transform: uppercase;
          color: rgba(18,17,16,0.62); text-decoration: none; padding-bottom: 3px;
        }
        .pv-a-nav-link::after {
          content: ""; position: absolute; left: 0; bottom: 0; height: 1px; width: 100%;
          background: #a8895e; transform: scaleX(0); transform-origin: left;
          transition: transform 620ms cubic-bezier(0.16,1,0.3,1);
        }
        .pv-a-nav-link:hover { color: #121110; }
        .pv-a-nav-link:hover::after { transform: scaleX(1); }
        .pv-a-nav-cta {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 10.5px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase;
          color: #121110; text-decoration: none;
          padding: 11px 22px; border: 1px solid rgba(18,17,16,0.24);
          transition: background 520ms ease, color 520ms ease, border-color 520ms ease;
        }
        .pv-a-nav-cta:hover { background: #121110; color: #f7f4ef; border-color: #121110; }
        .pv-a-burger { display: none; background: none; border: none; cursor: pointer; padding: 6px; }
        .pv-a-burger span { display: block; width: 24px; height: 1px; background: #121110; margin: 6px 0; transition: transform 420ms ease, opacity 300ms ease; }
        .pv-a-sheet {
          position: fixed; inset: 0; z-index: 390; background: #f7f4ef;
          display: flex; flex-direction: column; justify-content: center;
          padding: 0 28px; gap: 4px;
          transition: opacity 620ms cubic-bezier(0.16,1,0.3,1), transform 620ms cubic-bezier(0.16,1,0.3,1);
        }
        .pv-a-sheet-link {
          font-family: var(--font-playfair), serif; font-size: clamp(2rem, 11vw, 3rem);
          font-weight: 400; color: #121110; text-decoration: none; line-height: 1.25;
          border-bottom: 1px solid rgba(18,17,16,0.1); padding: 14px 0;
        }
        @media (max-width: 900px) {
          .pv-a-nav-links { display: none; }
          .pv-a-burger { display: block; }
        }
      `}</style>

      <nav className="pv-a-nav" data-condensed={condensed} aria-label="Main">
        <Link href="/preview/a" className="pv-a-wordmark">
          Lisa Fit Method
        </Link>

        <div className="pv-a-nav-links">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="pv-a-nav-link">
              {l.label}
            </Link>
          ))}
          <Link href="/coaching#apply" className="pv-a-nav-cta">
            Apply
          </Link>
        </div>

        <button
          type="button"
          className="pv-a-burger"
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
        className="pv-a-sheet"
        style={{
          opacity: open ? 1 : 0,
          transform: open ? "none" : "translateY(-12px)",
          pointerEvents: open ? "auto" : "none",
        }}
        aria-hidden={!open}
      >
        {NAV_LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="pv-a-sheet-link" onClick={() => setOpen(false)} tabIndex={open ? 0 : -1}>
            {l.label}
          </Link>
        ))}
        <Link
          href="/coaching#apply"
          className="pv-a-sheet-link"
          style={{ color: "#a8895e", borderBottom: "none" }}
          onClick={() => setOpen(false)}
          tabIndex={open ? 0 : -1}
        >
          Apply for coaching
        </Link>
      </div>
    </>
  )
}
