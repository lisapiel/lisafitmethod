"use client"

import Link from "next/link"
import NutritionDisclaimer from "@/components/nutrition/NutritionDisclaimer"
import ScienceBox from "@/components/nutrition/ScienceBox"
import TDEECalculator from "@/components/nutrition/TDEECalculator"

const gold = "#c9a96e"
const goldDeep = "#a8895e"
const cream = "#f0e6d3"
const muted = "#b0a090"
const dark = "#161616"
const border = "#2a2a2a"

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.3em", textTransform: "uppercase", color: goldDeep, marginBottom: "0.75rem", fontFamily: "var(--font-montserrat), sans-serif" }}>
      {children}
    </p>
  )
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(1.4rem, 3.5vw, 2rem)", fontWeight: 300, color: cream, lineHeight: 1.2, marginBottom: "1rem", marginTop: 0 }}>
      {children}
    </h2>
  )
}

function Divider() {
  return <div style={{ height: 1, background: border, margin: "2.5rem 0" }} />
}

function InfoBox({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ background: dark, border: `1px solid ${border}`, padding: "1.25rem 1.5rem", marginTop: "1rem" }}>
      <p style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#555", marginBottom: "0.5rem", fontFamily: "var(--font-montserrat), sans-serif" }}>
        {label}
      </p>
      {children}
    </div>
  )
}

export default function Module1Client() {
  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: "3rem 2.5rem 6rem" }} className="mod-body">
      <style>{`
        @media (max-width: 768px) { .mod-body { padding: 2rem 1rem 6rem !important; } }
      `}</style>

      <NutritionDisclaimer />

      <Label>Module 1 · Energy Systems</Label>
      <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(1.8rem, 4.5vw, 2.6rem)", fontWeight: 300, color: cream, lineHeight: 1.15, marginBottom: "1.25rem", marginTop: 0 }}>
        Understanding Your Body<br />
        <em style={{ color: gold }}>Know your numbers. Change your results.</em>
      </h1>
      <p style={{ fontSize: "0.88rem", color: muted, lineHeight: 1.72, marginBottom: "2rem", fontFamily: "var(--font-montserrat), sans-serif" }}>
        Before you can eat to support your goals, you need to understand how your body uses energy. Most people skip this step and follow a generic plan that was never designed for their body. This module gives you the actual framework — and then calculates your numbers specifically.
      </p>

      <Divider />

      {/* BMR section */}
      <Label>What is BMR?</Label>
      <H2>Your Basal Metabolic Rate: the energy you burn at rest</H2>
      <p style={{ fontSize: "0.88rem", color: muted, lineHeight: 1.72, fontFamily: "var(--font-montserrat), sans-serif" }}>
        Your BMR is the number of calories your body burns just to keep you alive — breathing, pumping blood, regulating temperature, repairing cells — with zero movement. If you lay completely still for 24 hours, this is what you&apos;d burn.
      </p>
      <p style={{ fontSize: "0.88rem", color: muted, lineHeight: 1.72, marginTop: "0.75rem", fontFamily: "var(--font-montserrat), sans-serif" }}>
        BMR is determined primarily by your body size (height and weight), your age, and your biological sex. The calculator below uses the <strong style={{ color: cream }}>Mifflin-St Jeor equation</strong> — the most validated formula in current research, accurate to within ±10% for most people.
      </p>

      <ScienceBox
        study="Mifflin & St Jeor (1990)"
        finding="In a study of 498 participants, the Mifflin-St Jeor equation predicted resting metabolic rate more accurately than the Harris-Benedict equation across a wide range of body weights and compositions."
        cite="Mifflin MD et al. A new predictive equation for resting energy expenditure in healthy individuals. Am J Clin Nutr. 1990;51(2):241–247."
      />

      <Divider />

      {/* TDEE section */}
      <Label>What is TDEE?</Label>
      <H2>Total Daily Energy Expenditure: what you actually burn</H2>
      <p style={{ fontSize: "0.88rem", color: muted, lineHeight: 1.72, fontFamily: "var(--font-montserrat), sans-serif" }}>
        Your TDEE is your BMR multiplied by an activity factor. It represents how many calories you actually burn in a day accounting for movement, exercise, and daily activities — not just survival.
      </p>
      <p style={{ fontSize: "0.88rem", color: muted, lineHeight: 1.72, marginTop: "0.75rem", fontFamily: "var(--font-montserrat), sans-serif" }}>
        This is the number that matters for nutrition planning. Eat at your TDEE = maintain weight. Eat below it = fat loss. Eat above it = muscle gain (with training).
      </p>

      <InfoBox label="The activity multiplier problem">
        <p style={{ fontSize: "0.82rem", color: muted, lineHeight: 1.65, margin: 0, fontFamily: "var(--font-montserrat), sans-serif" }}>
          Research consistently shows that approximately 80% of people overestimate their activity level by at least one tier. A person with a desk job who trains 3x/week usually qualifies as <strong style={{ color: cream }}>Lightly Active (×1.375)</strong> — not Moderately Active. Overestimating by one tier adds ~250 kcal/day to your TDEE, which is enough to stall fat loss entirely. The calculator descriptions are written to help you self-assess accurately.
        </p>
      </InfoBox>

      <Divider />

      {/* Why different goals need different calories */}
      <Label>Goal-Based Adjustment</Label>
      <H2>How your goal changes the number</H2>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: "1.5rem" }}>
        {[
          { goal: "Fat Loss", adj: "−400 kcal below TDEE", why: "Creates a deficit that forces the body to use stored fat for fuel. A 400 kcal deficit loses roughly 0.5–1 lb/week — aggressive enough to make progress, moderate enough to preserve muscle." },
          { goal: "Maintenance / Body Recomp", adj: "At TDEE", why: "Supports performance and recovery without adding or removing body mass. At this level with adequate protein and training, some simultaneous fat loss and muscle gain is possible, especially for beginners." },
          { goal: "Muscle Gain", adj: "+300 kcal above TDEE", why: "Provides the caloric surplus needed for muscle protein synthesis. A conservative surplus minimises fat gain while still supporting growth. Larger surpluses mostly add fat, not muscle." },
        ].map((item) => (
          <div key={item.goal} style={{ background: dark, border: `1px solid ${border}`, padding: "1rem 1.25rem" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: "0.4rem", flexWrap: "wrap" }}>
              <span style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "0.95rem", fontWeight: 600, color: cream }}>{item.goal}</span>
              <span style={{ fontSize: "0.6rem", color: gold, fontFamily: "var(--font-montserrat), sans-serif", fontWeight: 600 }}>{item.adj}</span>
            </div>
            <p style={{ fontSize: "0.78rem", color: muted, margin: 0, lineHeight: 1.6, fontFamily: "var(--font-montserrat), sans-serif" }}>{item.why}</p>
          </div>
        ))}
      </div>

      <Divider />

      {/* Macros explanation */}
      <Label>Macro Targets</Label>
      <H2>Why these specific ratios</H2>
      <p style={{ fontSize: "0.88rem", color: muted, lineHeight: 1.72, fontFamily: "var(--font-montserrat), sans-serif", marginBottom: "1rem" }}>
        The calculator sets your macros based on your bodyweight — the most accurate method for physically active people, where targets are proportional to the muscle mass you have and are building.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: "1rem" }}>
        {[
          { macro: "Protein — 1g per lb of bodyweight", detail: "The top of the evidence-based range for muscle preservation and growth. This is your non-negotiable number. Hit this first before worrying about anything else. Protein is the single macro that most directly determines body composition outcomes." },
          { macro: "Fat — 0.35g per lb of bodyweight", detail: "The minimum needed to support hormonal health, fat-soluble vitamin absorption, and cellular function. Going lower than this consistently has measurable negative effects on health and performance." },
          { macro: "Carbohydrates — remaining calories", detail: "Carbs fill the rest of your calorie target after protein and fat are set. They're the body's preferred fuel source for high-intensity training. Neither demonising nor obsessing over them is supported by current research." },
        ].map((item) => (
          <div key={item.macro} style={{ background: dark, border: `1px solid ${border}`, padding: "1rem 1.25rem" }}>
            <p style={{ fontSize: "0.78rem", fontWeight: 600, color: cream, marginBottom: "0.4rem", fontFamily: "var(--font-montserrat), sans-serif" }}>{item.macro}</p>
            <p style={{ fontSize: "0.78rem", color: muted, margin: 0, lineHeight: 1.6, fontFamily: "var(--font-montserrat), sans-serif" }}>{item.detail}</p>
          </div>
        ))}
      </div>

      <ScienceBox
        study="Morton et al. (2018)"
        finding="A meta-analysis of 49 randomised controlled trials (n=1,800+) found that protein supplementation significantly augmented gains in muscle mass and strength during resistance training. The threshold for maximal benefit was approximately 1.62g/kg/day, with diminishing returns above this."
        cite="Morton RW et al. A systematic review, meta-analysis and meta-regression of the effect of protein supplementation on resistance training-induced gains in muscle mass and strength in healthy adults. Br J Sports Med. 2018;52(6):376–384."
      />

      <Divider />

      {/* The Calculator */}
      <Label>Interactive Calculator</Label>
      <H2>Calculate your numbers</H2>
      <p style={{ fontSize: "0.88rem", color: muted, lineHeight: 1.72, fontFamily: "var(--font-montserrat), sans-serif", marginBottom: "1.5rem" }}>
        Fill in your details below. When you&apos;re done, hit <strong style={{ color: cream }}>Save My Profile</strong> — your calorie target will be used in Module 3 to calculate your personalised portion sizes for the meal plan.
      </p>

      <TDEECalculator />

      <div style={{ marginTop: "1.5rem", background: "#0d0d0d", padding: "1rem 1.25rem", border: `1px solid #1a1a1a` }}>
        <p style={{ fontSize: "0.72rem", color: "#555", margin: 0, lineHeight: 1.6, fontFamily: "var(--font-montserrat), sans-serif" }}>
          <strong style={{ color: "#666" }}>On accuracy:</strong> These are estimates. The Mifflin-St Jeor formula is accurate to ±10% for most people in normal health. Use these numbers as a starting point, follow the plan for 2–3 weeks, then adjust by ±100–150 kcal based on results. No formula replaces direct observation of how your body responds.
        </p>
      </div>

      <Divider />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <Link
          href="/nutrition-foundations"
          style={{ fontSize: "0.68rem", color: "#555", fontFamily: "var(--font-montserrat), sans-serif", textDecoration: "none", letterSpacing: "0.1em" }}
        >
          ← Introduction
        </Link>
        <Link
          href="/nutrition-foundations/module2"
          style={{
            background: gold,
            color: "#0a0a0a",
            padding: "0.85rem 1.75rem",
            fontSize: "0.68rem",
            fontWeight: 600,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            textDecoration: "none",
            fontFamily: "var(--font-montserrat), sans-serif",
          }}
        >
          Module 2: Your Nutrition Blueprint →
        </Link>
      </div>
    </div>
  )
}
