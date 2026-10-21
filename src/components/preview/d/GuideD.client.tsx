"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { FreeGuideSignupForm } from "@/components/FreeGuideSignupForm"
import {
  COURSE_PRICE_DISPLAY,
  COURSE_REGULAR_PRICE_DISPLAY,
  NUTRITION_COURSE_PRICE_DISPLAY,
  NUTRITION_COURSE_REGULAR_PRICE_DISPLAY,
  BUNDLE_PRICE_DISPLAY,
  BUNDLE_INDIVIDUAL_TOTAL_DISPLAY,
  BUNDLE_SAVINGS_DISPLAY,
} from "@/lib/pricing"
import { MOVEMENTS, WARMUP_A, MAIN_WORKOUT_A, COOLDOWN_A, FEATURES } from "@/app/free-guide/content"
import { Reveal, DrawRule } from "../Reveal.client"
import { GATE, UNLOCKED } from "./content/freeGuidePage"

// The training guide, restyled for Direction D.
//
// The gate behaves exactly as the live page does: the same
// FreeGuideSignupForm component with the same `source`, the same
// `lfm_guide_unlocked` session key, and the same `?unlocked=1` escape hatch.
// Only the presentation differs, so no lead-capture behaviour changes.
export function GuideD() {
  const searchParams = useSearchParams()
  const [unlocked, setUnlocked] = useState(() => searchParams.get("unlocked") === "1")

  useEffect(() => {
    if (!unlocked && sessionStorage.getItem("lfm_guide_unlocked") === "1") {
      setUnlocked(true)
    }
  }, [unlocked])

  function handleSuccess() {
    sessionStorage.setItem("lfm_guide_unlocked", "1")
    setUnlocked(true)
  }

  return (
    <div className="pv-d-guide">
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

      {!unlocked ? (
        <>
          <p className="pv-d-eyebrow">{GATE.eyebrow}</p>
          <div className="pv-d-open-rule">
            <DrawRule color="rgba(168,137,94,0.5)" />
          </div>
          <h1 className="pv-d-display pv-d-guide-h1">
            {GATE.headingLine1} <i>{GATE.headingLine2}</i>
          </h1>
          <p className="pv-d-guide-lede">{GATE.lede}</p>

          <div style={{ marginTop: "var(--d-step-4)" }}>
            {GATE.promises.map(([bold, rest]) => (
              <div key={bold} className="pv-d-promise">
                <span className="pv-d-promise-mark" aria-hidden="true">
                  →
                </span>
                <p>
                  <strong>{bold}</strong>
                  {rest}
                </p>
              </div>
            ))}
          </div>

          <div className="pv-d-guide-gate">
            <p className="pv-d-eyebrow">{GATE.formEyebrow}</p>
            <h2 className="pv-d-guide-gate-h">{GATE.formHeading}</h2>
            <p className="pv-d-guide-gate-b">{GATE.formBody}</p>
            <FreeGuideSignupForm source="free-guide-page" onSuccess={handleSuccess} formOnly />
          </div>

          <p className="pv-d-guide-sig">{GATE.signature}</p>
        </>
      ) : (
        <>
          <div className="pv-d-guide-confirm">
            <span aria-hidden="true">✓</span>
            <p>{UNLOCKED.confirmation}</p>
          </div>

          <p className="pv-d-eyebrow">{UNLOCKED.eyebrow}</p>
          <div className="pv-d-open-rule">
            <DrawRule color="rgba(168,137,94,0.5)" />
          </div>
          <h1 className="pv-d-display pv-d-guide-h1">
            {UNLOCKED.headingLine1} <i>{UNLOCKED.headingLine2}</i>
          </h1>
          <p className="pv-d-guide-lede">
            {UNLOCKED.ledeLead}
            <strong>{UNLOCKED.ledeStrong}</strong>
          </p>

          <div className="pv-d-guide-rule">
            <DrawRule color="rgba(26,26,26,0.14)" />
          </div>

          <Reveal variant="up">
            <div className="pv-d-guide-story">
              <p>
                {UNLOCKED.story.p1Lead}
                <strong>{UNLOCKED.story.p1Strong}</strong>
                {UNLOCKED.story.p1Tail}
              </p>
              <p>{UNLOCKED.story.p2}</p>
              <p>{UNLOCKED.story.p3}</p>
              <p className="pv-d-guide-story-sig">{UNLOCKED.story.attribution}</p>
            </div>
          </Reveal>

          <div className="pv-d-guide-rule">
            <DrawRule color="rgba(26,26,26,0.14)" />
          </div>

          <p className="pv-d-eyebrow">{UNLOCKED.movementsEyebrow}</p>
          <h2 className="pv-d-guide-h2">
            {UNLOCKED.movementsHeadingLine1} <i>{UNLOCKED.movementsHeadingLine2}</i>
          </h2>
          <p className="pv-d-guide-body">{UNLOCKED.movementsBody}</p>

          {MOVEMENTS.map((m, i) => (
            <Reveal key={m.name} variant="up" className="pv-d-move">
              <div className="pv-d-move-head">
                <span className="pv-d-move-num">{i + 1}</span>
                <h3 className="pv-d-move-name">{m.name}</h3>
                <span className="pv-d-move-pattern">{m.pattern}</span>
              </div>
              <p className="pv-d-move-what">{m.what}</p>
              <p className="pv-d-eyebrow">{UNLOCKED.cuesLabel}</p>
              <ul className="pv-d-move-cues">
                {m.cues.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
              {"watch" in m && m.watch && (
                <p className="pv-d-move-watch">
                  <strong>{UNLOCKED.watchLabel}</strong> {m.watch}
                </p>
              )}
            </Reveal>
          ))}

          <div className="pv-d-guide-rule">
            <DrawRule color="rgba(26,26,26,0.14)" />
          </div>

          <p className="pv-d-eyebrow">{UNLOCKED.dayEyebrow}</p>
          <h2 className="pv-d-guide-h2">
            {UNLOCKED.dayHeadingLine1} <i>{UNLOCKED.dayHeadingLine2}</i>
          </h2>
          <p className="pv-d-guide-body">{UNLOCKED.dayBody}</p>

          {/* data-tone must sit on a real element: Reveal does not forward
              unknown props, so the nav would not invert over this panel. */}
          <div data-tone="dark">
          <Reveal variant="up" className="pv-d-day">
            <p className="pv-d-eyebrow">{UNLOCKED.dayLabel}</p>
            <p className="pv-d-day-sum">{UNLOCKED.daySummary}</p>

            <div className="pv-d-day-group">
              <p className="pv-d-day-block-label">{UNLOCKED.warmupLabel}</p>
              {WARMUP_A.map((item) => (
                <div key={item.name} className="pv-d-day-row">
                  <p>{item.name}</p>
                  <span>{item.protocol}</span>
                </div>
              ))}
            </div>

            <div className="pv-d-day-group">
              <p className="pv-d-day-block-label">{UNLOCKED.mainLabel}</p>
              {MAIN_WORKOUT_A.map((ex) => (
                <div key={ex.name} className="pv-d-day-row">
                  <div>
                    <p>{ex.name}</p>
                    <p className="pv-d-day-row-note">{ex.note}</p>
                  </div>
                  <span>{ex.sets}</span>
                </div>
              ))}
            </div>

            <div className="pv-d-day-group">
              <p className="pv-d-day-block-label">{UNLOCKED.cooldownLabel}</p>
              {COOLDOWN_A.map((item) => (
                <div key={item.name} className="pv-d-day-row">
                  <p>{item.name}</p>
                  <span>{item.protocol}</span>
                </div>
              ))}
            </div>

            <p className="pv-d-day-note">{UNLOCKED.dayNote}</p>

            <div className="pv-d-also">
              <p className="pv-d-day-block-label">{UNLOCKED.alsoLabel}</p>
              <ul>
                {UNLOCKED.alsoItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </Reveal>
          </div>

          <div className="pv-d-guide-rule">
            <DrawRule color="rgba(26,26,26,0.14)" />
          </div>

          <p className="pv-d-eyebrow">{UNLOCKED.pitchEyebrow}</p>
          <h2 className="pv-d-guide-h2">
            {UNLOCKED.pitchHeadingLine1} <i>{UNLOCKED.pitchHeadingLine2}</i>
          </h2>
          <p className="pv-d-guide-body">{UNLOCKED.pitchP1}</p>
          <p className="pv-d-guide-body">{UNLOCKED.pitchP2}</p>
          <ul className="pv-d-feat">
            {FEATURES.map(([bold, rest]) => (
              <li key={bold}>
                <strong>{bold}</strong>
                {rest}
              </li>
            ))}
          </ul>

          <div className="pv-d-offer" data-tone="dark">
            <div className="pv-d-offer-price">
              <span className="pv-d-offer-was">{COURSE_REGULAR_PRICE_DISPLAY}</span>
              <span className="pv-d-offer-now">{COURSE_PRICE_DISPLAY}</span>
              <span className="pv-d-offer-badge">{UNLOCKED.limited}</span>
            </div>
            <h3 className="pv-d-offer-h">
              {UNLOCKED.ctaHeadingLine1} <i>{UNLOCKED.ctaHeadingLine2}</i>
            </h3>
            <p className="pv-d-offer-b">{UNLOCKED.ctaBody}</p>
            <Link href={UNLOCKED.ctaHref} className="pv-d-btn pv-d-btn--gold">
              <span>{UNLOCKED.cta}</span>
            </Link>
            <p className="pv-d-offer-note">{UNLOCKED.ctaNote}</p>
          </div>

          <div className="pv-d-alt">
            <p className="pv-d-eyebrow">{UNLOCKED.nutritionLabel}</p>
            <p className="pv-d-alt-b">{UNLOCKED.nutritionBody}</p>
            <div className="pv-d-alt-price">
              <span className="pv-d-alt-now">{NUTRITION_COURSE_PRICE_DISPLAY}</span>
              <span className="pv-d-alt-was">{NUTRITION_COURSE_REGULAR_PRICE_DISPLAY}</span>
              <span className="pv-d-offer-badge">{UNLOCKED.limited}</span>
            </div>
            <Link href={UNLOCKED.nutritionHref} className="pv-d-btn pv-d-btn--outline">
              <span>{UNLOCKED.nutritionCta}</span>
            </Link>
          </div>

          <div className="pv-d-offer" data-tone="dark">
            <p className="pv-d-eyebrow">{UNLOCKED.bundleLabel}</p>
            <p className="pv-d-offer-b" style={{ marginTop: "var(--d-step-2)", marginBottom: "var(--d-step-3)" }}>
              Both courses together. Train right and eat to match your effort.{" "}
              {BUNDLE_INDIVIDUAL_TOTAL_DISPLAY} if bought separately.
            </p>
            <div className="pv-d-offer-price" style={{ marginBottom: "var(--d-step-3)" }}>
              <span className="pv-d-offer-now" style={{ fontSize: "1.8rem" }}>
                {BUNDLE_PRICE_DISPLAY}
              </span>
              <span className="pv-d-alt-was">{BUNDLE_INDIVIDUAL_TOTAL_DISPLAY}</span>
              <span className="pv-d-offer-badge">Save {BUNDLE_SAVINGS_DISPLAY}</span>
            </div>
            <Link href={UNLOCKED.bundleHref} className="pv-d-btn pv-d-btn--gold">
              <span>{UNLOCKED.bundleCta}</span>
            </Link>
          </div>

          <p className="pv-d-guide-sig">{UNLOCKED.signature}</p>
        </>
      )}
    </div>
  )
}
