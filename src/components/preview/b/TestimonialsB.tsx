import { Reveal, RevealLines } from "../Reveal.client"
import { TESTIMONIALS } from "../previewContent"

// DIRECTION B clients.
//
// APPROVAL STATE: identical to Direction A — zero testimonials are published
// in production. Both records are drafts in the admin, every card carries a
// DRAFT mark, and the section carries a notice.
export function TestimonialsB({ videoUrls }: { videoUrls: Record<string, string> }) {
  const anyDraft = TESTIMONIALS.some((t) => !t.approved)
  const featured = TESTIMONIALS.filter((t) => t.metrics.length > 0)
  const quiet = TESTIMONIALS.filter((t) => t.metrics.length === 0)

  return (
    <section className="pv-b-clients" id="clients">
      <style>{`
        .pv-b-clients { background: #08080a; padding: clamp(76px, 10vw, 150px) clamp(20px, 5vw, 72px); }
        .pv-b-clients-head { max-width: 1180px; margin: 0 auto clamp(30px, 3.4vw, 46px); }
        .pv-b-clients-h2 { font-size: clamp(1.9rem, 4.6vw, 4rem); margin-top: clamp(18px, 2.2vw, 30px); }
        .pv-b-draft-note {
          max-width: 1180px; margin: 0 auto clamp(36px, 4vw, 56px);
          display: flex; align-items: flex-start; gap: 14px;
          border: 1px dashed rgba(201,169,110,0.45); background: rgba(201,169,110,0.05);
          padding: 16px 20px; font-family: var(--font-montserrat), sans-serif;
          font-size: 11.5px; font-weight: 300; line-height: 1.8; color: rgba(240,230,211,0.6);
        }
        .pv-b-draft-note strong { color: #f0e6d3; font-weight: 600; }
        .pv-b-draft-badge {
          display: inline-block; font-family: var(--font-montserrat), sans-serif;
          font-size: 8px; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase;
          color: #08080a; background: #c9a96e; padding: 4px 9px; white-space: nowrap;
        }
        .pv-b-client-feature { max-width: 1180px; margin: 0 auto; display: grid; grid-template-columns: 0.56fr 1fr; gap: clamp(28px, 5vw, 72px); align-items: center; }
        .pv-b-client-plate { position: relative; aspect-ratio: 4 / 5; background: #0b0b0d; overflow: hidden; border: 1px solid rgba(201,169,110,0.2); }
        .pv-b-client-plate video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center 30%; background: #0b0b0d; }
        .pv-b-client-headline { font-family: var(--font-cormorant), serif; font-weight: 300; font-size: clamp(1.5rem, 2.6vw, 2.4rem); line-height: 1.16; color: #f0e6d3; margin: 16px 0 clamp(26px, 3vw, 36px); }
        .pv-b-metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: rgba(201,169,110,0.16); margin-bottom: clamp(26px, 3vw, 36px); }
        .pv-b-metric { background: #08080a; padding: clamp(16px, 1.9vw, 24px); text-align: center; }
        .pv-b-metric-value { display: block; font-family: var(--font-cormorant), serif; font-weight: 300; font-size: clamp(1.3rem, 2vw, 1.8rem); color: #c9a96e; line-height: 1.05; }
        .pv-b-metric-label { font-family: var(--font-montserrat), sans-serif; font-size: 8.5px; font-weight: 500; letter-spacing: 0.22em; text-transform: uppercase; color: rgba(240,230,211,0.4); }
        .pv-b-client-quote {
          font-family: var(--font-cormorant), serif; font-style: italic; font-weight: 300;
          font-size: clamp(1.1rem, 1.7vw, 1.5rem); line-height: 1.56; color: #f0e6d3;
          border-left: 1px solid rgba(201,169,110,0.6); padding-left: clamp(18px, 2vw, 28px); margin: 0 0 20px; max-width: 46ch;
        }
        .pv-b-client-cite { font-style: normal; font-family: var(--font-montserrat), sans-serif; font-size: 9.5px; font-weight: 600; letter-spacing: 0.26em; text-transform: uppercase; color: #c9a96e; }
        .pv-b-client-quiet { max-width: 1180px; margin: clamp(20px, 2.4vw, 32px) auto 0; border: 1px solid rgba(201,169,110,0.16); padding: clamp(34px, 4.4vw, 68px); text-align: center; }
        .pv-b-client-quiet blockquote {
          font-family: var(--font-cormorant), serif; font-style: italic; font-weight: 300;
          font-size: clamp(1.15rem, 2.1vw, 1.8rem); line-height: 1.5; color: #f0e6d3;
          max-width: 42ch; margin: 18px auto 22px;
        }
        @media (max-width: 900px) {
          .pv-b-client-feature { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="pv-b-clients-head">
        <p className="pv-b-label">05 &#8212; Clients</p>
        <h2 className="pv-b-display pv-b-clients-h2">
          <RevealLines lines={["Real people.", <i key="i">Real progress.</i>]} stagger={130} />
        </h2>
      </div>

      {anyDraft && (
        <p className="pv-b-draft-note">
          <span className="pv-b-draft-badge">Draft</span>
          <span>
            <strong>Not live content.</strong> These two testimonials are staged in your admin as drafts and are not
            published on lisafitmethod.com. They appear here so you can judge the layout with real words. Publishing
            them stays entirely your decision, in Admin &rarr; Testimonials.
          </span>
        </p>
      )}

      {featured.map((t) => (
        <Reveal key={t.id} className="pv-b-client-feature" variant="up" duration={1150}>
          <div className="pv-b-client-plate">
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
                  fontFamily: "var(--font-montserrat), sans-serif",
                  fontSize: 9.5,
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                  color: "rgba(240,230,211,0.4)",
                }}
              >
                Video testimonial
              </span>
            )}
          </div>
          <div>
            {!t.approved && <span className="pv-b-draft-badge">Draft &#183; awaiting your approval</span>}
            <h3 className="pv-b-client-headline">{t.headline}</h3>
            <div className="pv-b-metrics">
              {t.metrics.map((m) => (
                <div key={m.label} className="pv-b-metric">
                  <span className="pv-b-metric-value">{m.value}</span>
                  <span className="pv-b-metric-label">{m.label}</span>
                </div>
              ))}
            </div>
            <blockquote className="pv-b-client-quote">&ldquo;{t.quote}&rdquo;</blockquote>
            <cite className="pv-b-client-cite">
              {t.name} &#183; {t.descriptor}
            </cite>
          </div>
        </Reveal>
      ))}

      {quiet.map((t) => (
        <Reveal key={t.id} className="pv-b-client-quiet" variant="up" duration={1150}>
          {!t.approved && <span className="pv-b-draft-badge">Draft &#183; awaiting your approval</span>}
          <blockquote>&ldquo;{t.quote}&rdquo;</blockquote>
          <cite className="pv-b-client-cite">
            {t.name} &#183; {t.descriptor}
          </cite>
        </Reveal>
      ))}
    </section>
  )
}
