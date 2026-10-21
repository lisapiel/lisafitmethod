"use client"

import { useState } from "react"
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
import { PRINCIPLES } from "@/app/free-guide-nutrition/content"
import { Reveal, DrawRule } from "../Reveal.client"
import { GuideStylesD } from "./GuideStylesD"
import { N_GATE, N_UNLOCKED } from "./content/freeGuideNutritionPage"

// The nutrition guide, restyled for Direction D.
//
// The gate behaves exactly as the live page does: the same
// FreeGuideSignupForm, the same `source` and `apiEndpoint`, the same
// scroll-to-top on success and the same `?unlocked=1` escape hatch. Only
// the presentation differs.
//
// The production page sets each principle behind a small SVG icon. Those are
// decoration rather than content, and Direction D carries no icon chips
// anywhere else, so the number and category line do that work here instead.
export function GuideNutritionD() {
  const searchParams = useSearchParams()
  const [unlocked, setUnlocked] = useState(() => searchParams.get("unlocked") === "1")

  function handleSuccess() {
    setUnlocked(true)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="pv-d-guide">
      <GuideStylesD />
      <style>{`
        .pv-d-ng-h1 { font-size: clamp(1.7rem, 3.4vw, 2.5rem); margin: 0 0 var(--d-step-3); line-height: 1.15; }
        /* Principles: a numbered editorial run with the figure, reference and
           practical line each given their own register. */
        .pv-d-prin { padding: var(--d-step-4) 0; border-top: 1px solid var(--d-rule); }
        .pv-d-prin-head { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
        .pv-d-prin-num {
          font-family: var(--font-playfair), serif; font-size: 1.9rem; line-height: 1;
          color: rgba(168,137,94,0.5); font-weight: 500;
        }
        .pv-d-prin-cat {
          font-family: var(--font-dm-sans), sans-serif; font-size: 9.5px; font-weight: 600;
          letter-spacing: 0.18em; text-transform: uppercase; color: var(--d-muted);
          margin-left: auto; white-space: nowrap;
        }
        .pv-d-prin-name {
          font-family: var(--font-playfair), serif; font-weight: 500;
          font-size: clamp(1.15rem, 2vw, 1.45rem); line-height: 1.2;
          margin: var(--d-step-2) 0 0;
        }
        .pv-d-prin-name i { font-style: italic; color: var(--d-accent-dark); }
        .pv-d-prin-body {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
          font-size: 0.92rem; line-height: 1.8; color: var(--d-muted);
          margin: var(--d-step-2) 0 0; max-width: 68ch;
        }
        .pv-d-prin-ref {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300; font-style: italic;
          font-size: 0.77rem; line-height: 1.6; color: rgba(26,26,26,0.45);
          margin: var(--d-step-2) 0 0; max-width: 70ch;
        }
        .pv-d-prin-stat {
          display: flex; gap: clamp(14px, 2vw, 26px); align-items: center;
          margin: var(--d-step-3) 0 0; padding-left: clamp(14px, 2vw, 22px);
          border-left: 1px solid rgba(168,137,94,0.45);
        }
        .pv-d-prin-stat-v {
          font-family: var(--font-playfair), serif; font-size: 1.35rem; font-weight: 500;
          color: var(--d-accent-dark); margin: 0; flex-shrink: 0; line-height: 1.1;
        }
        .pv-d-prin-stat-l {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
          font-size: 0.8rem; line-height: 1.6; color: var(--d-muted); margin: 0;
        }
        .pv-d-prin-practical {
          display: flex; gap: 11px; align-items: flex-start; margin: var(--d-step-3) 0 0;
        }
        .pv-d-prin-practical span { color: var(--d-accent-dark); font-size: 0.82rem; flex-shrink: 0; line-height: 1.8; }
        .pv-d-prin-practical p {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
          font-size: 0.88rem; line-height: 1.7; color: rgba(26,26,26,0.72); margin: 0;
        }
        .pv-d-prin-hook {
          background: var(--d-black); padding: var(--d-step-3) clamp(18px, 2.4vw, 28px);
          margin: var(--d-step-3) 0 0; display: flex; gap: 13px; align-items: flex-start;
        }
        .pv-d-prin-hook span { color: var(--d-accent); font-size: 0.82rem; flex-shrink: 0; line-height: 1.8; }
        .pv-d-prin-hook p {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
          font-size: 0.88rem; line-height: 1.72; color: rgba(245,242,238,0.68); margin: 0;
        }
        .pv-d-prin-hook strong { color: #fff; font-weight: 500; }
        /* The equation block: the one dark panel in the middle of the guide. */
        .pv-d-eq { background: var(--d-black); padding: clamp(24px, 4vw, 40px); }
        .pv-d-eq-label {
          font-family: var(--font-dm-sans), sans-serif; font-size: 9px; font-weight: 500;
          letter-spacing: 0.3em; text-transform: uppercase; color: rgba(245,242,238,0.3);
          margin: 0 0 var(--d-step-3);
        }
        .pv-d-eq-row {
          display: flex; align-items: center; gap: 16px; padding: 14px 0;
          border-bottom: 1px solid rgba(245,242,238,0.09);
        }
        .pv-d-eq-row:last-child { border-bottom: 0; }
        .pv-d-eq-num {
          font-family: var(--font-playfair), serif; font-weight: 500; font-size: 1.6rem;
          color: var(--d-accent-dark); width: 44px; flex-shrink: 0; line-height: 1;
        }
        .pv-d-eq-l { font-family: var(--font-playfair), serif; font-size: 1.05rem; color: #fff; margin: 0; font-weight: 500; }
        .pv-d-eq-s {
          font-family: var(--font-dm-sans), sans-serif; font-size: 0.64rem; color: var(--d-muted);
          margin: 2px 0 0; text-transform: uppercase; letter-spacing: 0.12em;
        }
        .pv-d-eq-plus { margin-left: auto; color: var(--d-accent); font-size: 1.1rem; flex-shrink: 0; }
        .pv-d-eq-res {
          margin-left: auto; color: var(--d-accent-dark); font-size: 0.64rem;
          font-family: var(--font-dm-sans), sans-serif; text-transform: uppercase;
          letter-spacing: 0.14em; font-weight: 600; flex-shrink: 0;
        }
        .pv-d-ng-bullets { margin: 0; }
        .pv-d-ng-bullet { display: flex; gap: 11px; align-items: flex-start; padding: 5px 0; }
        .pv-d-ng-bullet span { color: var(--d-accent); font-size: 0.82rem; flex-shrink: 0; line-height: 1.75; }
        .pv-d-ng-bullet p {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
          font-size: 0.87rem; line-height: 1.6; color: rgba(245,242,238,0.68); margin: 0;
        }
        .pv-d-ng-urgency {
          padding-left: clamp(16px, 2.4vw, 24px); border-left: 1px solid rgba(168,137,94,0.5);
          margin: var(--d-step-4) 0;
        }
        .pv-d-ng-urgency p {
          font-family: var(--font-dm-sans), sans-serif; font-weight: 300;
          font-size: 0.86rem; line-height: 1.7; color: var(--d-muted); margin: 0;
        }
        .pv-d-offer--top { border-top: 2px solid var(--d-accent); }
      `}</style>

      {!unlocked ? (
        <>
          <p className="pv-d-eyebrow">{N_GATE.eyebrow}</p>
          <div className="pv-d-open-rule">
            <DrawRule color="rgba(168,137,94,0.5)" />
          </div>
          <h1 className="pv-d-display pv-d-ng-h1">
            {N_GATE.headingLine1} <i>{N_GATE.headingLine2}</i>
          </h1>
          <p className="pv-d-guide-lede">{N_GATE.lede}</p>

          <div style={{ marginTop: "var(--d-step-4)" }}>
            {N_GATE.promises.map(([bold, rest]) => (
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

          <div className="pv-d-guide-gate" data-tone="dark">
            <p className="pv-d-eyebrow">{N_GATE.formEyebrow}</p>
            <h2 className="pv-d-guide-gate-h">{N_GATE.formHeading}</h2>
            <p className="pv-d-guide-gate-b">{N_GATE.formBody}</p>
            <FreeGuideSignupForm
              source="free-guide-nutrition"
              apiEndpoint="/api/free-guide-nutrition"
              onSuccess={handleSuccess}
              formOnly
            />
          </div>

          <p className="pv-d-guide-sig">{N_GATE.signature}</p>
        </>
      ) : (
        <>
          <div className="pv-d-guide-confirm">
            <span aria-hidden="true">✓</span>
            <p>{N_UNLOCKED.confirmation}</p>
          </div>

          <p className="pv-d-eyebrow">{N_UNLOCKED.eyebrow}</p>
          <div className="pv-d-open-rule">
            <DrawRule color="rgba(168,137,94,0.5)" />
          </div>
          <h1 className="pv-d-display pv-d-ng-h1">
            {N_GATE.headingLine1} <i>{N_GATE.headingLine2}</i>
          </h1>
          <p className="pv-d-guide-lede">{N_UNLOCKED.lede}</p>

          <div className="pv-d-guide-rule">
            <DrawRule color="rgba(26,26,26,0.14)" />
          </div>

          <Reveal variant="up">
            <div className="pv-d-guide-story">
              {N_UNLOCKED.story.map((p) => (
                <p key={p.slice(0, 32)}>{p}</p>
              ))}
              <p className="pv-d-guide-story-sig">{N_UNLOCKED.storyAttribution}</p>
            </div>
          </Reveal>

          <div className="pv-d-guide-rule">
            <DrawRule color="rgba(26,26,26,0.14)" />
          </div>

          <p className="pv-d-eyebrow">{N_UNLOCKED.principlesEyebrow}</p>
          <h2 className="pv-d-guide-h2">
            {N_UNLOCKED.principlesHeadingLine1} <i>{N_UNLOCKED.principlesHeadingLine2}</i>
          </h2>
          <p className="pv-d-guide-body">{N_UNLOCKED.principlesBody}</p>

          {PRINCIPLES.map((p) => (
            <Reveal key={p.num} variant="up" className="pv-d-prin">
              <div className="pv-d-prin-head">
                <span className="pv-d-prin-num">{p.num}</span>
                <span className="pv-d-prin-cat">{p.category}</span>
              </div>
              <h3 className="pv-d-prin-name">
                {p.name} <i>- {p.tagline}</i>
              </h3>
              <p className="pv-d-prin-body">{p.body}</p>
              {"body2" in p && p.body2 && <p className="pv-d-prin-body">{p.body2}</p>}
              <p className="pv-d-prin-ref">{p.ref}</p>
              {"stat" in p && p.stat && "statLabel" in p && p.statLabel && (
                <div className="pv-d-prin-stat">
                  <p className="pv-d-prin-stat-v">{p.stat}</p>
                  <p className="pv-d-prin-stat-l">{p.statLabel}</p>
                </div>
              )}
              {p.practical && (
                <div className="pv-d-prin-practical">
                  <span aria-hidden="true">-&gt;</span>
                  <p>{p.practical}</p>
                </div>
              )}
              {"courseHook" in p && p.courseHook && (
                <div className="pv-d-prin-hook" data-tone="dark">
                  <span aria-hidden="true">-&gt;</span>
                  <p>
                    {N_UNLOCKED.courseHookLead}
                    <strong>{N_UNLOCKED.courseHookStrong}</strong>
                    {N_UNLOCKED.courseHookTail}
                  </p>
                </div>
              )}
            </Reveal>
          ))}

          <div className="pv-d-guide-rule">
            <DrawRule color="rgba(26,26,26,0.14)" />
          </div>

          <p className="pv-d-eyebrow">{N_UNLOCKED.equationEyebrow}</p>
          <h2 className="pv-d-guide-h2">{N_UNLOCKED.equationHeading}</h2>
          <p className="pv-d-guide-body">{N_UNLOCKED.equationBody}</p>

          <div data-tone="dark">
            <Reveal variant="up" className="pv-d-eq">
              <p className="pv-d-eq-label">{N_UNLOCKED.equationLabel}</p>
              {N_UNLOCKED.equation.map((item, i) => (
                <div key={item.num} className="pv-d-eq-row">
                  <span className="pv-d-eq-num">{item.num}</span>
                  <div>
                    <p className="pv-d-eq-l">{item.label}</p>
                    <p className="pv-d-eq-s">{item.sub}</p>
                  </div>
                  {i < N_UNLOCKED.equation.length - 1 ? (
                    <span className="pv-d-eq-plus" aria-hidden="true">
                      +
                    </span>
                  ) : (
                    <span className="pv-d-eq-res">{N_UNLOCKED.equationResult}</span>
                  )}
                </div>
              ))}
            </Reveal>
          </div>

          <div className="pv-d-guide-rule">
            <DrawRule color="rgba(26,26,26,0.14)" />
          </div>

          <p className="pv-d-eyebrow">{N_UNLOCKED.nextEyebrow}</p>
          <h2 className="pv-d-guide-h2">
            {N_UNLOCKED.nextHeadingLine1} <i>{N_UNLOCKED.nextHeadingLine2}</i>
          </h2>
          <p className="pv-d-guide-body">{N_UNLOCKED.nextBody}</p>

          <div className="pv-d-offer pv-d-offer--top" data-tone="dark">
            <span className="pv-d-offer-badge" style={{ display: "inline-block", marginBottom: "var(--d-step-2)" }}>
              {N_UNLOCKED.bestValue}
            </span>
            <p className="pv-d-eyebrow" style={{ color: "var(--d-accent)" }}>
              {N_UNLOCKED.bundleLabel}
            </p>
            <div className="pv-d-offer-price" style={{ margin: "var(--d-step-2) 0" }}>
              <span className="pv-d-offer-was">{BUNDLE_INDIVIDUAL_TOTAL_DISPLAY}</span>
              <span className="pv-d-offer-now">{BUNDLE_PRICE_DISPLAY}</span>
              <span className="pv-d-offer-badge">Save {BUNDLE_SAVINGS_DISPLAY}</span>
            </div>
            <h3 className="pv-d-offer-h" style={{ marginTop: 0 }}>
              {N_UNLOCKED.bundleHeading}
            </h3>
            <div className="pv-d-ng-bullets">
              {N_UNLOCKED.bundleBullets.map((b) => (
                <div key={b} className="pv-d-ng-bullet">
                  <span aria-hidden="true">→</span>
                  <p>{b}</p>
                </div>
              ))}
            </div>
            <div style={{ marginTop: "var(--d-step-3)" }}>
              <Link href={N_UNLOCKED.bundleHref} className="pv-d-btn pv-d-btn--gold">
                <span>{N_UNLOCKED.bundleCta}</span>
              </Link>
            </div>
            <p className="pv-d-offer-note">{N_UNLOCKED.payNote}</p>
          </div>

          <div className="pv-d-offer" data-tone="dark">
            <p className="pv-d-eyebrow" style={{ color: "var(--d-accent)" }}>
              {N_UNLOCKED.nutritionLabel}
            </p>
            <div className="pv-d-offer-price" style={{ margin: "var(--d-step-2) 0" }}>
              <span className="pv-d-offer-was">{NUTRITION_COURSE_REGULAR_PRICE_DISPLAY}</span>
              <span className="pv-d-offer-now">{NUTRITION_COURSE_PRICE_DISPLAY}</span>
              <span className="pv-d-offer-badge">{N_UNLOCKED.limited}</span>
            </div>
            <h3 className="pv-d-offer-h" style={{ marginTop: 0 }}>
              {N_UNLOCKED.nutritionHeading}
            </h3>
            <p className="pv-d-offer-b" style={{ marginBottom: "var(--d-step-3)" }}>
              {N_UNLOCKED.nutritionBody}
            </p>
            <div className="pv-d-ng-bullets">
              {N_UNLOCKED.nutritionBullets.map((b) => (
                <div key={b} className="pv-d-ng-bullet">
                  <span aria-hidden="true">→</span>
                  <p>{b}</p>
                </div>
              ))}
            </div>
            <div style={{ marginTop: "var(--d-step-3)" }}>
              <Link href={N_UNLOCKED.nutritionHref} className="pv-d-btn pv-d-btn--gold">
                <span>{N_UNLOCKED.nutritionCta}</span>
              </Link>
            </div>
            <p className="pv-d-offer-note">{N_UNLOCKED.payNote}</p>
          </div>

          <div className="pv-d-alt">
            <p className="pv-d-eyebrow">{N_UNLOCKED.trainingLabel}</p>
            <div className="pv-d-alt-price" style={{ marginTop: "var(--d-step-2)" }}>
              <span className="pv-d-alt-now">{COURSE_PRICE_DISPLAY}</span>
              <span className="pv-d-alt-was">{COURSE_REGULAR_PRICE_DISPLAY}</span>
              <span className="pv-d-offer-badge">{N_UNLOCKED.limited}</span>
            </div>
            <h3 className="pv-d-guide-h2" style={{ fontSize: "clamp(1.1rem, 1.8vw, 1.3rem)", margin: "0 0 var(--d-step-2)" }}>
              {N_UNLOCKED.trainingHeading}
            </h3>
            <p className="pv-d-alt-b">{N_UNLOCKED.trainingBody}</p>
            <Link href={N_UNLOCKED.trainingHref} className="pv-d-btn pv-d-btn--outline">
              <span>{N_UNLOCKED.trainingCta}</span>
            </Link>
          </div>

          <div className="pv-d-ng-urgency">
            <p>{N_UNLOCKED.urgency}</p>
          </div>

          <Reveal variant="up">
            <div className="pv-d-guide-story">
              <p>{N_UNLOCKED.close}</p>
              <p className="pv-d-guide-story-sig">{N_UNLOCKED.closeAttribution}</p>
            </div>
          </Reveal>

          <p className="pv-d-guide-sig">{N_UNLOCKED.signature}</p>
        </>
      )}
    </div>
  )
}
