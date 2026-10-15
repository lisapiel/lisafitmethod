// Shared rules and the film-grain layer for Direction B, injected once.
//
// The grain is a single inline SVG turbulence tile at very low opacity,
// fixed over the whole page. It is what stops a near-black page from
// looking like flat #000 CSS and makes the photography feel shot rather
// than placed — the cheapest honest luxury cue available, and it costs no
// network request.
export function StylesB() {
  const grain =
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='0.42'/%3E%3C/svg%3E\")"

  return (
    <style>{`
      .pv-b-grain {
        position: fixed; inset: 0; z-index: 300; pointer-events: none;
        background-image: ${grain};
        opacity: 0.045; mix-blend-mode: overlay;
      }
      .pv-b-label {
        font-family: var(--font-montserrat), sans-serif;
        font-size: 9.5px; font-weight: 500; letter-spacing: 0.32em; text-transform: uppercase;
        color: #c9a96e; margin: 0;
      }
      .pv-b-label-dim { color: rgba(240,230,211,0.38); }
      .pv-b-display {
        font-family: var(--font-cormorant), serif; font-weight: 300;
        line-height: 1.02; letter-spacing: -0.005em; color: #f0e6d3; margin: 0;
      }
      .pv-b-display i { font-style: italic; color: #c9a96e; }
      .pv-b-body {
        font-family: var(--font-montserrat), sans-serif; font-weight: 300;
        font-size: clamp(0.875rem, 1.02vw, 1rem); line-height: 1.85;
        color: rgba(240,230,211,0.56); margin: 0;
      }
      .pv-b-cta {
        position: relative; overflow: hidden; display: inline-block; text-decoration: none;
        font-family: var(--font-montserrat), sans-serif; font-size: 10px; font-weight: 600;
        letter-spacing: 0.26em; text-transform: uppercase;
        padding: 18px 42px; color: #08080a; background: #c9a96e;
        transition: box-shadow 700ms ease, transform 700ms cubic-bezier(0.16,1,0.3,1);
      }
      .pv-b-cta:hover { transform: translateY(-3px); box-shadow: 0 18px 50px -18px rgba(201,169,110,0.6); }
      .pv-b-cta-ghost {
        position: relative; display: inline-block; text-decoration: none;
        font-family: var(--font-montserrat), sans-serif; font-size: 10px; font-weight: 600;
        letter-spacing: 0.26em; text-transform: uppercase;
        padding: 18px 42px; color: rgba(240,230,211,0.82);
        border: 1px solid rgba(201,169,110,0.3);
        transition: border-color 600ms ease, color 600ms ease, background 600ms ease;
      }
      .pv-b-cta-ghost:hover { border-color: #c9a96e; color: #c9a96e; background: rgba(201,169,110,0.06); }
      .pv-b-rule { height: 1px; background: linear-gradient(to right, rgba(201,169,110,0.5), rgba(201,169,110,0)); }
    `}</style>
  )
}
