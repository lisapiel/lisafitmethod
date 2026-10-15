"use client"

import Link from "next/link"
import { useState } from "react"

type Direction = "a" | "b"
type Device = "desktop" | "mobile"

const DIRECTIONS: Record<Direction, { name: string; tag: string; blurb: string; notes: string[] }> = {
  a: {
    name: "Direction A",
    tag: "Atelier",
    blurb:
      "Light, editorial, print-led. Warm paper ground, Playfair Display set very large with tight leading, hairline rules, and a numbered section structure. The film arrives as a cinematic plate inset to the page gutter rather than as a background.",
    notes: [
      "Playfair Display + DM Sans",
      "Warm paper #f7f4ef, ink #121110, gold used only as hairlines and small caps",
      "Movement library presented as a hoverable index with a sticky plate",
      "Reads as a magazine feature: calm, confident, lots of air",
    ],
  },
  b: {
    name: "Direction B",
    tag: "Nocturne",
    blurb:
      "Dark, cinematic, luxury. Full-bleed 100vh film opening, a pinned statement panel the page scrolls through, Cormorant Garamond display type, gold light, and a horizontal film rail for the movement library.",
    notes: [
      "Cormorant Garamond + Montserrat",
      "Near-black #08080a with gold #c9a96e and a fine film grain",
      "Movement library presented as a horizontal reel that wakes on hover",
      "Reads as a brand film: moodier, more immersive, more premium-luxury",
    ],
  },
}

const DEVICE_SIZES: Record<Device, { w: number; h: number; label: string }> = {
  desktop: { w: 1440, h: 900, label: "Desktop · 1440 × 900" },
  mobile: { w: 390, h: 844, label: "Mobile · 390 × 844 (iPhone 15)" },
}

export default function PreviewConsoleClient() {
  const [dir, setDir] = useState<Direction>("a")
  const [device, setDevice] = useState<Device>("desktop")
  const [frameKey, setFrameKey] = useState(0)

  const size = DEVICE_SIZES[device]
  // The frame renders at true device width and is then scaled down to fit the
  // console column, so what you see is a real layout at that viewport rather
  // than a narrow window of it.
  const scale = device === "desktop" ? 0.62 : 1

  return (
    <main className="pv-console">
      <style>{`
        .pv-console {
          min-height: 100vh; background: #141416; color: #e8e6e3;
          font-family: var(--font-dm-sans), sans-serif;
          padding: clamp(28px, 4vw, 56px) clamp(16px, 4vw, 48px) 80px;
        }
        .pv-console-inner { max-width: 1240px; margin: 0 auto; }
        .pv-console-kicker {
          font-size: 10px; font-weight: 600; letter-spacing: 0.3em; text-transform: uppercase;
          color: #c9a96e; margin: 0 0 16px;
        }
        .pv-console-h1 {
          font-family: var(--font-playfair), serif; font-size: clamp(1.8rem, 4vw, 3rem);
          font-weight: 500; line-height: 1.1; color: #fff; margin: 0 0 14px;
        }
        .pv-console-lede { font-size: 0.95rem; line-height: 1.75; color: rgba(232,230,227,0.6); max-width: 70ch; margin: 0 0 32px; }
        .pv-safety {
          border: 1px solid rgba(110,200,140,0.3); background: rgba(110,200,140,0.06);
          padding: 18px 22px; margin-bottom: 36px; border-radius: 4px;
        }
        .pv-safety h2 { font-size: 11px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: #8fd6a8; margin: 0 0 12px; }
        .pv-safety ul { margin: 0; padding-left: 18px; list-style: disc; }
        .pv-safety li { font-size: 0.84rem; line-height: 1.8; color: rgba(232,230,227,0.72); }
        .pv-safety code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.78rem; background: rgba(255,255,255,0.08); padding: 2px 6px; border-radius: 3px; }
        .pv-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 40px; }
        .pv-card {
          border: 1px solid rgba(255,255,255,0.12); background: #1b1b1e; padding: 26px 28px;
          display: flex; flex-direction: column; border-radius: 4px;
          transition: border-color 500ms ease, transform 600ms cubic-bezier(0.16,1,0.3,1);
        }
        .pv-card[data-active="true"] { border-color: rgba(201,169,110,0.6); }
        .pv-card:hover { transform: translateY(-3px); }
        .pv-card-name { font-family: var(--font-playfair), serif; font-size: 1.5rem; font-weight: 500; color: #fff; margin: 0 0 4px; }
        .pv-card-tag { font-size: 10px; font-weight: 600; letter-spacing: 0.26em; text-transform: uppercase; color: #c9a96e; margin: 0 0 16px; }
        .pv-card-blurb { font-size: 0.86rem; line-height: 1.75; color: rgba(232,230,227,0.6); margin: 0 0 18px; }
        .pv-card-notes { list-style: none; margin: 0 0 22px; padding: 0; flex: 1; }
        .pv-card-notes li {
          font-size: 0.78rem; line-height: 1.6; color: rgba(232,230,227,0.52);
          padding: 8px 0; border-top: 1px solid rgba(255,255,255,0.07);
          display: grid; grid-template-columns: 14px 1fr; gap: 8px;
        }
        .pv-card-notes li span { color: rgba(201,169,110,0.7); }
        .pv-card-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .pv-btn {
          font-size: 10px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase;
          padding: 12px 20px; text-decoration: none; cursor: pointer; border: none; border-radius: 3px;
          background: #c9a96e; color: #141416; font-family: inherit;
        }
        .pv-btn-ghost { background: transparent; color: rgba(232,230,227,0.75); border: 1px solid rgba(255,255,255,0.18); }
        .pv-toolbar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 14px; }
        .pv-toolbar-label { font-size: 10px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: rgba(232,230,227,0.4); margin-right: 4px; }
        .pv-seg { display: inline-flex; border: 1px solid rgba(255,255,255,0.14); border-radius: 3px; overflow: hidden; }
        .pv-seg button {
          font-family: inherit; font-size: 10px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase;
          padding: 10px 16px; background: transparent; color: rgba(232,230,227,0.6); border: none; cursor: pointer;
          transition: background 320ms ease, color 320ms ease;
        }
        .pv-seg button[data-on="true"] { background: #c9a96e; color: #141416; }
        .pv-stage {
          border: 1px solid rgba(255,255,255,0.12); background: #0e0e10; border-radius: 4px;
          padding: 18px; overflow: hidden;
        }
        .pv-stage-meta { font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(232,230,227,0.35); margin: 0 0 14px; }
        .pv-stage-scroll { overflow: auto; display: flex; justify-content: center; }
        .pv-frame-shell { flex: 0 0 auto; }
        .pv-frame {
          border: 0; display: block; background: #fff;
          box-shadow: 0 30px 80px -40px rgba(0,0,0,0.9);
        }
        @media (max-width: 900px) {
          .pv-cards { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="pv-console-inner">
        <p className="pv-console-kicker">Internal review · not published</p>
        <h1 className="pv-console-h1">Homepage redesign — two directions</h1>
        <p className="pv-console-lede">
          Two complete, working homepage prototypes built on your real video, photography, copy and prices. Open either
          one full-screen, or compare them in the frame below at desktop and phone size. Nothing here is live, and
          nothing has been deployed.
        </p>

        <section className="pv-safety">
          <h2>Production status: unchanged</h2>
          <ul>
            <li>
              This prototype lives only on the local branch <code>redesign/premium-homepage</code>. It has not been
              pushed, merged, or deployed.
            </li>
            <li>
              lisafitmethod.com is still serving <code>main</code>. Your live homepage, checkout, logins, courses,
              dashboards, coaching and admin are untouched.
            </li>
            <li>
              These pages only <em>read</em> published media and settings. No Stripe call, no account, no database
              write, and no environment variable is involved.
            </li>
            <li>
              Testimonials shown are the two <strong>draft</strong> records already staged in your admin, clearly
              marked DRAFT. Nothing was published on your behalf.
            </li>
          </ul>
        </section>

        <div className="pv-cards">
          {(["a", "b"] as Direction[]).map((key) => {
            const d = DIRECTIONS[key]
            return (
              <article key={key} className="pv-card" data-active={dir === key}>
                <h2 className="pv-card-name">{d.name}</h2>
                <p className="pv-card-tag">{d.tag}</p>
                <p className="pv-card-blurb">{d.blurb}</p>
                <ul className="pv-card-notes">
                  {d.notes.map((n) => (
                    <li key={n}>
                      <span aria-hidden="true">&#9671;</span>
                      {n}
                    </li>
                  ))}
                </ul>
                <div className="pv-card-actions">
                  <Link href={`/preview/${key}`} className="pv-btn">
                    Open full page
                  </Link>
                  <button
                    type="button"
                    className="pv-btn pv-btn-ghost"
                    onClick={() => {
                      setDir(key)
                      setFrameKey((k) => k + 1)
                    }}
                  >
                    Show in frame
                  </button>
                </div>
              </article>
            )
          })}
        </div>

        <div className="pv-toolbar">
          <span className="pv-toolbar-label">Direction</span>
          <div className="pv-seg">
            {(["a", "b"] as Direction[]).map((key) => (
              <button key={key} type="button" data-on={dir === key} onClick={() => setDir(key)}>
                {DIRECTIONS[key].tag}
              </button>
            ))}
          </div>
          <span className="pv-toolbar-label" style={{ marginLeft: 10 }}>
            Viewport
          </span>
          <div className="pv-seg">
            {(["desktop", "mobile"] as Device[]).map((key) => (
              <button key={key} type="button" data-on={device === key} onClick={() => setDevice(key)}>
                {key}
              </button>
            ))}
          </div>
          <button type="button" className="pv-btn pv-btn-ghost" onClick={() => setFrameKey((k) => k + 1)}>
            Reload frame
          </button>
        </div>

        <section className="pv-stage">
          <p className="pv-stage-meta">
            {DIRECTIONS[dir].name} · {DIRECTIONS[dir].tag} — {size.label}
            {device === "desktop" ? " · shown at 62% to fit" : ""}
          </p>
          <div className="pv-stage-scroll">
            <div className="pv-frame-shell" style={{ width: size.w * scale, height: size.h * scale }}>
              <iframe
                key={`${dir}-${device}-${frameKey}`}
                src={`/preview/${dir}`}
                title={`${DIRECTIONS[dir].name} preview at ${size.label}`}
                className="pv-frame"
                width={size.w}
                height={size.h}
                style={{
                  width: size.w,
                  height: size.h,
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                }}
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
