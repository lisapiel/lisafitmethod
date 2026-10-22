// Direction D design system.
//
// The brief for D is flow: no section should look like it was added later.
// That is mostly won here rather than in the individual sections, by giving
// the whole page one scale to obey —
//
//   --d-step-*   a single spacing ramp; sections only ever use --d-section
//   --d-gutter   one page margin, shared by every section and the nav
//   --d-max      one content width, so every left edge lines up down the page
//   --d-rule     one hairline colour per tone
//
// Tone is roughly three quarters light. Dark is reserved for the three
// moments that earn drama — the opening, the bundle, the closing ask — plus
// the footer. Everything else is paper, which is where the reading happens.
//
// Palette is the documented brand tokens only. No new colours, no new fonts.
export function StylesD() {
  const grain =
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E\")"

  return (
    <style>{`
      .pv-d {
        --d-black: #0a0a0a;
        --d-off-white: #f5f2ee;
        --d-warm-white: #faf8f5;
        --d-accent: #c8a97e;
        --d-accent-dark: #a8895e;
        --d-text: #1a1a1a;
        --d-muted: #6b6560;

        --d-gutter: clamp(22px, 5vw, 88px);
        --d-max: 1180px;
        --d-section: clamp(76px, 9vw, 150px);
        --d-step-1: clamp(8px, 0.8vw, 12px);
        --d-step-2: clamp(14px, 1.4vw, 20px);
        --d-step-3: clamp(22px, 2.2vw, 32px);
        --d-step-4: clamp(34px, 3.4vw, 52px);
        --d-step-5: clamp(48px, 5vw, 78px);
        --d-rule: rgba(26,26,26,0.13);
        --d-rule-dark: rgba(245,242,238,0.14);

        font-family: var(--font-dm-sans), sans-serif;
        font-weight: 300;
        background: var(--d-warm-white);
        color: var(--d-text);
      }

      @media (min-width: 1800px) {
        .pv-d { --d-max: 1340px; --d-gutter: clamp(96px, 6vw, 180px); }
      }

      /* ── Grounds ──────────────────────────────────────────────────── */
      .pv-d-light { background: var(--d-warm-white); color: var(--d-text); position: relative; }
      .pv-d-light-alt { background: var(--d-off-white); color: var(--d-text); position: relative; }
      .pv-d-dark { background: var(--d-black); color: var(--d-off-white); position: relative; }
      .pv-d-dark::before {
        content: ""; position: absolute; inset: 0; pointer-events: none;
        background-image: ${grain}; opacity: 0.04; mix-blend-mode: overlay;
      }

      .pv-d-section { padding: var(--d-section) var(--d-gutter); }

      /* The dissolve between two grounds. Its height lives here rather than
         inline so a phone can have its own, where a band sized by 9vw was a
         visible stripe of empty gradient between sections. */
      .pv-d-toneshift { height: clamp(42px, 9vw, 150px); }
      @media (max-width: 600px) { .pv-d-toneshift { height: 20px; } }
      /* Content that sits over an Atmosphere layer. An absolutely positioned
         backdrop paints above static in-flow content, so anything in front of
         one has to be positioned too. */
      .pv-d-above { position: relative; z-index: 2; }
      .pv-d-inner { max-width: var(--d-max); margin: 0 auto; }

      /* ── Section openings ─────────────────────────────────────────────
         Every section opens the same way: eyebrow, short gold rule, heading.
         Repeating one opening is most of what makes a long page feel like
         one document rather than a stack of modules. */
      .pv-d-open { margin-bottom: var(--d-step-5); }
      .pv-d-open--centre { text-align: center; }
      .pv-d-open--centre .pv-d-open-rule { margin-left: auto; margin-right: auto; }
      .pv-d-eyebrow {
        font-family: var(--font-dm-sans), sans-serif;
        font-size: 10.5px; font-weight: 600; letter-spacing: 0.28em;
        text-transform: uppercase; color: var(--d-accent-dark); margin: 0;
      }
      .pv-d-dark .pv-d-eyebrow { color: var(--d-accent); }
      .pv-d-open-rule { width: 54px; margin-top: var(--d-step-2); margin-bottom: var(--d-step-3); }

      .pv-d-display {
        font-family: var(--font-playfair), serif; font-weight: 500;
        line-height: 1.04; letter-spacing: -0.015em; color: var(--d-text);
        margin: 0; text-wrap: balance;
      }
      .pv-d-dark .pv-d-display { color: var(--d-off-white); }
      .pv-d-display i { font-style: italic; color: var(--d-accent-dark); }
      .pv-d-dark .pv-d-display i { color: var(--d-accent); }
      .pv-d-h2 { font-size: clamp(1.95rem, 4.1vw, 3.5rem); }
      .pv-d-h3 { font-size: clamp(1.2rem, 1.8vw, 1.72rem); line-height: 1.18; }

      .pv-d-body {
        font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
        font-size: clamp(0.95rem, 1.05vw, 1.0625rem); line-height: 1.82;
        color: var(--d-muted); margin: 0;
      }
      .pv-d-dark .pv-d-body { color: rgba(245,242,238,0.58); }
      .pv-d-lede {
        font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
        font-size: clamp(1.05rem, 1.4vw, 1.3rem); line-height: 1.66;
        color: var(--d-text); margin: 0;
      }
      .pv-d-dark .pv-d-lede { color: rgba(245,242,238,0.78); }

      /* ── Buttons: one set, two grounds ─────────────────────────────── */
      .pv-d-btn {
        position: relative; overflow: hidden; display: inline-block;
        font-family: var(--font-dm-sans), sans-serif; font-size: 11px;
        font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase;
        text-decoration: none; padding: 17px 38px; text-align: center;
        transition: color 560ms cubic-bezier(0.16,1,0.3,1);
      }
      .pv-d-btn > span { position: relative; z-index: 1; }
      .pv-d-btn::before {
        content: ""; position: absolute; inset: 0; z-index: 0;
        transform: scaleY(0); transform-origin: bottom;
        transition: transform 620ms cubic-bezier(0.16,1,0.3,1);
      }
      .pv-d-btn:hover::before { transform: scaleY(1); }
      .pv-d-btn--primary { background: var(--d-accent-dark); color: #fff; }
      .pv-d-btn--primary::before { background: var(--d-black); }
      .pv-d-btn--primary:hover { color: var(--d-off-white); }
      .pv-d-btn--outline { border: 1px solid rgba(168,137,94,0.45); color: var(--d-accent-dark); }
      .pv-d-btn--outline::before { background: var(--d-accent-dark); }
      .pv-d-btn--outline:hover { color: #fff; }
      .pv-d-btn--gold { background: var(--d-accent); color: var(--d-black); }
      .pv-d-btn--gold::before { background: var(--d-off-white); }
      .pv-d-btn--gold:hover { color: var(--d-black); }
      .pv-d-btn--ghost-dark { border: 1px solid rgba(200,169,126,0.4); color: rgba(245,242,238,0.88); }
      .pv-d-btn--ghost-dark::before { background: var(--d-accent); }
      .pv-d-btn--ghost-dark:hover { color: var(--d-black); }

      .pv-d-link {
        display: inline-flex; align-items: center; gap: 9px;
        font-family: var(--font-dm-sans), sans-serif; font-size: 10.5px;
        font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase;
        text-decoration: none; color: var(--d-accent-dark);
        border-bottom: 1px solid rgba(168,137,94,0.4); padding-bottom: 6px;
        transition: gap 520ms cubic-bezier(0.16,1,0.3,1), color 420ms ease, border-color 420ms ease;
      }
      .pv-d-link:hover { gap: 17px; color: var(--d-text); border-color: var(--d-text); }
      .pv-d-dark .pv-d-link { color: var(--d-accent); border-color: rgba(200,169,126,0.4); }
      .pv-d-dark .pv-d-link:hover { color: var(--d-off-white); border-color: var(--d-off-white); }

      /* ── Figures ──────────────────────────────────────────────────────
         One stat treatment, used by the bundle tiles and the testimonial
         results alike, so numbers never look like a different component
         bolted on. */
      .pv-d-figures { display: grid; }
      .pv-d-figure { padding: var(--d-step-3) var(--d-step-3) var(--d-step-3) 0; }
      .pv-d-figure + .pv-d-figure {
        border-left: 1px solid var(--d-rule); padding-left: var(--d-step-3);
      }
      .pv-d-dark .pv-d-figure + .pv-d-figure { border-left-color: var(--d-rule-dark); }
      .pv-d-figure-value {
        display: block; font-family: var(--font-playfair), serif; font-weight: 500;
        font-size: clamp(1.35rem, 2.1vw, 1.95rem); line-height: 1.05;
        color: var(--d-accent-dark); white-space: nowrap;
      }
      .pv-d-dark .pv-d-figure-value { color: var(--d-accent); }
      .pv-d-figure-label {
        display: block; margin-top: 7px; font-family: var(--font-dm-sans), sans-serif;
        font-size: 9.5px; font-weight: 500; letter-spacing: 0.2em;
        text-transform: uppercase; color: var(--d-muted);
      }
      .pv-d-dark .pv-d-figure-label { color: rgba(245,242,238,0.42); }
    `}</style>
  )
}
