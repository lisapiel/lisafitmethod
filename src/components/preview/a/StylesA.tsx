// Shared rules for Direction A, injected once per page.
//
// Section components keep their own layout CSS local to themselves, but
// anything used by more than one section lives here so a section can be
// reordered or removed without silently taking a rule another section
// depends on with it.
export function StylesA() {
  return (
    <style>{`
      .pv-a-runhead {
        font-family: var(--font-dm-sans), sans-serif;
        font-size: 10px; font-weight: 600; letter-spacing: 0.28em; text-transform: uppercase;
        color: #a8895e; padding-top: 14px; line-height: 2.2; margin: 0;
      }
      .pv-a-runhead span { display: block; color: rgba(18,17,16,0.38); font-weight: 500; }
      .pv-a-runhead-light { color: #c8a97e; }
      .pv-a-runhead-light span { color: rgba(247,244,239,0.4); }
      @media (max-width: 900px) {
        .pv-a-runhead { padding-top: 0; line-height: 1.9; }
      }
    `}</style>
  )
}
