// The live /coaching page, in Direction D.
import Image from "next/image"
import Link from "next/link"
import { COACHING_3MONTH_DISPLAY, COACHING_MTM_DISPLAY } from "@/lib/pricing"
import { CoachingApplicationForm } from "@/components/CoachingApplicationForm.client"
import { Reveal } from "@/components/preview/Reveal.client"
import { PageShellD } from "@/components/preview/d/PageShellD"
import { PageHeroD } from "@/components/preview/d/PageHeroD"
import { ToneShift } from "@/components/preview/d/FlowD"
import { SectionD, OpenD, MarkerListD, ModuleRailD } from "@/components/preview/d/Sections"
import { AccordionD } from "@/components/preview/d/AccordionD.client"
import {
  CO_HERO,
  CO_EXPERIENCE,
  CO_GET,
  CO_WHO,
  CO_HOW_WE_COACH,
  CO_STEPS,
  CO_WEEK,
  CO_INVESTMENT,
  CO_ABOUT,
  CO_FAQ,
  CO_APPLY,
} from "@/components/preview/d/content/coachingPage"

const BG_ARCH = "/preview/bg-arch.jpg"
const BG_LIGHT = "/preview/bg-light.jpg"
const BG_LIGHT_2 = "/preview/bg-light-2.jpg"
const BG_STUDIO = "/preview/bg-studio.jpg"
const BG_DARK = "/preview/bg-dark.jpg"
// The abs photograph moves up the page as a transition band; About Me takes
// the flexing portrait, which is the same file the homepage bundle uses.
const TRANSITION_PHOTO = "/lisa-coaching-about.jpg"
const ABOUT_PHOTO = "/lisa-coaching-hero.jpg"

export function CoachingPageD() {
  return (
    <PageShellD>
      <style>{`
        .pv-d-co-pillars { display: flex; flex-wrap: wrap; gap: 10px 26px; margin-top: var(--d-step-4); }
        .pv-d-co-pillar {
          font-family: var(--font-dm-sans), sans-serif; font-size: 11px; font-weight: 500;
          letter-spacing: 0.12em; text-transform: uppercase; color: rgba(245,242,238,0.6);
          display: flex; align-items: center; gap: 9px;
        }
        .pv-d-co-pillar::before { content: ""; width: 14px; height: 1px; background: rgba(200,169,126,0.7); }
        .pv-d-co-actions { display: flex; gap: var(--d-step-2); flex-wrap: wrap; align-items: center; margin-top: var(--d-step-4); }
        .pv-d-co-quote {
          margin-top: var(--d-step-4); padding-left: clamp(16px, 2.4vw, 26px);
          border-left: 1px solid rgba(200,169,126,0.5);
        }
        .pv-d-co-quote p {
          font-family: var(--font-playfair), serif; font-style: italic; font-weight: 400;
          font-size: clamp(1.02rem, 1.4vw, 1.22rem); line-height: 1.6;
          color: rgba(245,242,238,0.84); margin: 0; max-width: 48ch;
        }
        .pv-d-co-quote span {
          display: block; margin-top: var(--d-step-2);
          font-family: var(--font-dm-sans), sans-serif; font-size: 10px; font-weight: 600;
          letter-spacing: 0.2em; text-transform: uppercase; color: var(--d-accent);
        }
        .pv-d-co-exp { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: clamp(34px, 5vw, 86px); align-items: start; }
        @media (max-width: 900px) { .pv-d-co-exp { grid-template-columns: 1fr; gap: var(--d-step-5); } }
        /* Three of these captures are tall phone screens and the fourth is a
           near-square card. A plain 2x2 grid made that mismatch read as a
           hole under the square, so the four are set as two interlocking
           columns instead: the taller column runs full height, the shorter
           one is dropped so it sits against the middle of its neighbour, and
           the square is treated as what it is — a detail lifted out of the
           app rather than a fourth whole screen. Nothing is cropped. */
        .pv-d-co-shots { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(12px, 1.6vw, 22px); align-items: start; }
        .pv-d-co-shots-col { display: flex; flex-direction: column; gap: clamp(12px, 1.6vw, 22px); }
        .pv-d-co-shots-col--drop { margin-top: clamp(38px, 8vw, 132px); }
        .pv-d-co-shot {
          position: relative; overflow: hidden; background: #efeae2;
          box-shadow: 0 20px 44px -30px rgba(26,26,26,0.55);
        }
        .pv-d-co-shot img { width: 100%; height: auto; display: block; }
        .pv-d-co-shot--card {
          box-shadow: 0 26px 52px -26px rgba(26,26,26,0.5);
          outline: 1px solid rgba(168,137,94,0.3); outline-offset: -1px;
        }
        @media (max-width: 560px) {
          /* The drop costs more than it gives once the columns are this
             narrow, and it pushes the last card well below the fold. */
          .pv-d-co-shots-col--drop { margin-top: 0; }
        }
        /* A transition band between how we coach and how coaching works.
           The photograph is feathered into the page with the same radial
           mask the nutrition still uses, so it reads as part of the paper
           rather than a block dropped between two sections. The crop keeps
           her face and torso in frame; object-position does the work so the
           file itself is untouched. */
        .pv-d-co-band { position: relative; padding: clamp(18px, 3vw, 46px) var(--d-gutter); }
        .pv-d-co-band-inner { max-width: var(--d-max); margin: 0 auto; display: flex; justify-content: center; }
        /* A standing portrait cannot survive a wide letterbox slice: at 16:7
           only a quarter of the frame shows and the crop lands on her face,
           losing the photograph entirely. It is set as an upright plate
           instead, which keeps her in frame from face to thigh and still
           reads as a transition because of the space either side of it.
           Unfaded, for the same reason as the portrait above. */
        .pv-d-co-band-frame {
          position: relative; width: clamp(240px, 46vw, 520px); aspect-ratio: 3 / 4; overflow: hidden;
          box-shadow: 0 26px 56px -34px rgba(26,26,26,0.5);
        }
        .pv-d-co-band-frame img {
          width: 100%; height: 100%; display: block;
          object-fit: cover; object-position: center 28%;
        }
        @media (max-width: 760px) {
          .pv-d-co-band-frame { width: min(78vw, 360px); }
        }
        .pv-d-co-grid3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: clamp(26px, 3.4vw, 58px); }
        @media (max-width: 880px) { .pv-d-co-grid3 { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 580px) { .pv-d-co-grid3 { grid-template-columns: 1fr; gap: var(--d-step-3); } }
        .pv-d-co-item-t {
          font-family: var(--font-playfair), serif; font-weight: 500;
          font-size: clamp(1.05rem, 1.4vw, 1.25rem); line-height: 1.3; margin: 0 0 var(--d-step-1);
        }
        .pv-d-co-item-b {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
          font-size: clamp(0.86rem, 0.98vw, 0.94rem); line-height: 1.75;
          color: var(--d-muted); margin: 0;
        }
        .pv-d-co-two { display: grid; grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr); gap: clamp(34px, 5vw, 86px); align-items: start; }
        @media (max-width: 900px) { .pv-d-co-two { grid-template-columns: 1fr; gap: var(--d-step-5); } }
        .pv-d-co-week-close {
          font-family: var(--font-playfair), serif; font-style: italic;
          font-size: clamp(1.1rem, 1.6vw, 1.35rem); color: var(--d-accent-dark);
          margin: var(--d-step-4) 0 0;
        }
        .pv-d-co-tiers { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr); gap: clamp(30px, 4vw, 72px); align-items: start; }
        @media (max-width: 860px) { .pv-d-co-tiers { grid-template-columns: 1fr; gap: var(--d-step-5); } }
        .pv-d-co-tier { padding-top: var(--d-step-3); border-top: 2px solid var(--d-accent); }
        .pv-d-co-tier--alt { border-top: 1px solid var(--d-rule-dark); }
        .pv-d-co-tier-badge {
          display: inline-block; margin-bottom: var(--d-step-2);
          font-family: var(--font-dm-sans), sans-serif; font-size: 8.5px; font-weight: 600;
          letter-spacing: 0.16em; text-transform: uppercase;
          color: var(--d-black); background: var(--d-accent); padding: 4px 9px;
        }
        .pv-d-co-tier-label {
          font-family: var(--font-dm-sans), sans-serif; font-size: 10px; font-weight: 600;
          letter-spacing: 0.2em; text-transform: uppercase;
          color: rgba(245,242,238,0.5); margin: 0 0 var(--d-step-2);
        }
        .pv-d-co-tier-price { display: flex; align-items: baseline; gap: 12px; margin-bottom: var(--d-step-3); }
        .pv-d-co-tier-now {
          font-family: var(--font-playfair), serif; font-weight: 500; line-height: 0.9;
          font-size: clamp(2.4rem, 4vw, 3.2rem); color: var(--d-accent);
        }
        .pv-d-co-tier-per {
          font-family: var(--font-dm-sans), sans-serif; font-size: 11px;
          letter-spacing: 0.1em; text-transform: uppercase; color: rgba(245,242,238,0.4);
        }
        .pv-d-co-inv-foot { margin-top: var(--d-step-5); padding-top: var(--d-step-4); border-top: 1px solid var(--d-rule-dark); text-align: center; }
        .pv-d-co-inv-note {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
          font-size: 0.92rem; line-height: 1.75; color: rgba(245,242,238,0.5);
          max-width: 60ch; margin: 0 auto var(--d-step-3);
        }
        .pv-d-co-inv-sub {
          font-family: var(--font-dm-sans), sans-serif; font-size: 11px;
          color: rgba(245,242,238,0.3); margin: var(--d-step-2) 0 0;
        }
        .pv-d-co-about { display: grid; grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr); gap: clamp(34px, 5vw, 86px); align-items: start; }
        @media (max-width: 900px) { .pv-d-co-about { grid-template-columns: 1fr; gap: var(--d-step-4); } }
        /* No feathered edge on Lisa's own photographs. The radial mask that
           used to sit here washed the picture out towards its edges, which
           is the opposite of what a portrait wants. The framing comes from
           the crop and a restrained lift instead, matching the platform
           captures above. The food still keeps its feather — that treatment
           was approved for the nutrition imagery specifically. */
        .pv-d-co-portrait {
          position: relative; aspect-ratio: 3 / 4; overflow: hidden;
          box-shadow: 0 24px 52px -34px rgba(26,26,26,0.55);
        }
        .pv-d-co-portrait img { width: 100%; height: 100%; object-fit: cover; object-position: center 22%; display: block; }
        .pv-d-co-p {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
          font-size: clamp(0.94rem, 1.08vw, 1.02rem); line-height: 1.82;
          color: var(--d-muted); margin: 0 0 var(--d-step-2); max-width: 62ch;
        }
        .pv-d-co-apply { display: grid; grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr); gap: clamp(36px, 5vw, 90px); align-items: start; }
        @media (max-width: 960px) { .pv-d-co-apply { grid-template-columns: 1fr; gap: var(--d-step-5); } }
        /* The application is far taller than the column beside it, so the
           intro sticks rather than leaving most of the page's left half
           empty while the reader works down the form. */
        @media (min-width: 961px) {
          .pv-d-co-apply-intro { position: sticky; top: 118px; }
        }
        .pv-d-co-next { list-style: none; margin: var(--d-step-3) 0 var(--d-step-3); padding: 0; counter-reset: s; }
        .pv-d-co-next li {
          display: flex; gap: 14px; align-items: flex-start; margin-bottom: var(--d-step-2);
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
          font-size: 0.93rem; line-height: 1.7; color: rgba(26,26,26,0.7);
        }
        .pv-d-co-next li span {
          flex-shrink: 0; width: 25px; height: 25px; border-radius: 50%;
          border: 1px solid rgba(168,137,94,0.6); color: var(--d-accent-dark);
          display: inline-flex; align-items: center; justify-content: center;
          font-family: var(--font-playfair), serif; font-size: 0.8rem;
        }
        .pv-d-co-small {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
          font-size: 0.84rem; line-height: 1.7; color: var(--d-muted); margin: 0 0 var(--d-step-3);
        }
        .pv-d-co-bundle-link {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
          font-size: 0.86rem; line-height: 1.7; color: var(--d-accent-dark);
          text-decoration: none; display: inline-block; max-width: 60ch;
          border-bottom: 1px solid rgba(168,137,94,0.3); padding-bottom: 3px;
        }
        .pv-d-co-bundle-link:hover { color: var(--d-text); }
        /* The production application form, restyled in place. The markup and
           all of its logic are untouched; these rules only change how it
           looks so it belongs on a Direction D page. */
        .pv-d .ch-form-root .ch-input {
          background: transparent !important;
          border: 0 !important;
          border-bottom: 1px solid var(--d-rule) !important;
          padding: 11px 2px !important;
          font-weight: 300;
          transition: border-color 420ms ease;
        }
        .pv-d .ch-form-root .ch-input:focus { border-bottom-color: var(--d-accent-dark) !important; }
        .pv-d .ch-form-root select.ch-input { padding-right: 26px !important; }
        .pv-d .ch-form-root .ch-btn-primary {
          background: var(--d-accent-dark); color: #fff; letter-spacing: 0.18em;
          font-weight: 600; padding: 18px 44px;
        }
        .pv-d .ch-form-root .ch-btn-primary:hover { background: var(--d-black); }
      `}</style>

      <PageHeroD
        eyebrow={CO_HERO.eyebrow}
        headingLines={[CO_HERO.headingLine1, <i key="em">{CO_HERO.headingLine2}</i>]}
        lede={CO_HERO.lede}
        backdrop={BG_ARCH}
      >
        <Reveal variant="up" delay={220}>
          <div className="pv-d-co-quote">
            <p>{CO_HERO.quote}</p>
            <span>{CO_HERO.quoteAttribution}</span>
          </div>
          <div className="pv-d-co-pillars">
            {CO_HERO.pillars.map((p) => (
              <span key={p} className="pv-d-co-pillar">
                {p}
              </span>
            ))}
          </div>
          <div className="pv-d-co-actions">
            <Link href={CO_HERO.ctaHref} className="pv-d-btn pv-d-btn--gold">
              <span>{CO_HERO.cta}</span>
            </Link>
            <Link href={CO_HERO.secondaryHref} className="pv-d-btn pv-d-btn--ghost-dark">
              <span>{CO_HERO.secondary}</span>
            </Link>
          </div>
        </Reveal>
      </PageHeroD>

      <ToneShift from="dark" to="light" />

      <SectionD id="experience" label="Your coaching experience" backdrop={BG_LIGHT} opacity={0.16} scrim="right">
        <div className="pv-d-co-exp">
          <div>
            <OpenD
              eyebrow={CO_EXPERIENCE.eyebrow}
              lines={[CO_EXPERIENCE.heading]}
              lede={CO_EXPERIENCE.body}
              maxWidth="18ch"
            />
            <MarkerListD items={CO_EXPERIENCE.features} marker="check" />
            <Reveal variant="up" delay={140}>
              <Link href={CO_EXPERIENCE.linkHref} className="pv-d-open-aside" style={{ marginTop: "var(--d-step-4)", display: "inline-block" }}>
                {CO_EXPERIENCE.link}
              </Link>
            </Reveal>
          </div>
          <Reveal variant="fade" duration={1300}>
            <div className="pv-d-co-shots">
              {[
                { items: [CO_EXPERIENCE.shots[0], CO_EXPERIENCE.shots[2]], drop: false },
                { items: [CO_EXPERIENCE.shots[1], CO_EXPERIENCE.shots[3]], drop: true },
              ].map((col, ci) => (
                <div
                  key={ci}
                  className={`pv-d-co-shots-col${col.drop ? " pv-d-co-shots-col--drop" : ""}`}
                >
                  {col.items.map((shot) => (
                    <div
                      key={shot.src}
                      className={`pv-d-co-shot${shot.w > shot.h ? " pv-d-co-shot--card" : ""}`}
                    >
                      <Image
                        src={shot.src}
                        alt={shot.alt}
                        width={shot.w}
                        height={shot.h}
                        sizes="(max-width: 900px) 44vw, 22vw"
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </SectionD>

      <SectionD alt label="What you’ll get" backdrop={BG_LIGHT_2} opacity={0.14} scrim="edges">
        <OpenD eyebrow={CO_GET.eyebrow} lines={[CO_GET.heading]} maxWidth="20ch" />
        <div className="pv-d-co-grid3" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
          {CO_GET.items.map((it, i) => (
            <Reveal key={it.title} variant="up" delay={Math.min(i * 90, 300)}>
              <h3 className="pv-d-co-item-t">{it.title}</h3>
              <p className="pv-d-co-item-b">{it.body}</p>
            </Reveal>
          ))}
        </div>
      </SectionD>

      <SectionD label="Who this is for and how we coach">
        <div className="pv-d-co-two">
          <div>
            <OpenD eyebrow={CO_WHO.eyebrow} lines={[CO_WHO.heading]} maxWidth="14ch" />
            <MarkerListD items={CO_WHO.items} marker="check" />
          </div>
          <div>
            <OpenD
              eyebrow={CO_HOW_WE_COACH.eyebrow}
              lines={[CO_HOW_WE_COACH.heading]}
              lede={CO_HOW_WE_COACH.body}
              maxWidth="18ch"
            />
            <div className="pv-d-co-grid3" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
              {CO_HOW_WE_COACH.items.map((it, i) => (
                <Reveal key={it.title} variant="up" delay={Math.min(i * 70, 280)}>
                  <h3 className="pv-d-co-item-t">{it.title}</h3>
                  <p className="pv-d-co-item-b">{it.body}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </SectionD>

      {/* Editorial transition into how coaching works. */}
      <div className="pv-d-co-band" data-tone="light" aria-hidden="false">
        <div className="pv-d-co-band-inner">
          <Reveal variant="fade" duration={1400}>
            <div className="pv-d-co-band-frame">
              <Image
                src={TRANSITION_PHOTO}
                alt="Lisa McPherson"
                width={1022}
                height={1786}
                sizes="(max-width: 900px) 100vw, 1180px"
              />
            </div>
          </Reveal>
        </div>
      </div>

      <SectionD id="how" alt label="How coaching works" backdrop={BG_STUDIO} opacity={0.12} scrim="left">
        <OpenD eyebrow={CO_STEPS.eyebrow} lines={[CO_STEPS.heading]} maxWidth="18ch" />
        <ModuleRailD
          modules={CO_STEPS.steps.map((s, i) => ({
            num: String(i + 1),
            title: s.title,
            desc: s.body,
          }))}
        />
      </SectionD>

      <SectionD label="A typical week">
        <div style={{ maxWidth: 820 }}>
          <OpenD eyebrow={CO_WEEK.eyebrow} lines={[CO_WEEK.heading]} maxWidth="18ch" />
          <MarkerListD items={CO_WEEK.items} marker="arrow" />
          <p className="pv-d-co-week-close">{CO_WEEK.closing}</p>
        </div>
      </SectionD>

      <ToneShift from="light" to="dark" />

      <SectionD tone="dark" label="Investment" backdrop={BG_DARK} opacity={0.2} scrim="center">
        <OpenD
          eyebrow={CO_INVESTMENT.eyebrow}
          lines={[CO_INVESTMENT.heading]}
          lede={CO_INVESTMENT.lede}
          maxWidth="20ch"
        />
        <div className="pv-d-co-tiers">
          <Reveal variant="up" className="pv-d-co-tier">
            <span className="pv-d-co-tier-badge">{CO_INVESTMENT.bestValue}</span>
            <p className="pv-d-co-tier-label">{CO_INVESTMENT.primaryLabel}</p>
            <div className="pv-d-co-tier-price">
              <span className="pv-d-co-tier-now">{COACHING_3MONTH_DISPLAY}</span>
              <span className="pv-d-co-tier-per">{CO_INVESTMENT.per}</span>
            </div>
            <MarkerListD items={CO_INVESTMENT.primaryPoints} marker="check" />
          </Reveal>
          <Reveal variant="up" delay={120} className="pv-d-co-tier pv-d-co-tier--alt">
            <p className="pv-d-co-tier-label">{CO_INVESTMENT.secondaryLabel}</p>
            <div className="pv-d-co-tier-price">
              <span className="pv-d-co-tier-now">{COACHING_MTM_DISPLAY}</span>
              <span className="pv-d-co-tier-per">{CO_INVESTMENT.per}</span>
            </div>
            <MarkerListD items={CO_INVESTMENT.secondaryPoints} marker="check" />
          </Reveal>
        </div>
        <div className="pv-d-co-inv-foot">
          <p className="pv-d-co-inv-note">{CO_INVESTMENT.note}</p>
          <Link href={CO_INVESTMENT.ctaHref} className="pv-d-btn pv-d-btn--gold">
            <span>{CO_INVESTMENT.cta}</span>
          </Link>
          <p className="pv-d-co-inv-sub">{CO_INVESTMENT.ctaNote}</p>
        </div>
      </SectionD>

      <ToneShift from="dark" to="light" />

      <SectionD label="About me" backdrop={BG_LIGHT} opacity={0.16} scrim="left">
        <div className="pv-d-co-about">
          <Reveal variant="fade" duration={1300}>
            <div className="pv-d-co-portrait">
              <Image
                src={ABOUT_PHOTO}
                alt={CO_ABOUT.photoAlt}
                width={998}
                height={1388}
                sizes="(max-width: 900px) 92vw, 34vw"
                // On a phone the browser picks the 3840w candidate for this
                // one file and then never finishes the load, which is what
                // left the homepage bundle portrait blank until it was
                // served unprocessed. The source is only 998x1388 and renders
                // at most ~430px wide, so serving it as-is is both reliable
                // and cheaper than the processed variant.
                unoptimized
              />
            </div>
          </Reveal>
          <div>
            <OpenD eyebrow={CO_ABOUT.eyebrow} lines={[CO_ABOUT.heading]} maxWidth="14ch" />
            <Reveal variant="up" delay={120}>
              {CO_ABOUT.paragraphs.map((p) => (
                <p key={p.slice(0, 28)} className="pv-d-co-p">
                  {p}
                </p>
              ))}
            </Reveal>
            <MarkerListD items={CO_ABOUT.points} marker="check" columns={2} />
          </div>
        </div>
      </SectionD>

      <SectionD alt label="Common questions" backdrop={BG_LIGHT_2} opacity={0.14} scrim="edges">
        <div style={{ maxWidth: 860 }}>
          <OpenD eyebrow={CO_FAQ.eyebrow} lines={[CO_FAQ.heading]} maxWidth="20ch" />
          <AccordionD items={CO_FAQ.items} idPrefix="coaching-faq" />
        </div>
      </SectionD>

      <SectionD id="apply" label="Apply for coaching">
        <div className="pv-d-co-apply">
          <div className="pv-d-co-apply-intro">
            <OpenD
              eyebrow={CO_APPLY.eyebrow}
              lines={[CO_APPLY.heading]}
              lede={CO_APPLY.lede}
              maxWidth="16ch"
            />
            <Reveal variant="up" delay={120}>
              <p className="pv-d-co-p">{CO_APPLY.reviewNote}</p>
              <p className="pv-d-eyebrow">{CO_APPLY.nextLabel}</p>
              <ol className="pv-d-co-next">
                {CO_APPLY.nextSteps.map((s, i) => (
                  <li key={s}>
                    <span>{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
              <p className="pv-d-co-small">{CO_APPLY.callNote}</p>
              <Link href={CO_APPLY.bundleHref} className="pv-d-co-bundle-link">
                {CO_APPLY.bundleLink}
              </Link>
            </Reveal>
          </div>
          <Reveal variant="up" delay={160}>
            <CoachingApplicationForm />
          </Reveal>
        </div>
      </SectionD>
    </PageShellD>
  )
}
