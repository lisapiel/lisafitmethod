import { Reveal, RevealLines } from "../Reveal.client"
import { TESTIMONIALS } from "../previewContent"

// DIRECTION A clients.
//
// APPROVAL STATE: as of this prototype, zero testimonials are published in
// production — both records exist in the admin as drafts. Every card built
// from an unapproved record carries a DRAFT mark, and the section carries a
// notice, so nothing here can be mistaken for live content.
export function TestimonialsA({ videoUrls }: { videoUrls: Record<string, string> }) {
  const anyDraft = TESTIMONIALS.some((t) => !t.approved)

  return (
    <section className="pv-a-clients" id="clients">
      <style>{`
        .pv-a-clients { background: #f7f4ef; padding: clamp(72px, 9vw, 140px) clamp(20px, 5vw, 72px); }
        .pv-a-clients-head { display: grid; grid-template-columns: 180px 1fr; gap: clamp(24px, 4vw, 64px); align-items: end; margin-bottom: clamp(30px, 3.4vw, 48px); }
        .pv-a-clients-h2 {
          font-family: var(--font-playfair), serif; font-size: clamp(1.9rem, 4vw, 3.6rem);
          font-weight: 500; line-height: 1.04; color: #121110; margin: 0; max-width: 22ch;
        }
        .pv-a-clients-h2 i { font-style: italic; color: #a8895e; }
        .pv-a-draft-note {
          display: flex; align-items: flex-start; gap: 12px;
          border: 1px dashed rgba(168,137,94,0.5); background: rgba(168,137,94,0.07);
          padding: 16px 20px; margin-bottom: clamp(32px, 3.6vw, 52px);
          font-family: var(--font-dm-sans), sans-serif; font-size: 12px; line-height: 1.7;
          color: rgba(18,17,16,0.68);
        }
        .pv-a-draft-note strong { color: #121110; font-weight: 600; }
        .pv-a-draft-badge {
          display: inline-block; font-family: var(--font-dm-sans), sans-serif;
          font-size: 8.5px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase;
          color: #121110; background: #e7c98f; padding: 4px 9px;
        }
        .pv-a-client-main { display: grid; grid-template-columns: 0.62fr 1fr; gap: clamp(26px, 4vw, 64px); align-items: center; background: #fffefc; border: 1px solid rgba(18,17,16,0.12); padding: clamp(24px, 3vw, 44px); }
        .pv-a-client-plate { position: relative; aspect-ratio: 4 / 5; background: #121110; overflow: hidden; }
        .pv-a-client-plate video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center 30%; background: #121110; }
        .pv-a-client-headline {
          font-family: var(--font-playfair), serif; font-size: clamp(1.4rem, 2.3vw, 2.1rem);
          font-weight: 500; line-height: 1.14; color: #121110; margin: 14px 0 clamp(24px, 2.6vw, 34px);
        }
        .pv-a-metrics { display: flex; flex-wrap: wrap; gap: 0; margin-bottom: clamp(24px, 2.6vw, 34px); }
        .pv-a-metric { padding-right: clamp(18px, 2.4vw, 34px); margin-right: clamp(18px, 2.4vw, 34px); border-right: 1px solid rgba(18,17,16,0.14); }
        .pv-a-metric:last-child { border-right: none; margin-right: 0; padding-right: 0; }
        .pv-a-metric-value { font-family: var(--font-playfair), serif; font-size: clamp(1.25rem, 1.9vw, 1.7rem); font-weight: 500; color: #121110; display: block; line-height: 1.1; }
        .pv-a-metric-label { font-family: var(--font-dm-sans), sans-serif; font-size: 9.5px; font-weight: 500; letter-spacing: 0.2em; text-transform: uppercase; color: rgba(18,17,16,0.44); }
        .pv-a-client-quote {
          font-family: var(--font-playfair), serif; font-style: italic; font-weight: 400;
          font-size: clamp(1.05rem, 1.5vw, 1.35rem); line-height: 1.58; color: #121110;
          border-left: 1px solid #a8895e; padding-left: clamp(16px, 2vw, 26px); margin: 0 0 20px; max-width: 46ch;
        }
        .pv-a-client-cite {
          font-family: var(--font-dm-sans), sans-serif; font-style: normal; font-size: 10px;
          font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase; color: #a8895e;
        }
        .pv-a-client-second { margin-top: clamp(18px, 2vw, 28px); background: #fffefc; border: 1px solid rgba(18,17,16,0.12); padding: clamp(32px, 4vw, 60px); text-align: center; }
        .pv-a-client-second-quote {
          font-family: var(--font-playfair), serif; font-style: italic; font-weight: 400;
          font-size: clamp(1.1rem, 1.9vw, 1.6rem); line-height: 1.5; color: #121110;
          max-width: 44ch; margin: 0 auto 22px;
        }
        @media (max-width: 900px) {
          .pv-a-clients-head { grid-template-columns: 1fr; gap: 16px; align-items: start; }
          .pv-a-client-main { grid-template-columns: 1fr; }
          .pv-a-metric { border-right: none; margin-right: 0; padding-right: 0; flex: 0 0 50%; padding-bottom: 14px; }
        }
      `}</style>

      <div className="pv-a-clients-head">
        <p className="pv-a-runhead">
          05 — Clients
          <span>Real progress</span>
        </p>
        <h2 className="pv-a-clients-h2">
          <RevealLines lines={["Real people.", <i key="i">Real progress.</i>]} stagger={110} />
        </h2>
      </div>

      {anyDraft && (
        <p className="pv-a-draft-note">
          <span className="pv-a-draft-badge">Draft</span>
          <span>
            <strong>Not live content.</strong> These two testimonials are staged in your admin as drafts and are not
            published on lisafitmethod.com. They appear here so you can judge the layout with real words. Publishing
            them stays entirely your decision, in Admin → Testimonials.
          </span>
        </p>
      )}

      {TESTIMONIALS.filter((t) => t.metrics.length > 0).map((t) => (
        <Reveal key={t.id} className="pv-a-client-main" variant="up" duration={1100}>
          <div className="pv-a-client-plate">
            {videoUrls[t.videoSlot] ? (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <video src={videoUrls[t.videoSlot]} controls playsInline preload="metadata" aria-label={`${t.name}, video testimonial`} />
            ) : (
              <span
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--font-dm-sans), sans-serif",
                  fontSize: 10,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "rgba(240,230,211,0.5)",
                }}
              >
                Video testimonial
              </span>
            )}
          </div>
          <div>
            {!t.approved && <span className="pv-a-draft-badge">Draft &#183; awaiting your approval</span>}
            <h3 className="pv-a-client-headline">{t.headline}</h3>
            <div className="pv-a-metrics">
              {t.metrics.map((m) => (
                <div key={m.label} className="pv-a-metric">
                  <span className="pv-a-metric-value">{m.value}</span>
                  <span className="pv-a-metric-label">{m.label}</span>
                </div>
              ))}
            </div>
            <blockquote className="pv-a-client-quote">&ldquo;{t.quote}&rdquo;</blockquote>
            <cite className="pv-a-client-cite">
              {t.name} &#183; {t.descriptor}
            </cite>
          </div>
        </Reveal>
      ))}

      {TESTIMONIALS.filter((t) => t.metrics.length === 0).map((t) => (
        <Reveal key={t.id} className="pv-a-client-second" variant="up" duration={1100}>
          {!t.approved && <span className="pv-a-draft-badge">Draft &#183; awaiting your approval</span>}
          <blockquote className="pv-a-client-second-quote" style={{ marginTop: 20 }}>
            &ldquo;{t.quote}&rdquo;
          </blockquote>
          <cite className="pv-a-client-cite">
            {t.name} &#183; {t.descriptor}
          </cite>
        </Reveal>
      ))}
    </section>
  )
}
