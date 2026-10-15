// Direction C design system, injected once per page.
//
// Palette is strictly the documented brand tokens — black, off-white,
// warm-white, accent, accent-dark, text, muted. No new colours are
// introduced, because the point of this direction is the existing brand
// presented properly, not a different brand.
//
// The page alternates tone: dark sections carry the cinematic moments
// (hero, bundle, closing) and light sections carry the reading (story,
// courses, questions, guides). Every section declares `data-tone` so the
// navigation can invert itself against whatever sits behind it, which is
// what keeps the two tones reading as one design rather than two themes.
export function StylesC() {
  const grain =
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E\")"

  return (
    <style>{`
      .pv-c {
        --c-black: #0a0a0a;
        --c-off-white: #f5f2ee;
        --c-warm-white: #faf8f5;
        --c-accent: #c8a97e;
        --c-accent-dark: #a8895e;
        --c-text: #1a1a1a;
        --c-muted: #6b6560;
        --c-gutter: clamp(20px, 5vw, 80px);
        --c-measure: 68ch;
        font-family: var(--font-dm-sans), sans-serif;
        font-weight: 300;
      }

      /* ── Tone grounds ─────────────────────────────────────────────── */
      .pv-c-dark { background: var(--c-black); color: var(--c-off-white); position: relative; }
      .pv-c-light { background: var(--c-warm-white); color: var(--c-text); position: relative; }
      .pv-c-light-alt { background: var(--c-off-white); color: var(--c-text); position: relative; }

      /* Grain sits only on dark grounds. It is what stops a large black
         field reading as flat CSS and makes the film feel shot. */
      .pv-c-dark::before {
        content: ""; position: absolute; inset: 0; pointer-events: none;
        background-image: ${grain}; opacity: 0.04; mix-blend-mode: overlay;
      }

      .pv-c-section { padding: clamp(68px, 8.5vw, 140px) var(--c-gutter); }
      .pv-c-inner { max-width: 1180px; margin: 0 auto; }
      .pv-c-inner-narrow { max-width: 980px; margin: 0 auto; }

      /* ── Type ─────────────────────────────────────────────────────── */
      .pv-c-eyebrow {
        font-family: var(--font-dm-sans), sans-serif;
        font-size: 10.5px; font-weight: 600; letter-spacing: 0.28em;
        text-transform: uppercase; color: var(--c-accent-dark); margin: 0;
      }
      .pv-c-dark .pv-c-eyebrow { color: var(--c-accent); }

      .pv-c-display {
        font-family: var(--font-playfair), serif;
        font-weight: 500; line-height: 1.03; letter-spacing: -0.015em;
        color: var(--c-text); margin: 0; text-wrap: balance;
      }
      .pv-c-dark .pv-c-display { color: var(--c-off-white); }
      .pv-c-display i { font-style: italic; color: var(--c-accent-dark); }
      .pv-c-dark .pv-c-display i { color: var(--c-accent); }

      .pv-c-h2 { font-size: clamp(1.9rem, 4.2vw, 3.6rem); }
      .pv-c-h3 { font-size: clamp(1.25rem, 1.9vw, 1.8rem); line-height: 1.16; }

      .pv-c-body {
        font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
        font-size: clamp(0.95rem, 1.08vw, 1.0625rem); line-height: 1.78;
        color: var(--c-muted); margin: 0;
      }
      .pv-c-dark .pv-c-body { color: rgba(245,242,238,0.58); }

      /* ── Buttons ──────────────────────────────────────────────────── */
      .pv-c-btn {
        position: relative; overflow: hidden; display: inline-block;
        font-family: var(--font-dm-sans), sans-serif; font-size: 11px;
        font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase;
        text-decoration: none; padding: 17px 38px; text-align: center;
        transition: color 560ms cubic-bezier(0.16,1,0.3,1);
      }
      .pv-c-btn > span { position: relative; z-index: 1; }
      .pv-c-btn::before {
        content: ""; position: absolute; inset: 0; z-index: 0;
        transform: scaleY(0); transform-origin: bottom;
        transition: transform 620ms cubic-bezier(0.16,1,0.3,1);
      }
      .pv-c-btn:hover::before { transform: scaleY(1); }

      .pv-c-btn--gold { background: var(--c-accent); color: var(--c-black); }
      .pv-c-btn--gold::before { background: var(--c-off-white); }
      .pv-c-btn--gold:hover { color: var(--c-black); }

      .pv-c-btn--ink { background: var(--c-accent-dark); color: #fff; }
      .pv-c-btn--ink::before { background: var(--c-black); }
      .pv-c-btn--ink:hover { color: var(--c-off-white); }

      .pv-c-btn--ghost-dark { border: 1px solid rgba(200,169,126,0.35); color: rgba(245,242,238,0.85); }
      .pv-c-btn--ghost-dark::before { background: var(--c-accent); }
      .pv-c-btn--ghost-dark:hover { color: var(--c-black); }

      .pv-c-btn--ghost-light { border: 1px solid rgba(168,137,94,0.4); color: var(--c-accent-dark); }
      .pv-c-btn--ghost-light::before { background: var(--c-accent-dark); }
      .pv-c-btn--ghost-light:hover { color: #fff; }

      /* ── Quiet text links ─────────────────────────────────────────── */
      .pv-c-link {
        display: inline-flex; align-items: center; gap: 9px;
        font-family: var(--font-dm-sans), sans-serif; font-size: 10.5px;
        font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase;
        text-decoration: none; color: var(--c-accent-dark);
        border-bottom: 1px solid rgba(168,137,94,0.4); padding-bottom: 6px;
        transition: gap 520ms cubic-bezier(0.16,1,0.3,1), color 420ms ease, border-color 420ms ease;
      }
      .pv-c-link:hover { gap: 17px; color: var(--c-text); border-color: var(--c-text); }
      .pv-c-dark .pv-c-link { color: var(--c-accent); border-color: rgba(200,169,126,0.4); }
      .pv-c-dark .pv-c-link:hover { color: var(--c-off-white); border-color: var(--c-off-white); }

      @media (prefers-reduced-motion: reduce) {
        .pv-c * { scroll-behavior: auto !important; }
      }
    `}</style>
  )
}
