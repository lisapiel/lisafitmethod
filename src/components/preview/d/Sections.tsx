import Link from "next/link"
import { Reveal, RevealLines, DrawRule } from "../Reveal.client"
import { Atmosphere } from "./FlowD"

// Shared Direction D section furniture for the inner pages.
//
// The homepage builds each of its sections as a bespoke component because
// each one earns its own layout. The inner pages do not: they are mostly
// eyebrow, headline, prose and a list, repeated. Putting that furniture here
// means every inner page inherits the same rhythm instead of six near-copies
// drifting apart, and it is why the whole site reads as one design.

export function SectionD({
  tone = "light",
  alt = false,
  id,
  label,
  backdrop,
  opacity = 0.2,
  scrim = "edges",
  position = "center 50%",
  className,
  children,
}: {
  tone?: "light" | "dark"
  alt?: boolean
  id?: string
  label?: string
  backdrop?: string
  opacity?: number
  scrim?: "center" | "left" | "right" | "edges" | "flat"
  position?: string
  className?: string
  children: React.ReactNode
}) {
  const ground = tone === "dark" ? "pv-d-dark" : alt ? "pv-d-light-alt" : "pv-d-light"
  return (
    <section
      id={id}
      aria-label={label}
      data-tone={tone}
      className={`pv-d-section ${ground}${className ? " " + className : ""}`}
    >
      {backdrop && (
        <Atmosphere src={backdrop} tone={tone} opacity={opacity} position={position} scrim={scrim} />
      )}
      <div className="pv-d-inner pv-d-above">{children}</div>
    </section>
  )
}

export function OpenD({
  eyebrow,
  lines,
  lede,
  centre = false,
  maxWidth,
  aside,
}: {
  eyebrow: string
  lines: React.ReactNode[]
  lede?: string
  centre?: boolean
  maxWidth?: string
  // A link that sits on the headline's baseline, like "See all questions".
  aside?: React.ReactNode
}) {
  return (
    <div className={`pv-d-open${centre ? " pv-d-open--centre" : ""}`}>
      <style>{`
        .pv-d-open-head { display: flex; align-items: baseline; justify-content: space-between; gap: var(--d-step-3); flex-wrap: wrap; }
        .pv-d-open-head .pv-d-h2 { margin: 0; }
        .pv-d-open-lede {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
          font-size: clamp(0.98rem, 1.15vw, 1.1rem); line-height: 1.8;
          margin: var(--d-step-3) 0 0; max-width: 62ch;
        }
        .pv-d-light .pv-d-open-lede, .pv-d-light-alt .pv-d-open-lede { color: var(--d-muted); }
        .pv-d-dark .pv-d-open-lede { color: rgba(245,242,238,0.6); }
        .pv-d-open--centre .pv-d-open-lede { margin-left: auto; margin-right: auto; }
        .pv-d-open-aside {
          font-family: var(--font-dm-sans), sans-serif; font-size: 11.5px; font-weight: 500;
          letter-spacing: 0.13em; text-transform: uppercase; white-space: nowrap;
          color: var(--d-accent-dark); text-decoration: none;
          border-bottom: 1px solid rgba(168,137,94,0.4); padding-bottom: 2px;
        }
      `}</style>
      <p className="pv-d-eyebrow">{eyebrow}</p>
      <div className="pv-d-open-rule">
        <DrawRule color="rgba(168,137,94,0.5)" />
      </div>
      <div className="pv-d-open-head">
        <h2 className="pv-d-display pv-d-h2" style={maxWidth ? { maxWidth } : undefined}>
          <RevealLines lines={lines} stagger={120} />
        </h2>
        {aside}
      </div>
      {lede && (
        <Reveal variant="up" delay={160}>
          <p className="pv-d-open-lede">{lede}</p>
        </Reveal>
      )}
    </div>
  )
}

// A hairline-ruled list. Used for benefit lists, qualifier lists and the
// "what's inside" bullet runs. No boxes anywhere, per the homepage language.
export function MarkerListD({
  items,
  marker = "arrow",
  columns = 1,
  label,
}: {
  items: string[]
  marker?: "arrow" | "check"
  columns?: 1 | 2
  label?: string
}) {
  return (
    <div>
      <style>{`
        .pv-d-mlist { list-style: none; margin: 0; padding: 0; }
        .pv-d-mlist--2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0 clamp(26px, 3vw, 56px); }
        @media (max-width: 760px) { .pv-d-mlist--2 { grid-template-columns: 1fr; } }
        .pv-d-mlist li {
          display: flex; gap: 14px; align-items: flex-start;
          padding: var(--d-step-2) 0;
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
          font-size: clamp(0.9rem, 1.02vw, 0.98rem); line-height: 1.65;
        }
        .pv-d-light .pv-d-mlist li, .pv-d-light-alt .pv-d-mlist li { color: rgba(26,26,26,0.68); border-bottom: 1px solid var(--d-rule); }
        .pv-d-dark .pv-d-mlist li { color: rgba(245,242,238,0.62); border-bottom: 1px solid var(--d-rule-dark); }
        .pv-d-mlist-mark { flex-shrink: 0; font-size: 11px; line-height: 1.9; color: var(--d-accent-dark); }
        .pv-d-dark .pv-d-mlist-mark { color: var(--d-accent); }
        .pv-d-mlist-label { margin-bottom: var(--d-step-2); }
      `}</style>
      {label && <p className="pv-d-eyebrow pv-d-mlist-label">{label}</p>}
      {/* One reveal around the whole list: a Reveal renders a div, which is
          not valid inside a ul, and a per-item stagger on a short run reads
          as jitter rather than rhythm. */}
      <Reveal variant="up">
        <ul className={`pv-d-mlist${columns === 2 ? " pv-d-mlist--2" : ""}`}>
          {items.map((item) => (
            <li key={item}>
              <span className="pv-d-mlist-mark" aria-hidden="true">
                {marker === "check" ? "✓" : "→"}
              </span>
              {item}
            </li>
          ))}
        </ul>
      </Reveal>
    </div>
  )
}

// The numbered module rail: an editorial run of modules with a hairline
// between each, rather than a grid of cards.
export function ModuleRailD({
  modules,
  label,
}: {
  modules: { num: string; tag?: string; title: string; desc?: string; items?: readonly string[] }[]
  label?: string
}) {
  return (
    <div className="pv-d-rail">
      <style>{`
        .pv-d-rail-label { margin-bottom: var(--d-step-3); }
        .pv-d-rail-row {
          display: grid; grid-template-columns: 76px minmax(0, 1fr);
          gap: clamp(16px, 2.4vw, 40px);
          padding: var(--d-step-4) 0;
        }
        .pv-d-light .pv-d-rail-row, .pv-d-light-alt .pv-d-rail-row { border-top: 1px solid var(--d-rule); }
        .pv-d-dark .pv-d-rail-row { border-top: 1px solid var(--d-rule-dark); }
        .pv-d-rail-row:last-child { padding-bottom: 0; }
        @media (max-width: 680px) {
          .pv-d-rail-row { grid-template-columns: 1fr; gap: var(--d-step-2); padding: var(--d-step-3) 0; }
        }
        .pv-d-rail-num {
          font-family: var(--font-playfair), serif; font-size: clamp(1.5rem, 2.4vw, 2.1rem);
          line-height: 1; color: rgba(168,137,94,0.55); font-weight: 500;
        }
        .pv-d-dark .pv-d-rail-num { color: rgba(200,169,126,0.6); }
        .pv-d-rail-tag {
          font-family: var(--font-dm-sans), sans-serif; font-size: 9.5px; font-weight: 600;
          letter-spacing: 0.2em; text-transform: uppercase; color: var(--d-accent-dark);
          margin: 0 0 var(--d-step-1);
        }
        .pv-d-dark .pv-d-rail-tag { color: rgba(200,169,126,0.8); }
        .pv-d-rail-title {
          font-family: var(--font-playfair), serif; font-weight: 500;
          font-size: clamp(1.15rem, 1.7vw, 1.5rem); line-height: 1.3; margin: 0;
        }
        .pv-d-rail-desc {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
          font-size: clamp(0.88rem, 1vw, 0.96rem); line-height: 1.7;
          margin: var(--d-step-1) 0 0; max-width: 56ch;
        }
        .pv-d-light .pv-d-rail-desc, .pv-d-light-alt .pv-d-rail-desc { color: var(--d-muted); }
        .pv-d-dark .pv-d-rail-desc { color: rgba(245,242,238,0.55); }
        .pv-d-rail-items { list-style: none; margin: var(--d-step-2) 0 0; padding: 0; columns: 2; column-gap: clamp(20px, 2.6vw, 48px); }
        @media (max-width: 680px) { .pv-d-rail-items { columns: 1; } }
        .pv-d-rail-items li {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
          font-size: clamp(0.84rem, 0.94vw, 0.92rem); line-height: 1.6;
          padding: 5px 0 5px 15px; position: relative; break-inside: avoid;
        }
        .pv-d-light .pv-d-rail-items li, .pv-d-light-alt .pv-d-rail-items li { color: rgba(26,26,26,0.6); }
        .pv-d-dark .pv-d-rail-items li { color: rgba(245,242,238,0.5); }
        .pv-d-rail-items li::before {
          content: "→"; position: absolute; left: 0; top: 5px;
          font-size: 10px; color: rgba(168,137,94,0.75);
        }
        .pv-d-dark .pv-d-rail-items li::before { color: rgba(200,169,126,0.7); }
      `}</style>
      {label && <p className="pv-d-eyebrow pv-d-rail-label">{label}</p>}
      {modules.map((m, i) => (
        <Reveal key={m.num + m.title} variant="up" delay={Math.min(i * 90, 360)} className="pv-d-rail-row">
          <span className="pv-d-rail-num">{m.num}</span>
          <div>
            {m.tag && <p className="pv-d-rail-tag">{m.tag}</p>}
            <h3 className="pv-d-rail-title">{m.title}</h3>
            {m.desc && <p className="pv-d-rail-desc">{m.desc}</p>}
            {m.items && (
              <ul className="pv-d-rail-items">
                {m.items.map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ul>
            )}
          </div>
        </Reveal>
      ))}
    </div>
  )
}

// Price, note and call to action. Shares the homepage bundle's figure
// treatment so a price never looks like a different component dropped in.
export function PriceBlockD({
  now,
  was,
  noteLines,
  cta,
  href,
  ctaVariant = "primary",
  points,
  marker = "check",
  secondary,
  secondaryHref,
  align = "start",
}: {
  now: string
  was?: string
  noteLines?: string[]
  cta: string
  href: string
  ctaVariant?: "primary" | "gold" | "outline" | "ghost-dark"
  points?: string[]
  marker?: "arrow" | "check"
  secondary?: string
  secondaryHref?: string
  align?: "start" | "center"
}) {
  return (
    <div className="pv-d-price" style={align === "center" ? { textAlign: "center" } : undefined}>
      <style>{`
        .pv-d-price-row { display: flex; align-items: baseline; gap: 16px; flex-wrap: wrap; margin-bottom: var(--d-step-2); }
        .pv-d-price[style*="center"] .pv-d-price-row { justify-content: center; }
        .pv-d-price-now {
          font-family: var(--font-playfair), serif; font-weight: 500; line-height: 0.88;
          font-size: clamp(2.6rem, 4.6vw, 3.9rem); color: var(--d-accent-dark);
        }
        .pv-d-dark .pv-d-price-now { color: var(--d-accent); }
        .pv-d-price-was {
          font-family: var(--font-dm-sans), sans-serif; font-size: 0.85rem; text-decoration: line-through;
          color: rgba(26,26,26,0.3);
        }
        .pv-d-dark .pv-d-price-was { color: rgba(245,242,238,0.3); }
        .pv-d-price-note {
          font-family: var(--font-dm-sans), sans-serif; font-size: 11.5px; line-height: 1.7;
          color: rgba(26,26,26,0.42); margin: 0 0 var(--d-step-3);
        }
        .pv-d-dark .pv-d-price-note { color: rgba(245,242,238,0.34); }
        .pv-d-price-points { margin-top: var(--d-step-3); }
        .pv-d-price-secondary {
          display: inline-block; margin-top: var(--d-step-3);
          font-family: var(--font-dm-sans), sans-serif; font-size: 11.5px; letter-spacing: 0.1em;
          text-transform: uppercase; color: var(--d-accent-dark); text-decoration: none;
          border-bottom: 1px solid rgba(168,137,94,0.4); padding-bottom: 2px;
        }
        .pv-d-dark .pv-d-price-secondary { color: rgba(200,169,126,0.78); border-bottom-color: rgba(200,169,126,0.35); }
      `}</style>
      <Reveal variant="up">
        <div className="pv-d-price-row">
          <span className="pv-d-price-now">{now}</span>
          {was && <span className="pv-d-price-was">{was}</span>}
        </div>
        {noteLines && (
          <p className="pv-d-price-note">
            {noteLines.map((l, i) => (
              <span key={l}>
                {l}
                {i < noteLines.length - 1 ? <br /> : null}
              </span>
            ))}
          </p>
        )}
        <Link href={href} className={`pv-d-btn pv-d-btn--${ctaVariant}`}>
          <span>{cta}</span>
        </Link>
        {secondary && secondaryHref && (
          <div>
            <Link href={secondaryHref} className="pv-d-price-secondary">
              {secondary}
            </Link>
          </div>
        )}
      </Reveal>
      {points && (
        <div className="pv-d-price-points">
          <MarkerListD items={points} marker={marker} />
        </div>
      )}
    </div>
  )
}

// A static question-and-answer run, for the short FAQ excerpts that sit on
// product pages. The full /faq page uses the interactive accordion instead.
export function QaListD({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div>
      <style>{`
        .pv-d-qa { padding: var(--d-step-3) 0; }
        .pv-d-light .pv-d-qa, .pv-d-light-alt .pv-d-qa { border-bottom: 1px solid var(--d-rule); }
        .pv-d-dark .pv-d-qa { border-bottom: 1px solid var(--d-rule-dark); }
        .pv-d-qa-q {
          font-family: var(--font-playfair), serif; font-weight: 500;
          font-size: clamp(1rem, 1.3vw, 1.18rem); line-height: 1.4; margin: 0 0 var(--d-step-1);
        }
        .pv-d-qa-a {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
          font-size: clamp(0.88rem, 1vw, 0.96rem); line-height: 1.78; margin: 0; max-width: 72ch;
        }
        .pv-d-light .pv-d-qa-a, .pv-d-light-alt .pv-d-qa-a { color: var(--d-muted); }
        .pv-d-dark .pv-d-qa-a { color: rgba(245,242,238,0.58); }
      `}</style>
      {items.map((it, i) => (
        <Reveal key={it.q} variant="up" delay={Math.min(i * 70, 350)} className="pv-d-qa">
          <h3 className="pv-d-qa-q">{it.q}</h3>
          <p className="pv-d-qa-a">{it.a}</p>
        </Reveal>
      ))}
    </div>
  )
}
