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
import { GuideStylesD } from "./GuideStylesD"
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
      <GuideStylesD />

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
