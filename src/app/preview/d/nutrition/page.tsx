import type { Metadata } from "next"
import Link from "next/link"
import {
  NUTRITION_COURSE_PRICE_DISPLAY,
  NUTRITION_COURSE_REGULAR_PRICE_DISPLAY,
  BUNDLE_PRICE_DISPLAY,
  BUNDLE_INDIVIDUAL_TOTAL_DISPLAY,
  BUNDLE_SAVINGS_DISPLAY,
} from "@/lib/pricing"
import { MODULES, FAQS } from "@/app/nutrition/content"
import { Reveal } from "@/components/preview/Reveal.client"
import { PageShellD } from "@/components/preview/d/PageShellD"
import { PageHeroD } from "@/components/preview/d/PageHeroD"
import { ToneShift } from "@/components/preview/d/FlowD"
import { SectionD, OpenD, MarkerListD, ModuleRailD, QaListD } from "@/components/preview/d/Sections"
import {
  NUTRITION_HERO,
  WHAT_YOU_GET,
  NUTRITION_MODULES_HEAD,
  NUTRITION_FOR,
  NUTRITION_PAIR,
  NUTRITION_FAQ_HEAD,
  NUTRITION_DISCLAIMER,
  NUTRITION_FINAL,
} from "@/components/preview/d/content/nutritionPage"

export const revalidate = 60

export const metadata: Metadata = {
  title: "Nutrition Foundations — Direction D Preview",
  description: "Internal design prototype. Not live content.",
  robots: { index: false, follow: false, nocache: true },
}

const BG_STUDIO = "/preview/bg-studio.jpg"
const BG_LIGHT = "/preview/bg-light.jpg"
const BG_LIGHT_2 = "/preview/bg-light-2.jpg"
const BG_DARK = "/preview/bg-dark.jpg"
const NUTRITION_BOWL = "/preview/nutrition-bowl.jpg"

export default function PreviewNutritionPage() {
  return (
    <PageShellD>
      <style>{`
        .pv-d-nhero-buy { display: flex; align-items: baseline; gap: 14px; flex-wrap: wrap; margin-top: var(--d-step-4); }
        .pv-d-nhero-was {
          font-family: var(--font-dm-sans), sans-serif; font-size: 1rem;
          color: rgba(245,242,238,0.3); text-decoration: line-through;
        }
        .pv-d-nhero-now {
          font-family: var(--font-playfair), serif; font-weight: 500; line-height: 0.9;
          font-size: clamp(2.8rem, 4.6vw, 3.8rem); color: var(--d-accent);
        }
        .pv-d-badge {
          font-family: var(--font-dm-sans), sans-serif; font-size: 8.5px; font-weight: 600;
          letter-spacing: 0.16em; text-transform: uppercase;
          color: var(--d-black); background: var(--d-accent); padding: 4px 9px;
        }
        .pv-d-nhero-reg {
          font-family: var(--font-dm-sans), sans-serif; font-size: 11px;
          color: rgba(245,242,238,0.32); margin: var(--d-step-2) 0 var(--d-step-3);
        }
        .pv-d-nhero-actions { display: flex; gap: var(--d-step-2); flex-wrap: wrap; align-items: center; }
        .pv-d-nhero-note {
          font-family: var(--font-dm-sans), sans-serif; font-size: 11px; line-height: 1.7;
          color: rgba(245,242,238,0.32); margin: var(--d-step-3) 0 0;
        }
        .pv-d-get-grid {
          display: grid; grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: clamp(26px, 3.4vw, 64px);
        }
        @media (max-width: 860px) { .pv-d-get-grid { grid-template-columns: 1fr; gap: var(--d-step-3); } }
        .pv-d-get-label {
          font-family: var(--font-playfair), serif; font-weight: 500;
          font-size: clamp(1.05rem, 1.4vw, 1.28rem); line-height: 1.3; margin: 0 0 var(--d-step-1);
        }
        .pv-d-get-body {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
          font-size: clamp(0.86rem, 0.98vw, 0.94rem); line-height: 1.75;
          color: var(--d-muted); margin: 0;
        }
        .pv-d-get-num {
          font-family: var(--font-playfair), serif; font-size: 0.8rem; letter-spacing: 0.1em;
          color: rgba(168,137,94,0.6); display: block; margin-bottom: var(--d-step-2);
        }
        .pv-d-for-grid {
          display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
          gap: clamp(34px, 5vw, 86px); align-items: start;
        }
        @media (max-width: 900px) { .pv-d-for-grid { grid-template-columns: 1fr; gap: var(--d-step-5); } }
        .pv-d-pair-body {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
          font-size: clamp(0.92rem, 1.05vw, 1rem); line-height: 1.78;
          color: rgba(26,26,26,0.72); margin: 0 0 var(--d-step-2);
        }
        .pv-d-pair-body--muted { color: var(--d-muted); font-size: clamp(0.86rem, 0.96vw, 0.92rem); margin-bottom: var(--d-step-4); }
        .pv-d-pair-photo {
          position: relative; aspect-ratio: 4 / 3; overflow: hidden;
          margin-bottom: var(--d-step-4);
          -webkit-mask-image: radial-gradient(ellipse 68% 74% at 50% 50%, #000 58%, transparent 100%);
          mask-image: radial-gradient(ellipse 68% 74% at 50% 50%, #000 58%, transparent 100%);
        }
        .pv-d-pair-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .pv-d-disclaimer {
          max-width: 82ch; margin: 0 auto; padding-top: var(--d-step-4);
          border-top: 1px solid var(--d-rule);
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
          font-size: 0.8rem; line-height: 1.85; color: var(--d-muted);
        }
        .pv-d-disclaimer strong { color: var(--d-text); font-weight: 500; }
        .pv-d-nfinal { max-width: 620px; margin: 0 auto; text-align: center; }
        .pv-d-nfinal-badge { display: inline-block; margin-bottom: var(--d-step-3); }
        .pv-d-nfinal-price { display: flex; align-items: baseline; gap: 14px; justify-content: center; margin-bottom: var(--d-step-1); }
        .pv-d-nfinal-reg {
          font-family: var(--font-dm-sans), sans-serif; font-size: 12px;
          color: rgba(245,242,238,0.25); margin: 0 0 var(--d-step-3);
        }
        .pv-d-nfinal-note {
          font-family: var(--font-dm-sans), sans-serif; font-size: 0.82rem;
          color: rgba(245,242,238,0.35); margin: var(--d-step-3) 0 0;
        }
        .pv-d-nfinal-note strong { color: rgba(245,242,238,0.55); font-weight: 500; }
        .pv-d-together {
          margin-top: var(--d-step-5); padding-top: var(--d-step-4);
          border-top: 1px solid var(--d-rule-dark);
        }
        .pv-d-together-label { margin-bottom: var(--d-step-3); }
        .pv-d-together-row {
          display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between;
          gap: var(--d-step-3); text-align: left;
        }
        .pv-d-together-name {
          font-family: var(--font-dm-sans), sans-serif; font-size: 9.5px; font-weight: 600;
          letter-spacing: 0.2em; text-transform: uppercase; color: var(--d-accent);
          margin: 0 0 5px;
        }
        .pv-d-together-sub {
          font-family: var(--font-dm-sans), sans-serif; font-size: 0.78rem;
          color: rgba(245,242,238,0.42); margin: 0;
        }
        .pv-d-together-buy { display: flex; align-items: center; gap: 16px; }
        .pv-d-together-price {
          font-family: var(--font-playfair), serif; font-weight: 500;
          font-size: 1.7rem; color: var(--d-accent); line-height: 1;
        }
      `}</style>

      <PageHeroD
        eyebrow={NUTRITION_HERO.eyebrow}
        headingLines={[NUTRITION_HERO.headingLine1, <i key="em">{NUTRITION_HERO.headingLine2}</i>]}
        lede={NUTRITION_HERO.lede}
        backdrop={BG_STUDIO}
      >
        <Reveal variant="up" delay={240}>
          <div className="pv-d-nhero-buy">
            <span className="pv-d-nhero-was">{NUTRITION_COURSE_REGULAR_PRICE_DISPLAY}</span>
            <span className="pv-d-nhero-now">{NUTRITION_COURSE_PRICE_DISPLAY}</span>
            <span className="pv-d-badge">{NUTRITION_HERO.limited}</span>
          </div>
          <p className="pv-d-nhero-reg">Regular {NUTRITION_COURSE_REGULAR_PRICE_DISPLAY}. Limited time.</p>
          <div className="pv-d-nhero-actions">
            <Link href={NUTRITION_HERO.href} className="pv-d-btn pv-d-btn--gold">
              <span>{NUTRITION_HERO.cta}</span>
            </Link>
            <Link href={NUTRITION_HERO.jumpHref} className="pv-d-btn pv-d-btn--ghost-dark">
              <span>{NUTRITION_HERO.jumpCta}</span>
            </Link>
          </div>
          <p className="pv-d-nhero-note">
            {NUTRITION_HERO.noteLine1}
            <br />
            {NUTRITION_HERO.noteLine2}
          </p>
        </Reveal>
      </PageHeroD>

      {/* The section below is the alt ground, so the band must land on it. */}
      <ToneShift from="dark" to="light-alt" />

      <SectionD alt label="What you get" backdrop={BG_LIGHT} opacity={0.18} scrim="edges">
        <div className="pv-d-get-grid">
          {WHAT_YOU_GET.map((item, i) => (
            <Reveal key={item.label} variant="up" delay={Math.min(i * 90, 300)}>
              <span className="pv-d-get-num">{`0${i + 1}`}</span>
              <h2 className="pv-d-get-label">{item.label}</h2>
              <p className="pv-d-get-body">{item.body}</p>
            </Reveal>
          ))}
        </div>
      </SectionD>

      <SectionD id="modules" label="What’s inside">
        <OpenD
          eyebrow={NUTRITION_MODULES_HEAD.eyebrow}
          lines={[
            NUTRITION_MODULES_HEAD.headingLine1,
            <i key="em">{NUTRITION_MODULES_HEAD.headingLine2}</i>,
          ]}
          maxWidth="16ch"
        />
        <ModuleRailD modules={MODULES} />
      </SectionD>

      <SectionD alt label="Is this for me?" backdrop={BG_LIGHT_2} opacity={0.16} scrim="right">
        <div className="pv-d-for-grid">
          <div>
            <OpenD
              eyebrow={NUTRITION_FOR.eyebrow}
              lines={[NUTRITION_FOR.headingLine1, <i key="em">{NUTRITION_FOR.headingLine2}</i>]}
              maxWidth="16ch"
            />
            <MarkerListD items={NUTRITION_FOR.items} marker="check" />
          </div>
          <div>
            <Reveal variant="fade" duration={1200}>
              <div className="pv-d-pair-photo">
                {/* The nutrition still Lisa supplied, reused here so the
                    column is not a wall of type beside a long list. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={NUTRITION_BOWL} alt="A balanced meal built around protein and whole foods" />
              </div>
            </Reveal>
            <OpenD
              eyebrow={NUTRITION_PAIR.eyebrow}
              lines={[NUTRITION_PAIR.headingLine1, <i key="em">{NUTRITION_PAIR.headingLine2}</i>]}
              maxWidth="18ch"
            />
            <Reveal variant="up" delay={120}>
              <p className="pv-d-pair-body">{NUTRITION_PAIR.body1}</p>
              <p className="pv-d-pair-body pv-d-pair-body--muted">{NUTRITION_PAIR.body2}</p>
              <Link href={NUTRITION_PAIR.href} className="pv-d-btn pv-d-btn--outline">
                <span>{NUTRITION_PAIR.cta}</span>
              </Link>
            </Reveal>
          </div>
        </div>
      </SectionD>

      <SectionD label="Common questions">
        <div style={{ maxWidth: 820 }}>
          <OpenD eyebrow={NUTRITION_FAQ_HEAD.eyebrow} lines={[NUTRITION_FAQ_HEAD.heading]} />
          <QaListD items={FAQS} />
          <p className="pv-d-disclaimer" style={{ marginTop: "var(--d-step-5)" }}>
            <strong>{NUTRITION_DISCLAIMER.label}</strong>
            {NUTRITION_DISCLAIMER.body}
          </p>
        </div>
      </SectionD>

      <ToneShift from="light" to="dark" />

      <SectionD tone="dark" label="Ready to start?" backdrop={BG_DARK} opacity={0.22} scrim="center">
        <div className="pv-d-nfinal">
          <OpenD
            eyebrow={NUTRITION_FINAL.eyebrow}
            lines={[NUTRITION_FINAL.headingLine1, <i key="em">{NUTRITION_FINAL.headingLine2}</i>]}
            lede={NUTRITION_FINAL.body}
            centre
          />
          <Reveal variant="up" delay={120}>
            <span className="pv-d-badge pv-d-nfinal-badge">{NUTRITION_FINAL.limited}</span>
            <div className="pv-d-nfinal-price">
              <span className="pv-d-nhero-was">{NUTRITION_COURSE_REGULAR_PRICE_DISPLAY}</span>
              <span className="pv-d-nhero-now">{NUTRITION_COURSE_PRICE_DISPLAY}</span>
            </div>
            <p className="pv-d-nfinal-reg">Regular {NUTRITION_COURSE_REGULAR_PRICE_DISPLAY}. Limited time price.</p>
            <Link href={NUTRITION_FINAL.href} className="pv-d-btn pv-d-btn--gold">
              <span>{NUTRITION_FINAL.cta}</span>
            </Link>
            <p className="pv-d-nfinal-note">
              {NUTRITION_FINAL.noteLead}
              <strong>{NUTRITION_FINAL.noteStrong}</strong>
              {NUTRITION_FINAL.noteTail}
            </p>
          </Reveal>

          <div className="pv-d-together">
            <p className="pv-d-eyebrow pv-d-together-label">{NUTRITION_FINAL.betterTogether}</p>
            <div className="pv-d-together-row">
              <div>
                <p className="pv-d-together-name">{NUTRITION_FINAL.bundleLabel}</p>
                <p className="pv-d-together-sub">
                  Nutrition + Training Foundations · Save {BUNDLE_SAVINGS_DISPLAY} vs.{" "}
                  {BUNDLE_INDIVIDUAL_TOTAL_DISPLAY} individual
                </p>
              </div>
              <div className="pv-d-together-buy">
                <span className="pv-d-together-price">{BUNDLE_PRICE_DISPLAY}</span>
                <Link href={NUTRITION_FINAL.bundleHref} className="pv-d-btn pv-d-btn--gold">
                  <span>{NUTRITION_FINAL.bundleCta}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </SectionD>
    </PageShellD>
  )
}
