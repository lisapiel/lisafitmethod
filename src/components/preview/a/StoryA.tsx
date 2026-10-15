import Link from "next/link"
import { ParallaxMedia } from "../ParallaxMedia.client"
import { Reveal, RevealLines, DrawRule } from "../Reveal.client"
import { STORY_TIMELINE, STORY_PULLQUOTE, STORY_CREDS } from "../previewContent"

// DIRECTION A story — the engineer's arc, set as a feature article.
//
// The structural idea: a running head in the left margin, the portrait held
// as a tall plate that drifts against the scroll, and the arc itself as a
// dated index rather than paragraphs. An engineer's story told in a
// structure, which is the claim the copy is making anyway.
export function StoryA({ portraitUrl, portraitCrop }: { portraitUrl: string | null; portraitCrop: string }) {
  return (
    <section className="pv-a-story" id="story">
      <style>{`
        .pv-a-story { background: #f7f4ef; padding: clamp(72px, 9vw, 150px) clamp(20px, 5vw, 72px); }
        .pv-a-story-head { display: grid; grid-template-columns: 180px 1fr; gap: clamp(24px, 4vw, 64px); align-items: start; }
        .pv-a-story-h2 {
          font-family: var(--font-playfair), serif;
          font-size: clamp(2rem, 4.4vw, 4.1rem); font-weight: 500; line-height: 1.02;
          letter-spacing: -0.012em; color: #121110; margin: 0; max-width: 24ch;
        }
        .pv-a-story-h2 i { font-style: italic; color: #a8895e; }
        .pv-a-story-body { display: grid; grid-template-columns: 0.82fr 1fr; gap: clamp(32px, 5vw, 86px); margin-top: clamp(44px, 5vw, 84px); align-items: start; }
        .pv-a-story-plate-col { position: relative; }
        .pv-a-story-plate-cap {
          padding-top: 12px; font-family: var(--font-dm-sans), sans-serif;
          font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: rgba(18,17,16,0.38);
        }
        .pv-a-beat { display: grid; grid-template-columns: 120px 1fr; gap: clamp(14px, 2vw, 30px); padding: clamp(18px, 2vw, 26px) 0; border-bottom: 1px solid rgba(18,17,16,0.12); }
        .pv-a-beat:first-child { border-top: 1px solid rgba(18,17,16,0.12); }
        .pv-a-beat-marker {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 9.5px; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase;
          color: #a8895e; padding-top: 6px;
        }
        .pv-a-beat-title {
          font-family: var(--font-playfair), serif; font-size: clamp(1.05rem, 1.35vw, 1.3rem);
          font-weight: 600; color: #121110; line-height: 1.3; margin: 0 0 7px;
        }
        .pv-a-beat-body {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
          font-size: 0.9rem; line-height: 1.72; color: rgba(18,17,16,0.62); margin: 0; max-width: 54ch;
        }
        .pv-a-pull { padding: clamp(60px, 7vw, 120px) 0 clamp(50px, 6vw, 96px); max-width: 1180px; margin: 0 auto; text-align: center; position: relative; }
        .pv-a-pull-mark {
          font-family: var(--font-playfair), serif; font-size: clamp(5rem, 11vw, 11rem);
          color: rgba(168,137,94,0.18); line-height: 0.6; display: block; margin-bottom: -0.1em; user-select: none;
        }
        .pv-a-pull-text {
          font-family: var(--font-playfair), serif; font-style: italic; font-weight: 400;
          font-size: clamp(1.35rem, 2.9vw, 2.7rem); line-height: 1.32; color: #121110;
          max-width: 30ch; margin: 0 auto; text-wrap: balance;
        }
        .pv-a-pull-cite {
          display: block; margin-top: clamp(22px, 2.4vw, 34px);
          font-family: var(--font-dm-sans), sans-serif; font-style: normal;
          font-size: 10px; font-weight: 600; letter-spacing: 0.26em; text-transform: uppercase; color: #a8895e;
        }
        .pv-a-creds { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; }
        .pv-a-cred { padding: clamp(26px, 3vw, 40px) clamp(20px, 2.6vw, 38px); border-left: 1px solid rgba(18,17,16,0.12); }
        .pv-a-cred:first-child { border-left: none; padding-left: 0; }
        .pv-a-cred-label {
          font-family: var(--font-dm-sans), sans-serif; font-size: 10px; font-weight: 600;
          letter-spacing: 0.22em; text-transform: uppercase; color: #121110; margin: 0 0 12px;
        }
        .pv-a-cred-body {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300; font-size: 0.85rem;
          line-height: 1.75; color: rgba(18,17,16,0.58); margin: 0;
        }
        .pv-a-story-link {
          display: inline-flex; align-items: center; gap: 10px; margin-top: clamp(30px, 3.4vw, 48px);
          font-family: var(--font-dm-sans), sans-serif; font-size: 10.5px; font-weight: 600;
          letter-spacing: 0.22em; text-transform: uppercase; color: #121110; text-decoration: none;
          border-bottom: 1px solid rgba(18,17,16,0.25); padding-bottom: 6px;
          transition: color 500ms ease, border-color 500ms ease, gap 500ms cubic-bezier(0.16,1,0.3,1);
        }
        .pv-a-story-link:hover { color: #a8895e; border-color: #a8895e; gap: 18px; }
        @media (max-width: 900px) {
          .pv-a-story-head { grid-template-columns: 1fr; gap: 18px; }
          .pv-a-story-body { grid-template-columns: 1fr; gap: 40px; }
          .pv-a-beat { grid-template-columns: 1fr; gap: 8px; }
          .pv-a-beat-marker { padding-top: 0; }
          .pv-a-creds { grid-template-columns: 1fr; }
          .pv-a-cred { border-left: none; border-top: 1px solid rgba(18,17,16,0.12); padding-left: 0; padding-right: 0; }
          .pv-a-cred:first-child { border-top: none; }
        }
      `}</style>

      <div className="pv-a-story-head">
        <p className="pv-a-runhead">
          01 — The Origin
          <span>Engineer → Coach</span>
        </p>
        <h2 className="pv-a-story-h2">
          <RevealLines lines={["I learned the hard way", <i key="i">so you don&rsquo;t have to.</i>]} stagger={110} />
        </h2>
      </div>

      <div className="pv-a-story-body">
        <div className="pv-a-story-plate-col">
          {portraitUrl && (
            <Reveal variant="fade" duration={1300}>
              <ParallaxMedia
                src={portraitUrl}
                alt="Lisa McPherson, certified personal trainer and founder of Lisa Fit Method"
                objectPosition={portraitCrop}
                aspect="3 / 4"
                shift={12}
                sizes="(max-width: 900px) 100vw, 38vw"
              />
              <p className="pv-a-story-plate-cap">Lisa McPherson, CPT — Miami</p>
            </Reveal>
          )}
        </div>

        <div>
          {STORY_TIMELINE.map((beat, i) => (
            <Reveal key={beat.marker} className="pv-a-beat" variant="up" delay={i * 90} duration={1000}>
              <p className="pv-a-beat-marker">{beat.marker}</p>
              <div>
                <h3 className="pv-a-beat-title">{beat.title}</h3>
                <p className="pv-a-beat-body">{beat.body}</p>
              </div>
            </Reveal>
          ))}
          <Reveal variant="up" delay={120}>
            <Link href="/about" className="pv-a-story-link">
              Read the full story
              <span aria-hidden="true">&#8594;</span>
            </Link>
          </Reveal>
        </div>
      </div>

      <figure className="pv-a-pull">
        <span className="pv-a-pull-mark" aria-hidden="true">
          &ldquo;
        </span>
        <blockquote className="pv-a-pull-text">
          <RevealLines lines={[STORY_PULLQUOTE]} />
        </blockquote>
        <cite className="pv-a-pull-cite">Lisa McPherson, CPT</cite>
      </figure>

      <DrawRule />

      <div className="pv-a-creds">
        {STORY_CREDS.map((c, i) => (
          <Reveal key={c.label} className="pv-a-cred" variant="up" delay={i * 130} duration={1050}>
            <h3 className="pv-a-cred-label">{c.label}</h3>
            <p className="pv-a-cred-body">{c.body}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
