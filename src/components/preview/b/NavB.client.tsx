"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { NAV_LINKS } from "../previewContent"

// DIRECTION B navigation — a title card that becomes a bar.
//
// Over the full-bleed hero it floats with no background at all, so the film
// reads edge to edge. Past the hero it settles onto smoked glass with a
// single gold hairline.
export default function NavB() {
  const [solid, setSolid] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let frame = 0
    const measure = () => {
      frame = 0
      setSolid(window.scrollY > window.innerHeight * 0.72)
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
        .pv-b-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 420;
          display: flex; align-items: center; justify-content: space-between;
          padding: clamp(20px, 2.4vw, 34px) clamp(20px, 5vw, 72px);
          transition: background 800ms cubic-bezier(0.16,1,0.3,1), padding 800ms cubic-bezier(0.16,1,0.3,1), box-shadow 800ms ease;
        }
        .pv-b-nav[data-solid="true"] {
          background: rgba(8,8,10,0.74);
          backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
          padding-top: 15px; padding-bottom: 15px;
          box-shadow: inset 0 -1px 0 rgba(201,169,110,0.2);
        }
        .pv-b-wordmark {
          font-family: var(--font-cormorant), serif; font-weight: 400;
          font-size: clamp(1.05rem, 1.25vw, 1.35rem); letter-spacing: 0.3em; text-transform: uppercase;
          color: #f0e6d3; text-decoration: none; white-space: nowrap;
        }
        .pv-b-nav-links { display: flex; align-items: center; gap: clamp(20px, 2.5vw, 40px); }
        .pv-b-nav-link {
          position: relative; font-family: var(--font-montserrat), sans-serif;
          font-size: 10px; font-weight: 500; letter-spacing: 0.24em; text-transform: uppercase;
          color: rgba(240,230,211,0.6); text-decoration: none; padding-bottom: 4px;
          transition: color 520ms ease;
        }
        .pv-b-nav-link::after {
          content: ""; position: absolute; left: 0; bottom: 0; height: 1px; width: 100%;
          background: #c9a96e; transform: scaleX(0); transform-origin: left;
          transition: transform 680ms cubic-bezier(0.16,1,0.3,1);
        }
        .pv-b-nav-link:hover { color: #f0e6d3; }
        .pv-b-nav-link:hover::after { transform: scaleX(1); }
        .pv-b-nav-cta {
          font-family: var(--font-montserrat), sans-serif; font-size: 9.5px; font-weight: 600;
          letter-spacing: 0.24em; text-transform: uppercase; color: #c9a96e; text-decoration: none;
          padding: 12px 24px; border: 1px solid rgba(201,169,110,0.4);
          transition: background 520ms ease, color 520ms ease;
        }
        .pv-b-nav-cta:hover { background: #c9a96e; color: #08080a; }
        .pv-b-burger { display: none; background: none; border: none; cursor: pointer; padding: 6px; }
        .pv-b-burger span { display: block; width: 24px; height: 1px; background: #f0e6d3; margin: 6px 0; transition: transform 420ms ease, opacity 300ms ease; }
        .pv-b-sheet {
          position: fixed; inset: 0; z-index: 410; background: #08080a;
          display: flex; flex-direction: column; justify-content: center; padding: 0 28px;
          transition: opacity 680ms cubic-bezier(0.16,1,0.3,1);
        }
        .pv-b-sheet-link {
          font-family: var(--font-cormorant), serif; font-weight: 300;
          font-size: clamp(2.1rem, 11vw, 3.2rem); color: #f0e6d3; text-decoration: none;
          line-height: 1.3; padding: 14px 0; border-bottom: 1px solid rgba(201,169,110,0.16);
        }
        @media (max-width: 900px) {
          .pv-b-nav-links { display: none; }
          .pv-b-burger { display: block; }
        }
      `}</style>

      <nav className="pv-b-nav" data-solid={solid} aria-label="Main">
        <Link href="/preview/b" className="pv-b-wordmark">
          Lisa Fit Method
        </Link>
        <div className="pv-b-nav-links">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="pv-b-nav-link">
              {l.label}
            </Link>
          ))}
          <Link href="/coaching#apply" className="pv-b-nav-cta">
            Apply
          </Link>
        </div>
        <button
          type="button"
          className="pv-b-burger"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          style={{ position: "relative", zIndex: 420 }}
        >
          <span style={open ? { transform: "translateY(7px) rotate(45deg)" } : undefined} />
          <span style={open ? { opacity: 0 } : undefined} />
          <span style={open ? { transform: "translateY(-7px) rotate(-45deg)" } : undefined} />
        </button>
      </nav>

      <div
        className="pv-b-sheet"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none" }}
        aria-hidden={!open}
      >
        {NAV_LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="pv-b-sheet-link" onClick={() => setOpen(false)} tabIndex={open ? 0 : -1}>
            {l.label}
          </Link>
        ))}
        <Link
          href="/coaching#apply"
          className="pv-b-sheet-link"
          style={{ color: "#c9a96e", borderBottom: "none" }}
          onClick={() => setOpen(false)}
          tabIndex={open ? 0 : -1}
        >
          Apply for coaching
        </Link>
      </div>
    </>
  )
}
