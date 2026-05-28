"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  COURSE_PRICE_DISPLAY, COURSE_REGULAR_PRICE_DISPLAY,
  NUTRITION_COURSE_PRICE_DISPLAY, NUTRITION_COURSE_REGULAR_PRICE_DISPLAY,
  BUNDLE_PRICE_DISPLAY, BUNDLE_INDIVIDUAL_TOTAL_DISPLAY, BUNDLE_SAVINGS_DISPLAY,
} from "@/lib/pricing"
import { FreeGuideSignupForm } from "@/components/FreeGuideSignupForm"

const paper = "#faf8f5"
const panel = "#f0ebe2"
const ink = "#1a1a1a"
const muted = "#6b6560"
const gold = "#c8a97e"
const goldDeep = "#a8895e"
const line = "#ddd8cf"
const black = "#0a0a0a"
const dmSans = "var(--font-dm-sans), sans-serif"
const playfair = "var(--font-playfair), serif"

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconFlame() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2C10 7 8 10 8 14a4 4 0 0 0 8 0c0-4-2-7-4-12z"
        stroke={gold} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 22c-1.1 0-2-.9-2-2 0-.9.5-1.8 2-2.5 1.5.7 2 1.6 2 2.5 0 1.1-.9 2-2 2z"
        stroke={gold} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconMolecule() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="6" cy="15" r="3" stroke={gold} strokeWidth="1.5" />
      <circle cx="12" cy="7" r="3" stroke={gold} strokeWidth="1.5" />
      <circle cx="18" cy="15" r="3" stroke={gold} strokeWidth="1.5" />
      <line x1="8.6" y1="13.3" x2="9.5" y2="10" stroke={gold} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="14.5" y1="10" x2="15.4" y2="13.3" stroke={gold} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function IconBarbell() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <line x1="9" y1="12" x2="15" y2="12" stroke={gold} strokeWidth="1.5" strokeLinecap="round" />
      <rect x="2.5" y="8.5" width="3" height="7" rx="1" stroke={gold} strokeWidth="1.5" />
      <rect x="18.5" y="8.5" width="3" height="7" rx="1" stroke={gold} strokeWidth="1.5" />
      <line x1="5.5" y1="12" x2="9" y2="12" stroke={gold} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="15" y1="12" x2="18.5" y2="12" stroke={gold} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function IconSteps() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 21h5v-5h5v-5h5v-5h3"
        stroke={gold} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconMoon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
        stroke={gold} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Data ─────────────────────────────────────────────────────────────────────

export const PRINCIPLES = [
  {
    num: 1,
    category: "Energy Balance",
    name: "Calorie Deficit",
    tagline: "The only mechanism for fat loss",
    body: "Fat loss has one mechanism: consuming less energy than you burn. No specific food, supplement, or workout bypasses this principle. Every effective fat loss approach works because it creates a calorie deficit — and your body accesses stored fat from everywhere at once. You cannot spot-reduce.",
    ref: "Hall et al. 2012 (Am J Clin Nutr): fat loss was equivalent across all diet types when total calories were matched.",
    stat: "300–500 kcal/day",
    statLabel: "The deficit sweet spot — enough to lose fat consistently, not enough to lose muscle.",
    practical: "A 300-500 kcal/day deficit is the sweet spot. Enough to lose fat, moderate enough to hold onto muscle.",
  },
  {
    num: 2,
    category: "Macronutrient Strategy",
    name: "Protein",
    tagline: "The lever that controls body composition",
    body: "In a deficit, your body pulls from fat and muscle. Protein is what tells it to protect the muscle. It also requires significantly more energy to digest than carbs or fat, meaning your body burns more calories just processing it. Getting enough protein is one of the few levers that works in multiple directions at once.",
    ref: "Morton et al. 2018 (Br J Sports Med): meta-analysis of 49 studies found 1.6-2.2 g/kg (0.7-1 g/lb) optimizes muscle retention and growth.",
    stat: "0.7–1g per lb",
    statLabel: "The daily protein target that protects muscle and supports fat loss at the same time.",
    practical: "Target 0.7-1 g per lb of bodyweight (1.6-2.2 g/kg). A 140 lb (65 kg) person needs 98-140 g/day.",
    courseHook: false,
  },
  {
    num: 3,
    category: "Muscle and Metabolism",
    name: "Build Muscle",
    tagline: "The closest thing to a real shortcut",
    body: "Muscle tissue is more metabolically active than fat tissue — building it gradually increases resting energy expenditure over time. But the bigger picture goes beyond the calorie equation: more muscle means better body composition, improved insulin sensitivity, greater functional strength, and results that hold long-term. This is the long game most people skip because they're chasing short-term weight loss instead.",
    ref: "Srikanthan and Karlamangla (Am J Med, 2014): higher muscle mass was inversely linked to all-cause mortality over 10-16 years. Muscle is the organ of longevity.",
    stat: "~6 vs ~2 kcal/lb",
    statLabel: "Research estimate — the compounding benefit is body composition, strength, insulin sensitivity, and results built to last.",
    practical: "",
    courseHook: true,
  },
  {
    num: 4,
    category: "Daily Energy Output",
    name: "Daily Movement",
    tagline: "The hidden calorie variable nobody talks about",
    body: "NEAT (Non-Exercise Activity Thermogenesis) is everything you burn outside the gym: walking, standing, taking stairs. It varies by up to 2,000 kcal/day between people of similar size and similar workout habits. One full gym session can be cancelled out by sitting the rest of the day. Your steps matter more than most people realize.",
    ref: "Levine et al. 2005 (Science, Mayo Clinic): NEAT accounts for 15-50% of total daily energy expenditure and varies by up to 2,000 kcal/day between individuals.",
    stat: "2,000 kcal/day",
    statLabel: "How much NEAT output can differ between people of similar size and similar workout habits.",
    practical: "8,000-10,000 steps/day is a solid daily target. Walk after meals. Take the stairs. It adds up fast.",
  },
  {
    num: 5,
    category: "Hormonal Health",
    name: "Sleep",
    tagline: "The hormone controller you are probably ignoring",
    body: "Sleeping 4 hours raises ghrelin (the hunger hormone) by 28% and drops leptin (the fullness hormone) by 18%. That's a 24% spike in next-day hunger you can't willpower your way through. Poor sleep doesn't just make you tired. It changes your hormones and stacks the deck against every good choice you try to make the next day.",
    ref: "Spiegel et al. 2004 (Ann Intern Med, University of Chicago): sleep restriction significantly increases hunger and appetite for calorie-dense food.",
    stat: "+28% ghrelin",
    statLabel: "What one night at 4 hours does to your hunger hormone. You cannot willpower through that.",
    practical: "7-9 hours. Not a wellness trend. A hormonal requirement.",
  },
]

// ─── Sub-components ────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: "0.68rem", fontWeight: 500, letterSpacing: "0.3em", textTransform: "uppercase", color: goldDeep, marginBottom: "0.75rem", fontFamily: dmSans }}>
      {children}
    </p>
  )
}

function Rule() {
  return <div style={{ height: 1, background: line, margin: "2.5rem 0" }} />
}

function PrincipleCard({ num, category, name, tagline, body, ref: reference, stat, statLabel, practical, courseHook, icon }: {
  num: number
  category: string
  name: string
  tagline: string
  body: string
  ref: string
  stat?: string
  statLabel?: string
  practical: string
  courseHook?: boolean
  icon: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.3rem", flexWrap: "wrap" }}>
        <span style={{
          fontFamily: playfair, fontWeight: 700, fontSize: "0.88rem", color: goldDeep,
          border: `1.5px solid ${gold}`, width: 34, height: 34, borderRadius: "50%",
          display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          {num}
        </span>
        <span style={{ flexShrink: 0 }}>{icon}</span>
        <span style={{ fontSize: "0.67rem", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.18em", color: muted, marginLeft: "auto", fontFamily: dmSans, whiteSpace: "nowrap" }}>
          {category}
        </span>
      </div>
      <h3 style={{ fontFamily: playfair, fontSize: "clamp(1.15rem, 3vw, 1.4rem)", fontWeight: 700, color: ink, letterSpacing: "-0.01em", margin: "0.15rem 0 0", lineHeight: 1.15 }}>
        {name} <em style={{ fontStyle: "italic", color: goldDeep, fontWeight: 600 }}>- {tagline}</em>
      </h3>
      <p style={{ fontSize: "0.9rem", margin: "0.65rem 0 0", lineHeight: 1.72, color: muted, fontFamily: dmSans }}>
        {body}
      </p>
      <p style={{ fontSize: "0.76rem", color: muted, fontStyle: "italic", margin: "0.6rem 0 0", lineHeight: 1.55, fontFamily: dmSans }}>
        {reference}
      </p>
      {stat && statLabel && (
        <div style={{ background: panel, borderLeft: `2px solid ${gold}`, padding: "0.75rem 1.1rem", marginTop: "0.75rem", display: "flex", gap: "1.25rem", alignItems: "center" }}>
          <p style={{ fontFamily: playfair, fontSize: "1.35rem", fontWeight: 700, color: goldDeep, margin: 0, flexShrink: 0, lineHeight: 1.1 }}>{stat}</p>
          <p style={{ fontFamily: dmSans, fontSize: "0.8rem", color: muted, margin: 0, lineHeight: 1.55 }}>{statLabel}</p>
        </div>
      )}
      {practical && (
        <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.6rem", alignItems: "flex-start" }}>
          <span style={{ color: goldDeep, fontSize: "0.85rem", flexShrink: 0 }}>-&gt;</span>
          <p style={{ fontSize: "0.87rem", color: ink, margin: 0, lineHeight: 1.6, fontFamily: dmSans }}>
            {practical}
          </p>
        </div>
      )}
      {courseHook && (
        <div style={{ marginTop: "0.875rem", background: black, padding: "0.875rem 1.25rem", display: "flex", alignItems: "flex-start", gap: "0.875rem" }}>
          <span style={{ color: gold, fontSize: "0.85rem", flexShrink: 0, paddingTop: "0.05rem" }}>-&gt;</span>
          <p style={{ fontSize: "0.87rem", color: "#c9bfb0", margin: 0, lineHeight: 1.62, fontFamily: dmSans }}>
            This is what the 4-week program is built around. <strong style={{ color: "#fff" }}>Structured resistance training that builds muscle progressively</strong>, session by session, week by week, with the nutrition module to back it up.
          </p>
        </div>
      )}
    </div>
  )
}

const ICONS = [<IconFlame key={1} />, <IconMolecule key={2} />, <IconBarbell key={3} />, <IconSteps key={4} />, <IconMoon key={5} />]

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function NutritionGuideClient() {
  const searchParams = useSearchParams()
  const [unlocked, setUnlocked] = useState(() => searchParams.get("unlocked") === "1")

  function handleSuccess() {
    setUnlocked(true)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <main style={{ background: paper, minHeight: "100vh" }}>
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "clamp(36px, 6vw, 64px) clamp(20px, 5vw, 40px) 80px" }}>

        {!unlocked ? (
          /* ── Pre-email gate ── */
          <>
            <Label>Free Guide - Nutrition</Label>
            <h1 style={{ fontFamily: playfair, fontSize: "clamp(2rem, 5.5vw, 3.1rem)", lineHeight: 1.05, letterSpacing: "-0.02em", color: black, fontWeight: 700, marginBottom: "1.2rem", marginTop: 0 }}>
              Stop chasing fat burners, detoxes, and &quot;secret&quot; tricks.{" "}
              <em style={{ fontStyle: "italic", fontWeight: 600, color: goldDeep }}>Here&apos;s what actually drives fat loss, muscle growth, and long-term body composition.</em>
            </h1>
            <p style={{ fontSize: "clamp(0.9rem, 2.5vw, 1.05rem)", color: muted, maxWidth: 580, marginBottom: "2rem", lineHeight: 1.72, fontFamily: dmSans }}>
              Five science-backed principles behind every real body transformation. Written by an engineer who needed the mechanism, not the marketing.
            </p>

            <div style={{ marginBottom: "2rem" }}>
              {[
                ["The only mechanism for fat loss", " and why belly fat hacks miss the point entirely"],
                ["The protein number that controls body composition", " not just the number on the scale"],
                ["Why building muscle is the closest thing to a real metabolism shortcut", ""],
                ["The hidden calorie variable that can cancel a full gym session", ""],
                ["The hormone lever that decides how hungry you are tomorrow", ""],
              ].map(([bold, rest], i) => (
                <div key={i} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", padding: "0.55rem 0", borderBottom: i < 4 ? `1px solid ${line}` : "none" }}>
                  <span style={{ color: gold, fontSize: "0.85rem", flexShrink: 0, paddingTop: "0.12rem" }}>&#8594;</span>
                  <p style={{ fontFamily: dmSans, fontSize: "0.93rem", color: ink, margin: 0, lineHeight: 1.55 }}>
                    <strong>{bold}</strong>{rest}
                  </p>
                </div>
              ))}
            </div>

            <div style={{ background: black, padding: "clamp(1.75rem, 5vw, 2.5rem) clamp(1.5rem, 5vw, 2.75rem)" }}>
              <p style={{ fontSize: "0.68rem", fontWeight: 500, letterSpacing: "0.3em", textTransform: "uppercase", color: goldDeep, marginBottom: "0.75rem", fontFamily: dmSans }}>
                Free - No credit card
              </p>
              <h2 style={{ fontFamily: playfair, fontSize: "clamp(1.4rem, 3.5vw, 1.75rem)", color: "#fff", fontWeight: 700, marginBottom: "0.75rem", marginTop: 0, lineHeight: 1.15 }}>
                Enter your email to get the guide
              </h2>
              <p style={{ fontSize: "0.88rem", color: "#b3ab9c", marginBottom: "1.5rem", maxWidth: 480, lineHeight: 1.65, fontFamily: dmSans }}>
                You get the full guide instantly, plus a copy in your inbox with a PDF to keep.
              </p>
              <FreeGuideSignupForm
                source="free-guide-nutrition"
                apiEndpoint="/api/free-guide-nutrition"
                onSuccess={handleSuccess}
                formOnly
              />
            </div>

            <p style={{ fontSize: "0.65rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "#9c9590", marginTop: "3rem", textAlign: "center", fontFamily: dmSans }}>
              Lisa McPherson, CPT - lisafitmethod.com
            </p>
          </>
        ) : (
          /* ── Unlocked guide ── */
          <>
            <div style={{ background: panel, borderLeft: `2px solid ${gold}`, padding: "1rem 1.5rem", marginBottom: "2.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ color: gold, fontSize: "1rem", flexShrink: 0 }}>&#10003;</span>
              <p style={{ fontFamily: dmSans, fontSize: "0.85rem", color: muted, margin: 0 }}>
                You are in. Check your inbox for the guide and PDF to keep.
              </p>
            </div>

            <Label>Free Guide - Nutrition</Label>
            <h1 style={{ fontFamily: playfair, fontSize: "clamp(2rem, 5.5vw, 3.1rem)", lineHeight: 1.05, letterSpacing: "-0.02em", color: black, fontWeight: 700, marginBottom: "1.2rem", marginTop: 0 }}>
              Stop chasing fat burners, detoxes, and &quot;secret&quot; tricks.{" "}
              <em style={{ fontStyle: "italic", fontWeight: 600, color: goldDeep }}>Here&apos;s what actually drives fat loss, muscle growth, and long-term body composition.</em>
            </h1>
            <p style={{ fontSize: "clamp(0.9rem, 2.5vw, 1.05rem)", color: muted, maxWidth: 600, marginBottom: 0, lineHeight: 1.72, fontFamily: dmSans }}>
              Five principles. Real references. No supplements to buy, no protocol to follow.{" "}
              <strong style={{ color: ink }}>This is the actual science behind every approach that works, whether the plan knows it or not.</strong>
            </p>

            <Rule />

            <div style={{ background: panel, padding: "clamp(1.5rem, 4vw, 2rem) clamp(1.25rem, 4vw, 2.25rem)", marginBottom: "0.5rem", borderLeft: `2px solid ${gold}` }}>
              <p style={{ fontSize: "0.93rem", lineHeight: 1.75, marginBottom: "0.75rem", color: muted, fontFamily: dmSans }}>
                I spent years following plans that promised results and didn&apos;t deliver. Fat burners. Endless cardio. Detox cleanses. Tracking calories without ever understanding why nothing was working. Eventually I stopped looking for shortcuts and went back to the actual research.
              </p>
              <p style={{ fontSize: "0.93rem", lineHeight: 1.75, marginBottom: "0.5rem", color: muted, fontFamily: dmSans }}>
                I&apos;m an engineer. I needed the mechanism, not the marketing. What I found was simpler than the fitness industry makes it seem, and more effective than most of the shortcuts being sold online.
              </p>
              <p style={{ fontFamily: playfair, fontStyle: "italic", fontSize: "1.05rem", color: goldDeep, margin: 0 }}>
                Lisa McPherson, CPT
              </p>
            </div>

            <Rule />

            <Label>The 5 Principles</Label>
            <h2 style={{ fontFamily: playfair, fontSize: "clamp(1.5rem, 4vw, 1.9rem)", color: black, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "0.6rem", marginTop: 0, lineHeight: 1.1 }}>
              The full equation.{" "}
              <em style={{ fontStyle: "italic", fontWeight: 600, color: goldDeep }}>Nothing left out.</em>
            </h2>
            <p style={{ fontSize: "0.92rem", maxWidth: 600, marginBottom: "2rem", color: muted, lineHeight: 1.7, fontFamily: dmSans }}>
              Every diet that works, works because it satisfies some or all of these. Understanding them means you stop following plans blindly and start understanding why things work.
            </p>

            {PRINCIPLES.map((p, i) => (
              <PrincipleCard key={p.num} {...p} icon={ICONS[i]} />
            ))}

            <Rule />

            {/* Equation */}
            <Label>Putting it together</Label>
            <h2 style={{ fontFamily: playfair, fontSize: "clamp(1.5rem, 4vw, 1.9rem)", color: black, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "0.6rem", marginTop: 0, lineHeight: 1.1 }}>
              Every approach that works uses all five.
            </h2>
            <p style={{ fontSize: "0.92rem", color: muted, lineHeight: 1.7, fontFamily: dmSans, marginBottom: "1.5rem", maxWidth: 600 }}>
              Every sustainable body transformation runs on these five variables. You don&apos;t need all five to be perfect. But you do need all five in the frame.
            </p>

            <div style={{ background: black, padding: "clamp(1.5rem, 4vw, 2rem) clamp(1.25rem, 4vw, 2rem)", marginBottom: "0.5rem" }}>
              <p style={{ fontFamily: dmSans, fontSize: "0.6rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "#4a4540", margin: "0 0 1.25rem", fontWeight: 500 }}>
                Five Variables. One System.
              </p>
              {[
                { num: "01", label: "Calorie Deficit", sub: "The mechanism" },
                { num: "02", label: "Adequate Protein", sub: "The lever" },
                { num: "03", label: "Resistance Training", sub: "The multiplier" },
                { num: "04", label: "Daily Movement", sub: "The constant" },
                { num: "05", label: "Quality Sleep", sub: "The regulator" },
              ].map((item, i) => (
                <div key={i}>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.875rem 0" }}>
                    <span style={{ fontFamily: playfair, fontWeight: 700, fontSize: "1.6rem", color: goldDeep, width: 44, flexShrink: 0, lineHeight: 1, opacity: 0.85 }}>{item.num}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontFamily: playfair, fontSize: "1.05rem", color: "#fff", margin: 0, fontWeight: 600 }}>{item.label}</p>
                      <p style={{ fontFamily: dmSans, fontSize: "0.65rem", color: muted, margin: 0, textTransform: "uppercase", letterSpacing: "0.12em" }}>{item.sub}</p>
                    </div>
                    {i < 4 ? (
                      <span style={{ marginLeft: "auto", color: gold, fontSize: "1.1rem", flexShrink: 0, fontFamily: dmSans }}>+</span>
                    ) : (
                      <span style={{ marginLeft: "auto", color: goldDeep, fontFamily: dmSans, fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.14em", fontWeight: 600 }}>= Results</span>
                    )}
                  </div>
                  {i < 4 && <div style={{ height: 1, background: "#1e1b18" }} />}
                </div>
              ))}
            </div>

            <Rule />

            <Label>Here&apos;s what you do next</Label>
            <h2 style={{ fontFamily: playfair, fontSize: "clamp(1.4rem, 3.5vw, 1.8rem)", color: black, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "0.8rem", marginTop: 0, lineHeight: 1.12 }}>
              You now know what works.{" "}
              <em style={{ fontStyle: "italic", fontWeight: 600, color: goldDeep }}>Here&apos;s how to do it.</em>
            </h2>
            <p style={{ fontSize: "0.93rem", marginBottom: "1.75rem", color: muted, lineHeight: 1.7, fontFamily: dmSans }}>
              Information is not the same thing as implementation. Knowing the principles is important. Applying them consistently is where most people struggle. That&apos;s why I built the courses — to turn the science into a step-by-step system you can actually follow without overthinking every workout, meal, or calorie target.
            </p>

            {/* Bundle — hero */}
            <div style={{ background: black, borderTop: `2px solid ${gold}`, padding: "clamp(1.75rem, 5vw, 2.5rem) clamp(1.5rem, 5vw, 2.75rem)", marginBottom: "0.75rem" }}>
              <span style={{ display: "inline-block", fontFamily: dmSans, fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: black, background: gold, padding: "3px 10px", marginBottom: "0.75rem" }}>
                Best Value
              </span>
              <p style={{ fontFamily: dmSans, fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: gold, marginBottom: "0.4rem", marginTop: 0 }}>
                Foundations Bundle
              </p>
              <div style={{ display: "flex", alignItems: "baseline", gap: "0.875rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
                <span style={{ color: "#5a544b", textDecoration: "line-through", fontFamily: playfair, fontSize: "1.4rem" }}>{BUNDLE_INDIVIDUAL_TOTAL_DISPLAY}</span>
                <span style={{ color: "#fff", fontFamily: playfair, fontSize: "clamp(2rem, 5vw, 2.9rem)", fontWeight: 700, lineHeight: 1 }}>{BUNDLE_PRICE_DISPLAY}</span>
                <span style={{ fontSize: "0.62rem", fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", color: black, background: gold, padding: "4px 10px", alignSelf: "center", fontFamily: dmSans }}>Save {BUNDLE_SAVINGS_DISPLAY}</span>
              </div>
              <h3 style={{ fontFamily: playfair, fontSize: "clamp(1.3rem, 3vw, 1.6rem)", fontWeight: 700, margin: "0 0 1rem", color: "#fff", letterSpacing: "-0.01em" }}>
                Both courses together. Everything in one place.
              </h3>
              {[
                "Everything in Nutrition Foundations + Training Foundations",
                "Personalized TDEE calculator, meal plan, recipes, and science-backed content",
                "4-week strength program with 50+ exercise videos and week-by-week workout tracking",
                "One-time payment. Lifetime access to both courses.",
              ].map((bullet, i) => (
                <div key={i} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                  <span style={{ color: gold, fontSize: "0.85rem", flexShrink: 0, paddingTop: "0.1rem" }}>&#8594;</span>
                  <p style={{ fontFamily: dmSans, fontSize: "0.88rem", color: "#b3ab9c", margin: 0, lineHeight: 1.6 }}>{bullet}</p>
                </div>
              ))}
              <Link href="/checkout?product=bundle" style={{ display: "block", background: gold, color: black, textAlign: "center", fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", padding: "1rem", textDecoration: "none", fontFamily: dmSans, maxWidth: 400, marginTop: "1.5rem" }}>
                Get Both Courses
              </Link>
              <p style={{ fontSize: "0.68rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5a544b", marginTop: "1rem", fontFamily: dmSans, marginBottom: 0 }}>
                One-time payment · Lifetime access · Yours forever
              </p>
            </div>

            {/* Nutrition Foundations */}
            <div style={{ background: black, padding: "clamp(1.75rem, 5vw, 2.5rem) clamp(1.5rem, 5vw, 2.75rem)", marginBottom: "0.75rem" }}>
              <p style={{ fontFamily: dmSans, fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: gold, marginBottom: "0.4rem", marginTop: 0 }}>
                Nutrition Foundations
              </p>
              <div style={{ display: "flex", alignItems: "baseline", gap: "0.875rem", marginBottom: "0.25rem", flexWrap: "wrap" }}>
                <span style={{ color: "#5a544b", textDecoration: "line-through", fontFamily: playfair, fontSize: "1.5rem" }}>{NUTRITION_COURSE_REGULAR_PRICE_DISPLAY}</span>
                <span style={{ color: "#fff", fontFamily: playfair, fontSize: "clamp(2rem, 5vw, 2.9rem)", fontWeight: 700, lineHeight: 1 }}>{NUTRITION_COURSE_PRICE_DISPLAY}</span>
                <span style={{ fontSize: "0.62rem", fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", color: black, background: gold, padding: "4px 10px", alignSelf: "center", fontFamily: dmSans }}>Founding Price</span>
              </div>
              <h3 style={{ fontFamily: playfair, fontSize: "clamp(1.3rem, 3vw, 1.6rem)", fontWeight: 700, margin: "0.75rem 0 0.75rem", color: "#fff", letterSpacing: "-0.01em" }}>
                Eat right for your body, not someone else&apos;s.
              </h3>
              <p style={{ fontSize: "0.88rem", color: "#b3ab9c", marginBottom: "1.25rem", lineHeight: 1.65, fontFamily: dmSans }}>
                Personalized TDEE calculator so you know your exact calorie target. A full meal plan built around your number, with real food and 9 verified recipes with source attribution. Science-backed content with research citations throughout.
              </p>
              {[
                "Personalized TDEE calculator — your exact calorie target, not a generic estimate",
                "A meal plan built around your number, with real food you will actually eat",
                "9 verified recipes with full macros and source attribution",
                "Science-backed education with research citations throughout",
              ].map((bullet, i) => (
                <div key={i} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", marginBottom: "0.4rem" }}>
                  <span style={{ color: gold, fontSize: "0.85rem", flexShrink: 0, paddingTop: "0.1rem" }}>&#8594;</span>
                  <p style={{ fontFamily: dmSans, fontSize: "0.85rem", color: "#b3ab9c", margin: 0, lineHeight: 1.6 }}>{bullet}</p>
                </div>
              ))}
              <Link href="/checkout?product=nutrition" style={{ display: "block", background: gold, color: black, textAlign: "center", fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", padding: "1rem", textDecoration: "none", fontFamily: dmSans, maxWidth: 400, marginTop: "1.5rem" }}>
                Get Nutrition Foundations
              </Link>
              <p style={{ fontSize: "0.68rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5a544b", marginTop: "1rem", fontFamily: dmSans, marginBottom: 0 }}>
                One-time payment · Lifetime access · Yours forever
              </p>
            </div>

            {/* Training Foundations */}
            <div style={{ border: `1px solid ${line}`, padding: "clamp(1.5rem, 4vw, 2rem)", marginBottom: "1.75rem" }}>
              <p style={{ fontFamily: dmSans, fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: goldDeep, marginBottom: "0.4rem", marginTop: 0 }}>
                Training Foundations
              </p>
              <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
                <span style={{ fontFamily: playfair, fontSize: "1.6rem", fontWeight: 700, color: ink, lineHeight: 1 }}>{COURSE_PRICE_DISPLAY}</span>
                <span style={{ fontFamily: dmSans, fontSize: "0.72rem", color: muted, textDecoration: "line-through" }}>{COURSE_REGULAR_PRICE_DISPLAY}</span>
                <span style={{ fontFamily: dmSans, fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: black, background: gold, padding: "3px 8px" }}>Founding Price</span>
              </div>
              <h3 style={{ fontFamily: playfair, fontSize: "clamp(1.1rem, 2.5vw, 1.3rem)", fontWeight: 700, margin: "0 0 0.75rem", color: ink, letterSpacing: "-0.01em" }}>
                The 4-week strength program that puts the nutrition to work.
              </h3>
              <p style={{ fontFamily: dmSans, fontSize: "0.88rem", color: muted, lineHeight: 1.65, marginBottom: "1.25rem" }}>
                Five foundational movements, 50+ exercise videos with coaching cues, built-in workout tracking, and progressive overload from week one. Three structured training days per week.
              </p>
              <Link href="/checkout" style={{ display: "inline-block", color: goldDeep, fontFamily: dmSans, fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none", border: `1px solid ${goldDeep}`, padding: "0.7rem 1.5rem" }}>
                Get Training Foundations
              </Link>
            </div>

            {/* Urgency note */}
            <div style={{ borderLeft: `2px solid ${gold}`, paddingLeft: "1.25rem", marginBottom: "1.75rem" }}>
              <p style={{ fontFamily: dmSans, fontSize: "0.85rem", color: muted, lineHeight: 1.7, margin: 0 }}>
                Founding member pricing ends when we hit 100 students. Regular pricing returns then. This is the cheapest these courses will ever be.
              </p>
            </div>

            {/* Lisa's personal close */}
            <div style={{ background: panel, padding: "clamp(1.5rem, 4vw, 2rem) clamp(1.25rem, 4vw, 2.25rem)", borderLeft: `2px solid ${gold}` }}>
              <p style={{ fontSize: "0.93rem", lineHeight: 1.75, marginBottom: "0.75rem", color: muted, fontFamily: dmSans }}>
                I built these because everything I tried before didn&apos;t work. Years of cardio without results. Tracking calories without understanding why. Following plans that didn&apos;t fit my life. I went back to the research and built what I wish I had.
              </p>
              <p style={{ fontFamily: playfair, fontStyle: "italic", fontSize: "1.05rem", color: goldDeep, margin: 0 }}>
                — Lisa
              </p>
            </div>

            <p style={{ fontSize: "0.65rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "#9c9590", marginTop: "3rem", textAlign: "center", fontFamily: dmSans }}>
              Lisa McPherson, CPT · lisafitmethod.com · @lisafitmethod
            </p>
          </>
        )}
      </div>
    </main>
  )
}
