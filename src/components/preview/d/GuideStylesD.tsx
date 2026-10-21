// Styles shared by the two free guides.
//
// Both guides are the same kind of page: a single reading column with a
// gate, a story, a numbered run and a stack of offers. Holding that CSS in
// one place is what stops the nutrition guide from quietly drifting away
// from the training guide, and it is why either page can be restyled once.
export function GuideStylesD() {
  return (
    <style>{`
        .pv-d-guide { max-width: 820px; margin: 0 auto; }
        .pv-d-guide-h1 { font-size: clamp(2rem, 4.4vw, 3.2rem); margin: 0 0 var(--d-step-3); }
        .pv-d-guide-lede {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
          font-size: clamp(0.98rem, 1.15vw, 1.1rem); line-height: 1.8;
          color: var(--d-muted); margin: 0; max-width: 64ch;
        }
        .pv-d-guide-lede strong { color: var(--d-text); font-weight: 500; }
        .pv-d-guide-rule { margin: var(--d-step-5) 0; }
        .pv-d-promise { padding: var(--d-step-2) 0; border-bottom: 1px solid var(--d-rule); display: flex; gap: 13px; }
        .pv-d-promise:last-child { border-bottom: 0; }
        .pv-d-promise-mark { color: var(--d-accent-dark); font-size: 0.82rem; flex-shrink: 0; line-height: 1.8; }
        .pv-d-promise p {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
          font-size: 0.94rem; line-height: 1.6; margin: 0; color: rgba(26,26,26,0.7);
        }
        .pv-d-promise strong { color: var(--d-text); font-weight: 500; }
        /* The signup panel stays dark: it is the one place on the page that
           should read as a door, and the shared form is styled for dark. */
        .pv-d-guide-gate {
          background: var(--d-black); color: var(--d-off-white);
          padding: clamp(28px, 5vw, 48px);
          margin-top: var(--d-step-5);
        }
        .pv-d-guide-gate-h {
          font-family: var(--font-playfair), serif; font-weight: 500;
          font-size: clamp(1.4rem, 2.4vw, 1.8rem); color: #fff;
          margin: var(--d-step-2) 0 var(--d-step-2); line-height: 1.2;
        }
        .pv-d-guide-gate-b {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
          font-size: 0.9rem; line-height: 1.7; color: rgba(245,242,238,0.55);
          margin: 0 0 var(--d-step-3); max-width: 50ch;
        }
        .pv-d-guide-gate .pv-d-eyebrow { color: var(--d-accent); }
        .pv-d-guide-sig {
          font-family: var(--font-dm-sans), sans-serif; font-size: 0.65rem;
          letter-spacing: 0.22em; text-transform: uppercase; color: rgba(26,26,26,0.35);
          text-align: center; margin: var(--d-step-5) 0 0;
        }
        .pv-d-guide-confirm {
          display: flex; align-items: center; gap: 12px;
          padding-bottom: var(--d-step-3); margin-bottom: var(--d-step-4);
          border-bottom: 1px solid var(--d-rule);
        }
        .pv-d-guide-confirm span { color: var(--d-accent-dark); }
        .pv-d-guide-confirm p {
          font-family: var(--font-dm-sans), sans-serif; font-size: 0.85rem;
          color: var(--d-muted); margin: 0;
        }
        /* The story, set as a pulled quote rather than a tinted box. */
        .pv-d-guide-story {
          padding-left: clamp(18px, 3vw, 34px);
          border-left: 1px solid rgba(168,137,94,0.45);
        }
        .pv-d-guide-story p {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
          font-size: 0.95rem; line-height: 1.82; color: var(--d-muted);
          margin: 0 0 var(--d-step-2);
        }
        .pv-d-guide-story strong { color: var(--d-text); font-weight: 500; }
        .pv-d-guide-story-sig {
          font-family: var(--font-playfair), serif; font-style: italic;
          font-size: 1.05rem; color: var(--d-accent-dark); margin: 0 !important;
        }
        .pv-d-guide-h2 {
          font-family: var(--font-playfair), serif; font-weight: 500;
          font-size: clamp(1.5rem, 2.8vw, 2rem); line-height: 1.15;
          margin: var(--d-step-2) 0 var(--d-step-3);
        }
        .pv-d-guide-h2 i { font-style: italic; color: var(--d-accent-dark); }
        .pv-d-guide-body {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
          font-size: 0.95rem; line-height: 1.8; color: var(--d-muted);
          margin: 0 0 var(--d-step-2); max-width: 66ch;
        }
        /* Movements: a numbered editorial run, no cards. */
        .pv-d-move { padding: var(--d-step-4) 0; border-top: 1px solid var(--d-rule); }
        .pv-d-move-head { display: flex; align-items: baseline; gap: 16px; flex-wrap: wrap; }
        .pv-d-move-num {
          font-family: var(--font-playfair), serif; font-size: 1.8rem; line-height: 1;
          color: rgba(168,137,94,0.5); font-weight: 500;
        }
        .pv-d-move-name {
          font-family: var(--font-playfair), serif; font-weight: 500;
          font-size: clamp(1.2rem, 1.8vw, 1.5rem); margin: 0; line-height: 1.2;
        }
        .pv-d-move-pattern {
          font-family: var(--font-dm-sans), sans-serif; font-size: 9.5px; font-weight: 600;
          letter-spacing: 0.2em; text-transform: uppercase; color: var(--d-accent-dark);
        }
        .pv-d-move-what {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
          font-size: 0.93rem; line-height: 1.8; color: var(--d-muted);
          margin: var(--d-step-2) 0 var(--d-step-3); max-width: 68ch;
        }
        .pv-d-move-cues { list-style: none; margin: 0; padding: 0; }
        .pv-d-move-cues li {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
          font-size: 0.89rem; line-height: 1.65; color: rgba(26,26,26,0.68);
          padding: 7px 0 7px 17px; position: relative;
        }
        .pv-d-move-cues li::before {
          content: "→"; position: absolute; left: 0; top: 7px;
          font-size: 10px; color: rgba(168,137,94,0.75);
        }
        .pv-d-move-watch {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
          font-size: 0.86rem; line-height: 1.7; color: var(--d-muted);
          margin: var(--d-step-2) 0 0; padding-top: var(--d-step-2);
          border-top: 1px solid var(--d-rule);
        }
        .pv-d-move-watch strong { color: var(--d-accent-dark); font-weight: 600; letter-spacing: 0.04em; }
        /* Day A keeps a dark ground: it is the one screen that should feel
           like the inside of the product. */
        .pv-d-day { background: var(--d-black); color: var(--d-off-white); padding: clamp(26px, 5vw, 48px); }
        .pv-d-day .pv-d-eyebrow { color: var(--d-accent); }
        .pv-d-day-sum {
          font-family: var(--font-dm-sans), sans-serif; font-size: 0.74rem;
          letter-spacing: 0.12em; text-transform: uppercase; color: var(--d-accent);
          margin: var(--d-step-2) 0 var(--d-step-4);
        }
        .pv-d-day-block-label {
          font-family: var(--font-dm-sans), sans-serif; font-size: 9px; font-weight: 600;
          letter-spacing: 0.22em; text-transform: uppercase; color: rgba(245,242,238,0.35);
          margin: 0 0 var(--d-step-2);
        }
        .pv-d-day-row {
          display: flex; justify-content: space-between; align-items: baseline;
          gap: 16px; padding: 9px 0; border-bottom: 1px solid rgba(245,242,238,0.09);
        }
        .pv-d-day-row p {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
          font-size: 0.86rem; color: rgba(245,242,238,0.78); margin: 0;
        }
        .pv-d-day-row span {
          font-family: var(--font-dm-sans), sans-serif; font-size: 0.72rem;
          color: rgba(245,242,238,0.38); white-space: nowrap; flex-shrink: 0;
        }
        .pv-d-day-row-note {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
          font-size: 0.74rem; color: rgba(245,242,238,0.38); margin: 2px 0 0;
        }
        .pv-d-day-group { margin-bottom: var(--d-step-4); }
        .pv-d-day-note {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300; font-style: italic;
          font-size: 0.82rem; line-height: 1.7; color: rgba(245,242,238,0.38);
          margin: var(--d-step-4) 0 0;
        }
        .pv-d-also { margin-top: var(--d-step-4); padding-top: var(--d-step-3); border-top: 1px solid rgba(245,242,238,0.12); }
        .pv-d-also ul { list-style: none; margin: 0; padding: 0; }
        .pv-d-also li {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
          font-size: 0.84rem; line-height: 1.6; color: rgba(245,242,238,0.68);
          padding: 7px 0 7px 16px; position: relative;
        }
        .pv-d-also li::before { content: "→"; position: absolute; left: 0; top: 7px; font-size: 10px; color: var(--d-accent); }
        .pv-d-feat { list-style: none; margin: var(--d-step-3) 0 0; padding: 0; }
        .pv-d-feat li {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
          font-size: 0.93rem; line-height: 1.6; color: rgba(26,26,26,0.7);
          padding: var(--d-step-2) 0 var(--d-step-2) 26px;
          position: relative; border-bottom: 1px solid var(--d-rule);
        }
        .pv-d-feat li::before { content: "→"; position: absolute; left: 0; top: var(--d-step-2); color: var(--d-accent-dark); }
        .pv-d-feat strong { color: var(--d-text); font-weight: 500; }
        .pv-d-offer { background: var(--d-black); color: var(--d-off-white); padding: clamp(26px, 5vw, 48px); margin-top: var(--d-step-4); }
        .pv-d-offer-price { display: flex; align-items: baseline; gap: 14px; flex-wrap: wrap; }
        .pv-d-offer-was { font-family: var(--font-playfair), serif; font-size: 1.4rem; color: rgba(245,242,238,0.3); text-decoration: line-through; }
        .pv-d-offer-now { font-family: var(--font-playfair), serif; font-size: clamp(2rem, 4.4vw, 2.9rem); font-weight: 500; color: #fff; line-height: 1; }
        .pv-d-offer-badge {
          font-family: var(--font-dm-sans), sans-serif; font-size: 8.5px; font-weight: 600;
          letter-spacing: 0.16em; text-transform: uppercase; color: var(--d-black);
          background: var(--d-accent); padding: 4px 9px; align-self: center;
        }
        .pv-d-offer-h {
          font-family: var(--font-playfair), serif; font-weight: 500;
          font-size: clamp(1.4rem, 2.4vw, 1.7rem); color: #fff;
          margin: var(--d-step-3) 0 var(--d-step-2); line-height: 1.2;
        }
        .pv-d-offer-h i { font-style: italic; color: var(--d-accent); }
        .pv-d-offer-b {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
          font-size: 0.9rem; line-height: 1.7; color: rgba(245,242,238,0.55);
          margin: 0 0 var(--d-step-4); max-width: 52ch;
        }
        .pv-d-offer-note {
          font-family: var(--font-dm-sans), sans-serif; font-size: 0.68rem;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: rgba(245,242,238,0.3); margin: var(--d-step-3) 0 0;
        }
        .pv-d-alt { padding-top: var(--d-step-3); border-top: 1px solid var(--d-rule); margin-top: var(--d-step-4); }
        .pv-d-alt-b {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
          font-size: 0.9rem; line-height: 1.7; color: var(--d-muted);
          margin: var(--d-step-2) 0 var(--d-step-3); max-width: 60ch;
        }
        .pv-d-alt-price { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; margin-bottom: var(--d-step-3); }
        .pv-d-alt-now { font-family: var(--font-playfair), serif; font-size: 1.6rem; font-weight: 500; color: var(--d-text); line-height: 1; }
        .pv-d-alt-was { font-family: var(--font-dm-sans), sans-serif; font-size: 0.72rem; color: var(--d-muted); text-decoration: line-through; }
`}</style>
  )
}
