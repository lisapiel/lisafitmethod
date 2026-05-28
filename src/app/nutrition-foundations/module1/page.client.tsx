"use client"

import Link from "next/link"
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

function CoachNote({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "rgba(201,169,110,0.07)", border: `1px solid rgba(201,169,110,0.25)`, borderLeft: `3px solid ${gold}`, padding: "1rem 1.25rem", marginTop: "1.25rem" }}>
      <p style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: goldDeep, marginBottom: "0.4rem", fontFamily: "var(--font-montserrat), sans-serif" }}>
        Coach Note
      </p>
      <p style={{ fontSize: "0.82rem", color: muted, margin: 0, lineHeight: 1.65, fontFamily: "var(--font-montserrat), sans-serif" }}>
        {children}
      </p>
    </div>
  )
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

const BMR_FACTORS = [
  "Height and weight",
  "Age",
  "Biological sex",
  "Lean body mass",
]

const TDEE_FACTORS = [
  "Body weight",
  "Muscle mass",
  "Daily movement",
  "Training volume",
  "Lifestyle habits",
]

export default function Module1Client() {
  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: "3rem 2.5rem 6rem" }} className="mod-body">
      <style>{`
        @media (max-width: 768px) { .mod-body { padding: 2rem 1rem 6rem !important; } }
      `}</style>

      <Label>Module 1 · Energy Systems</Label>
      <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(1.8rem, 4.5vw, 2.6rem)", fontWeight: 300, color: cream, lineHeight: 1.15, marginBottom: "1.25rem", marginTop: 0 }}>
        Understanding Your Body<br />
        <em style={{ color: gold }}>Know your numbers. Change your results.</em>
      </h1>
      <p style={{ fontSize: "0.88rem", color: muted, lineHeight: 1.72, marginBottom: "2rem", fontFamily: "var(--font-montserrat), sans-serif" }}>
        Before you can eat in a way that supports your goals, you need to understand how your body actually uses energy. Most people skip this step and follow a generic plan that was never designed for them. This module gives you the framework first, then calculates the numbers specifically for your body, activity level, and goal.
      </p>

      <Divider />

      {/* BMR section */}
      <Label>What is BMR?</Label>
      <H2>Your Basal Metabolic Rate: the energy you burn at rest</H2>
      <p style={{ fontSize: "0.88rem", color: muted, lineHeight: 1.72, fontFamily: "var(--font-montserrat), sans-serif" }}>
        Your BMR is the number of calories your body burns just to keep you alive: breathing, pumping blood, regulating temperature, repairing tissue, and keeping your organs functioning, even if you did absolutely nothing all day. If you stayed in bed for 24 hours without moving, this is approximately how many calories your body would still burn.
      </p>

      <div style={{ marginTop: "1.25rem", background: dark, border: `1px solid ${border}`, padding: "1.25rem 1.5rem" }}>
        <p style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#555", marginBottom: "0.75rem", fontFamily: "var(--font-montserrat), sans-serif" }}>
          BMR is influenced primarily by
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem 1rem" }}>
          {BMR_FACTORS.map((f) => (
            <div key={f} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: gold, flexShrink: 0, opacity: 0.7 }} />
              <span style={{ fontSize: "0.78rem", color: muted, fontFamily: "var(--font-montserrat), sans-serif" }}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      <p style={{ fontSize: "0.88rem", color: muted, lineHeight: 1.72, marginTop: "1rem", fontFamily: "var(--font-montserrat), sans-serif" }}>
        The calculator below uses the <strong style={{ color: cream }}>Mifflin-St Jeor equation</strong>, which is currently considered one of the most accurate predictive equations for estimating resting metabolic rate in healthy adults.
      </p>

      <ScienceBox
        study="Mifflin & St Jeor (1990)"
        finding="In a study of 498 participants, the Mifflin-St Jeor equation predicted resting metabolic rate more accurately than the Harris-Benedict equation across a wide range of body sizes and body compositions."
        cite="Mifflin MD et al. A new predictive equation for resting energy expenditure in healthy individuals. Am J Clin Nutr. 1990;51(2):241–247."
      />

      <Divider />

      {/* TDEE section */}
      <Label>What is TDEE?</Label>
      <H2>Total Daily Energy Expenditure: what you actually burn in a day</H2>
      <p style={{ fontSize: "0.88rem", color: muted, lineHeight: 1.72, fontFamily: "var(--font-montserrat), sans-serif" }}>
        Your TDEE takes your BMR and adjusts it based on your movement, exercise, daily activity, and lifestyle. This is the number that actually matters for nutrition planning.
      </p>

      {/* TDEE visual */}
      <div style={{ marginTop: "1.25rem", marginBottom: "1rem", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
        {[
          { label: "Eat at TDEE", result: "Maintain weight", color: "#555" },
          { label: "Eat below TDEE", result: "Lose fat", color: goldDeep },
          { label: "Eat above TDEE", result: "Gain muscle", color: gold },
        ].map((item) => (
          <div key={item.label} style={{ background: dark, border: `1px solid ${border}`, padding: "0.875rem 1rem", textAlign: "center" }}>
            <p style={{ fontSize: "0.62rem", color: "#555", fontFamily: "var(--font-montserrat), sans-serif", marginBottom: "0.4rem", lineHeight: 1.4 }}>{item.label}</p>
            <p style={{ fontSize: "0.78rem", fontWeight: 600, color: item.color, fontFamily: "var(--font-montserrat), sans-serif", margin: 0 }}>{item.result}</p>
          </div>
        ))}
      </div>

      <div style={{ background: dark, border: `1px solid ${border}`, padding: "1.25rem 1.5rem", marginBottom: "0.5rem" }}>
        <p style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#555", marginBottom: "0.75rem", fontFamily: "var(--font-montserrat), sans-serif" }}>
          Your TDEE changes over time with
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem 1rem" }}>
          {TDEE_FACTORS.map((f) => (
            <div key={f} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: gold, flexShrink: 0, opacity: 0.7 }} />
              <span style={{ fontSize: "0.78rem", color: muted, fontFamily: "var(--font-montserrat), sans-serif" }}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      <InfoBox label="The activity multiplier problem">
        <p style={{ fontSize: "0.82rem", color: muted, lineHeight: 1.65, margin: 0, fontFamily: "var(--font-montserrat), sans-serif" }}>
          Most people overestimate how active they really are. Research consistently shows that many people rate themselves at least one activity tier higher than reality. Someone with a desk job who trains 3 times per week usually falls closer to <strong style={{ color: cream }}>Lightly Active</strong> than <strong style={{ color: cream }}>Moderately Active</strong>. That difference can add roughly 200&ndash;300 calories to your daily target, which is often enough to completely stall fat loss progress without realizing why.
        </p>
        <p style={{ fontSize: "0.82rem", color: muted, lineHeight: 1.65, margin: "0.75rem 0 0", fontFamily: "var(--font-montserrat), sans-serif" }}>
          That is why the calculator descriptions are written carefully to help you choose the most realistic category, not the most optimistic one.
        </p>
      </InfoBox>

      <Divider />

      {/* Goal-Based Adjustment */}
      <Label>Goal-Based Adjustment</Label>
      <H2>How your goal changes the numbers</H2>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: "1.5rem" }}>
        {[
          {
            goal: "Fat Loss",
            adj: "approx. −400 kcal below TDEE",
            detail: [
              "This creates a calorie deficit, forcing the body to use stored energy for fuel. A moderate deficit is usually more sustainable and more effective long term than aggressive restriction.",
              "For most people, this leads to roughly 0.5–1 lb of weight loss per week while helping preserve muscle mass when protein intake and resistance training are adequate.",
            ],
          },
          {
            goal: "Maintenance / Body Recomposition",
            adj: "at approximately TDEE",
            detail: [
              "This supports recovery, performance, and body composition improvements without aggressively pushing weight loss or gain.",
              "With proper training and adequate protein intake, beginners can often build muscle and lose fat simultaneously at maintenance calories.",
            ],
          },
          {
            goal: "Muscle Gain",
            adj: "approx. +300 kcal above TDEE",
            detail: [
              "A moderate calorie surplus provides the additional energy needed to support muscle growth and recovery.",
              "Larger surpluses do not necessarily build muscle faster. In most cases, they simply increase fat gain alongside muscle gain.",
            ],
          },
        ].map((item) => (
          <div key={item.goal} style={{ background: dark, border: `1px solid ${border}`, padding: "1.25rem 1.5rem" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: "0.75rem", flexWrap: "wrap" }}>
              <span style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.1rem", fontWeight: 600, color: cream }}>{item.goal}</span>
              <span style={{ fontSize: "0.6rem", color: gold, fontFamily: "var(--font-montserrat), sans-serif", fontWeight: 600, letterSpacing: "0.05em" }}>{item.adj}</span>
            </div>
            {item.detail.map((d, i) => (
              <p key={i} style={{ fontSize: "0.78rem", color: muted, margin: i > 0 ? "0.5rem 0 0" : 0, lineHeight: 1.65, fontFamily: "var(--font-montserrat), sans-serif" }}>{d}</p>
            ))}
          </div>
        ))}
      </div>

      <Divider />

      {/* Macros explanation */}
      <Label>Macro Targets</Label>
      <H2>Why these numbers matter</H2>
      <p style={{ fontSize: "0.88rem", color: muted, lineHeight: 1.72, fontFamily: "var(--font-montserrat), sans-serif", marginBottom: "0.75rem" }}>
        The calculator sets your protein, fat, and carbohydrate targets primarily based on body weight because physically active individuals generally respond best to intake targets relative to their size and lean mass.
      </p>
      <p style={{ fontSize: "0.88rem", color: muted, lineHeight: 1.72, fontFamily: "var(--font-montserrat), sans-serif", marginBottom: "1.25rem" }}>
        These numbers are not meant to create perfection or obsession. They are simply structured starting points built around what current evidence consistently supports.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: "1rem" }}>
        {[
          {
            macro: "Protein",
            target: "1g per lb of bodyweight",
            points: [
              "Protein is the most important macronutrient for preserving and building muscle mass.",
              "It increases satiety, supports recovery, helps maintain lean tissue during fat loss, and has the highest thermic effect of all macronutrients.",
              "This is the number to prioritize first.",
            ],
          },
          {
            macro: "Fat",
            target: "0.35g per lb of bodyweight",
            points: [
              "Dietary fat supports hormonal health, nutrient absorption, brain function, and cellular function.",
              "Chronically low fat intake can negatively affect recovery, hormones, energy levels, and overall health.",
            ],
          },
          {
            macro: "Carbohydrates",
            target: "Remaining calories",
            points: [
              "Once protein and fats are set, carbohydrates fill the remaining calorie target.",
              "Carbohydrates are the body&apos;s preferred fuel source for high-intensity activity and resistance training. They support training performance, recovery, glycogen replenishment, and energy output.",
              "Carbs are not inherently good or bad. Context and total intake matter far more than internet trends.",
            ],
          },
        ].map((item) => (
          <div key={item.macro} style={{ background: dark, border: `1px solid ${border}`, padding: "1.25rem 1.5rem" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: "0.75rem", flexWrap: "wrap" }}>
              <span style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.1rem", fontWeight: 600, color: cream }}>{item.macro}</span>
              <span style={{ fontSize: "0.6rem", color: gold, fontFamily: "var(--font-montserrat), sans-serif", fontWeight: 600, letterSpacing: "0.05em" }}>{item.target}</span>
            </div>
            {item.points.map((p, i) => (
              <p key={i} style={{ fontSize: "0.78rem", color: muted, margin: i > 0 ? "0.5rem 0 0" : 0, lineHeight: 1.65, fontFamily: "var(--font-montserrat), sans-serif" }} dangerouslySetInnerHTML={{ __html: p }} />
            ))}
          </div>
        ))}
      </div>

      <ScienceBox
        study="Morton et al. (2018)"
        finding="A meta-analysis of 49 randomized controlled trials involving more than 1,800 participants found that protein supplementation significantly improved muscle mass and strength gains during resistance training. The greatest benefits were observed around approximately 1.6 g/kg/day, with diminishing returns beyond that level."
        cite="Morton RW et al. A systematic review, meta-analysis and meta-regression of the effect of protein supplementation on resistance training-induced gains in muscle mass and strength in healthy adults. Br J Sports Med. 2018;52(6):376–384."
      />

      <Divider />

      {/* The Calculator */}
      <Label>Interactive Calculator</Label>
      <H2>Calculate your numbers</H2>
      <p style={{ fontSize: "0.88rem", color: muted, lineHeight: 1.72, fontFamily: "var(--font-montserrat), sans-serif", marginBottom: "1.5rem" }}>
        Fill in your details below. When you&apos;re done, hit <strong style={{ color: cream }}>Save My Profile</strong>. Your calorie target will be used in Module 3 to calculate your personalised portion sizes for the meal plan.
      </p>

      <TDEECalculator />

      <CoachNote>
        These numbers are estimates, not absolutes. Use them as a starting point and adjust based on your progress over the next 2&ndash;3 weeks. No formula replaces direct observation of how your body responds.
      </CoachNote>

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
