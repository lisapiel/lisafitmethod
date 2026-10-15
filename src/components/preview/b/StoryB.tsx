import Link from "next/link"
import { ParallaxMedia } from "../ParallaxMedia.client"
import { Reveal, RevealLines } from "../Reveal.client"
import { STORY_TIMELINE, STORY_PULLQUOTE, STORY_CREDS } from "../previewContent"

// DIRECTION B story — the engineer's arc as a lit timeline.
//
// Same facts as Direction A, deliberately opposite treatment: where A sets
// the arc as an index on paper, B runs it down a single gold thread with the
// portrait held in an offset frame beside it. Comparing the two sections is
// the clearest way to feel the difference between the directions.
export function StoryB({ portraitUrl, portraitCrop }: { portraitUrl: string | null; portraitCrop: string }) {
  return (
    <section className="pv-b-story" id="story">
      <style>{`
        .pv-b-story { background: #0b0b0d; padding: clamp(76px, 10vw, 160px) clamp(20px, 5vw, 72px); }
        .pv-b-story-head { max-width: 1180px; margin: 0 auto clamp(48px, 6vw, 90px); }
        .pv-b-story-h2 { font-size: clamp(2rem, 5.2vw, 4.6rem); max-width: 22ch; margin-top: clamp(20px, 2.4vw, 32px); }
        .pv-b-story-grid { max-width: 1180px; margin: 0 auto; display: grid; grid-template-columns: 0.82fr 1fr; gap: clamp(36px, 6vw, 100px); align-items: start; }
        .pv-b-frame { position: relative; }
        .pv-b-frame::after {
          content: ""; position: absolute; top: 18px; left: 18px; right: -18px; bottom: -18px;
          border: 1px solid rgba(201,169,110,0.3); pointer-events: none;
        }
        .pv-b-frame-cap {
          margin: 30px 0 0; font-family: var(--font-montserrat), sans-serif; font-size: 9.5px;
          font-weight: 500; letter-spacing: 0.26em; text-transform: uppercase; color: rgba(240,230,211,0.38);
        }
        .pv-b-thread { position: relative; padding-left: clamp(26px, 3vw, 44px); }
        .pv-b-thread::before {
          content: ""; position: absolute; left: 3px; top: 10px; bottom: 10px; width: 1px;
          background: linear-gradient(to bottom, rgba(201,169,110,0.5), rgba(201,169,110,0.08));
        }
        .pv-b-beat { position: relative; padding-bottom: clamp(30px, 3.4vw, 46px); }
        .pv-b-beat::before {
          content: ""; position: absolute; left: calc(-1 * clamp(26px, 3vw, 44px)); top: 9px;
          width: 7px; height: 7px; border-radius: 50%; background: #c9a96e;
          box-shadow: 0 0 0 4px rgba(201,169,110,0.14);
        }
        .pv-b-beat-marker {
          font-family: var(--font-montserrat), sans-serif; font-size: 9px; font-weight: 600;
          letter-spacing: 0.3em; text-transform: uppercase; color: #c9a96e; margin: 0 0 10px;
        }
        .pv-b-beat-title {
          font-family: var(--font-cormorant), serif; font-weight: 400;
          font-size: clamp(1.3rem, 2vw, 1.85rem); line-height: 1.2; color: #f0e6d3; margin: 0 0 10px;
        }
        .pv-b-beat-body { max-width: 54ch; font-size: 0.86rem; }
        .pv-b-story-link {
          display: inline-flex; align-items: center; gap: 10px; margin-top: 6px;
          font-family: var(--font-montserrat), sans-serif; font-size: 10px; font-weight: 600;
          letter-spacing: 0.26em; text-transform: uppercase; color: #c9a96e; text-decoration: none;
          border-bottom: 1px solid rgba(201,169,110,0.4); padding-bottom: 6px;
          transition: gap 520ms cubic-bezier(0.16,1,0.3,1), color 420ms ease;
        }
        .pv-b-story-link:hover { gap: 20px; color: #e8c98a; }
        .pv-b-story-pull { max-width: 1180px; margin: clamp(64px, 8vw, 130px) auto 0; text-align: center; }
        .pv-b-story-pull blockquote {
          font-family: var(--font-cormorant), serif; font-style: italic; font-weight: 300;
          font-size: clamp(1.3rem, 3vw, 2.6rem); line-height: 1.38; color: #f0e6d3;
          max-width: 34ch; margin: 0 auto; text-wrap: balance;
        }
        .pv-b-story-pull cite {
          display: block; margin-top: clamp(22px, 2.6vw, 34px); font-style: normal;
          font-family: var(--font-montserrat), sans-serif; font-size: 9.5px; font-weight: 600;
          letter-spacing: 0.3em; text-transform: uppercase; color: #c9a96e;
        }
        .pv-b-creds { max-width: 1180px; margin: clamp(56px, 7vw, 110px) auto 0; display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: rgba(201,169,110,0.16); }
        .pv-b-cred { background: #0b0b0d; padding: clamp(26px, 3vw, 42px); }
        .pv-b-cred h3 {
          font-family: var(--font-montserrat), sans-serif; font-size: 9.5px; font-weight: 600;
          letter-spacing: 0.26em; text-transform: uppercase; color: #c9a96e; margin: 0 0 14px;
        }
        .pv-b-cred p { font-size: 0.82rem; }
        @media (max-width: 900px) {
          .pv-b-story-grid { grid-template-columns: 1fr; gap: 56px; }
          .pv-b-frame::after { right: -10px; bottom: -10px; top: 10px; left: 10px; }
          .pv-b-creds { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="pv-b-story-head">
        <p className="pv-b-label">01 &#8212; Engineer turned coach</p>
        <h2 className="pv-b-display pv-b-story-h2">
          <RevealLines lines={["I learned the hard way", <i key="i">so you don&rsquo;t have to.</i>]} stagger={130} />
        </h2>
      </div>

      <div className="pv-b-story-grid">
        <div>
          {portraitUrl && (
            <Reveal variant="fade" duration={1400}>
              <div className="pv-b-frame">
                <ParallaxMedia
                  src={portraitUrl}
                  alt="Lisa McPherson, certified personal trainer and founder of Lisa Fit Method"
                  objectPosition={portraitCrop}
                  aspect="3 / 4"
                  shift={13}
                  sizes="(max-width: 900px) 100vw, 38vw"
                />
              </div>
              <p className="pv-b-frame-cap">Lisa McPherson, CPT &#8212; Miami, FL</p>
            </Reveal>
          )}
        </div>

        <div className="pv-b-thread">
          {STORY_TIMELINE.map((beat, i) => (
            <Reveal key={beat.marker} className="pv-b-beat" variant="up" delay={i * 90} duration={1050}>
              <p className="pv-b-beat-marker">{beat.marker}</p>
              <h3 className="pv-b-beat-title">{beat.title}</h3>
              <p className="pv-b-body pv-b-beat-body">{beat.body}</p>
            </Reveal>
          ))}
          <Reveal variant="up">
            <Link href="/about" className="pv-b-story-link">
              Read the full story
              <span aria-hidden="true">&#8594;</span>
            </Link>
          </Reveal>
        </div>
      </div>

      <figure className="pv-b-story-pull">
        <blockquote>
          <RevealLines lines={[STORY_PULLQUOTE]} />
        </blockquote>
        <cite>Lisa McPherson, CPT</cite>
      </figure>

      <div className="pv-b-creds">
        {STORY_CREDS.map((c, i) => (
          <Reveal key={c.label} className="pv-b-cred" variant="up" delay={i * 120} duration={1050}>
            <h3>{c.label}</h3>
            <p className="pv-b-body">{c.body}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
