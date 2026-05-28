"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { COURSE_PRICE_DISPLAY, COURSE_REGULAR_PRICE_DISPLAY } from "@/lib/pricing"
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
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2C10 7 8 10 8 14a4 4 0 0 0 8 0c0-4-2-7-4-12z"
        stroke={gold} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 22c-1.1 0-2-.9-2-2 0-.9.5-1.8 2-2.5 1.5.7 2 1.6 2 2.5 0 1.1-.9 2-2 2z"
        stroke={gold} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconMolecule() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 21h5v-5h5v-5h5v-5h3"
        stroke={gold} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconMoon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
        stroke={gold} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const PRINCIPLES = [
  {
    num: 1,
    icon: <IconFlame />,
    category: "Energy Balance",
    name: "Calorie Deficit: The Only Mechanism for Fat Loss",
    body: "Your body stores fat as energy. To access it, you need to consume less energy than you expend. That is the mechanism — the only one. No food is inherently fat-burning, no exercise targets belly fat, no supplement overrides this equation. Everything that works, works because it creates or supports a deficit.",
    mythBust: "Spot reduction does not exist. Doing crunches builds abdominal muscle underneath, but the fat sitting on top responds to systemic energy balance — not to which muscle you're contracting.",
    science: {
      study: "Hall et al. (2012)",
      finding: "In controlled metabolic ward studies, fat loss across different diet compositions was equivalent when total calories were equated. Energy balance, not macronutrient ratio, is the primary driver of fat loss.",
      cite: "Hall KD et al. Energy balance and its components: implications for body weight regulation. Am J Clin Nutr. 2012.",
    },
    practical: "A deficit of 300–500 kcal/day is the evidence-based sweet spot. It preserves muscle better than aggressive cuts and is sustainable enough to maintain for months, not days.",
  },
  {
    num: 2,
    icon: <IconMolecule />,
    category: "Macronutrient Strategy",
    name: "Protein: The Lever That Controls Body Composition",
    body: "Calories determine whether you lose weight. Protein determines what kind of weight you lose. In a calorie deficit, the body will pull from both fat and muscle for fuel. Adequate protein intake is what preserves muscle tissue during fat loss — so you end up leaner, not just lighter.",
    mythBust: "Protein also has a 20–35% thermic effect — your body burns roughly a quarter of its calories just digesting it, compared to 5–10% for carbohydrates and 0–3% for fat. Eating more protein is a minor but real metabolic advantage.",
    science: {
      study: "Morton et al. (2018)",
      finding: "A meta-analysis of 49 studies (n=1,800+) found that protein supplementation significantly increased strength and muscle mass gains from resistance training, with a threshold near 1.62 g/kg/day. Higher intakes showed diminishing returns.",
      cite: "Morton RW et al. A systematic review, meta-analysis and meta-regression of the effect of protein supplementation on resistance training-induced gains in muscle mass. Br J Sports Med. 2018.",
    },
    practical: "Target 1.6–2.2 g of protein per kg of bodyweight per day. For a 65 kg person that is 104–143 g/day. Build your meals around this number before worrying about anything else.",
  },
  {
    num: 3,
    icon: <IconBarbell />,
    category: "Muscle & Metabolism",
    name: "Build Muscle: The Closest Thing to a Real Shortcut",
    body: "Muscle tissue is metabolically active. At rest, 1 lb of muscle burns approximately 6 kcal/day — roughly three times more than 1 lb of fat at 2 kcal/day. Every pound of muscle you build raises your resting metabolic rate permanently. This is not a dramatic number per pound, but it compounds: more muscle means a higher baseline calorie burn around the clock, without doing anything extra.",
    mythBust: "This is the real long-game advantage of resistance training over cardio for body composition. Cardio burns calories during the session. Muscle burns calories for the rest of your life.",
    science: {
      study: "Wolfe et al. (2006) + American Journal of Medicine (2014)",
      finding: "Skeletal muscle is recognized as the organ of longevity. A 10-year longitudinal study found that higher muscle mass index was inversely associated with all-cause mortality, with a hazard ratio of 0.80 for the highest vs. lowest muscle mass quartile.",
      cite: "Wolfe RR. The underappreciated role of muscle in health and disease. Am J Clin Nutr. 2006. / Srikanthan P, Karlamangla AS. Muscle mass index as predictor of longevity. Am J Med. 2014.",
    },
    practical: "To build muscle you need three things together: resistance training with progressive overload, adequate protein (see Principle 2), and enough total calories. Aggressive deficits work against muscle gain — this is why the goal is a moderate deficit, not a crash diet.",
    courseHook: true,
  },
  {
    num: 4,
    icon: <IconSteps />,
    category: "Daily Energy Output",
    name: "NEAT: The Hidden Multiplier Nobody Talks About",
    body: "NEAT — Non-Exercise Activity Thermogenesis — is the energy you burn through all daily movement that is not formal exercise: walking, standing, fidgeting, taking stairs, carrying groceries. It is the most variable component of your total energy expenditure, and most people systematically underestimate it.",
    mythBust: "Levine et al. at Mayo Clinic found that NEAT can vary by up to 2,000 kcal/day between individuals of similar body size. A sedentary person and an active one eating the same diet and doing the same workouts can have dramatically different results — purely because of NEAT. A single workout can be fully cancelled out by sitting the rest of the day.",
    science: {
      study: "Levine et al. (Mayo Clinic, 2005)",
      finding: "NEAT accounts for 15–50% of total daily energy expenditure and varies by up to 2,000 kcal/day between people with similar body composition. Obese individuals sat an average of 164 minutes more per day than lean individuals — a difference of ~350 kcal/day in NEAT alone.",
      cite: "Levine JA et al. Interindividual variation in posture allocation: possible role in human obesity. Science. 2005.",
    },
    practical: "8,000–10,000 steps per day is a reliable proxy for keeping NEAT high. Walk after meals, stand on calls, take stairs. These are not optional lifestyle add-ons — they are meaningful calorie variables.",
  },
  {
    num: 5,
    icon: <IconMoon />,
    category: "Hormonal Health",
    name: "Sleep: The Hormone Controller You Are Probably Ignoring",
    body: "Sleep is not passive recovery time. It is when your body regulates the hormones that control hunger, satiety, and food selection. Skimping on sleep does not just make you tired — it chemically increases your drive to overeat high-calorie food the following day.",
    mythBust: "You cannot out-discipline sleep deprivation. Willpower is downstream of hormones, and poor sleep stacks the hormonal deck against you every single day.",
    science: {
      study: "Spiegel et al. (2004, University of Chicago)",
      finding: "Restricting healthy adults to 4 hours of sleep increased ghrelin (hunger hormone) by 28% and decreased leptin (satiety hormone) by 18% compared to 10-hour sleep. This translated to 24% higher hunger ratings and 23% greater appetite, particularly for calorie-dense, high-carbohydrate foods.",
      cite: "Spiegel K et al. Sleep curtailment in healthy young men is associated with decreased leptin levels, elevated ghrelin levels, and increased hunger and appetite. Ann Intern Med. 2004.",
    },
    practical: "7–9 hours is not a wellness trend. It is a hormonal requirement for body composition. Treat it as a training variable with the same seriousness as your workout.",
  },
]

const FEATURES: [string, string][] = [
  ["50+ exercise videos", " with coaching cues so you build muscle with correct form from day one"],
  ["The full 4-week progressive program", ", three days a week, with sets, reps, rest, and warm-up built in"],
  ["Built-in tracking you keep for life", " — log every set, watch your numbers climb week over week"],
  ["Progressive overload designed in", " so you always know your next step without guessing"],
  ["The nutrition foundations module", " — practical, no calorie obsession, built on the exact science above"],
  ["Works at home with dumbbells and bands", ", and scales straight into the gym"],
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

function ScienceBox({ study, finding, cite }: { study: string; finding: string; cite: string }) {
  return (
    <div style={{ background: panel, borderLeft: `2px solid ${gold}`, padding: "0.875rem 1.2rem", marginTop: "0.875rem" }}>
      <p style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.2em", color: goldDeep, fontWeight: 600, marginBottom: "0.4rem", fontFamily: dmSans }}>
        The Science
      </p>
      <p style={{ fontSize: "0.87rem", color: ink, lineHeight: 1.62, margin: "0 0 0.4rem", fontFamily: dmSans }}>
        <strong>{study}:</strong> {finding}
      </p>
      <p style={{ fontSize: "0.72rem", color: muted, margin: 0, fontFamily: dmSans, fontStyle: "italic", lineHeight: 1.5 }}>
        {cite}
      </p>
    </div>
  )
}

function PrincipleCard({
  num, icon, category, name, body, mythBust, science, practical, courseHook,
}: {
  num: number
  icon: React.ReactNode
  category: string
  name: string
  body: string
  mythBust: string
  science: { study: string; finding: string; cite: string }
  practical: string
  courseHook?: boolean
}) {
  return (
    <div style={{ marginBottom: "2.25rem" }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.3rem", flexWrap: "wrap" }}>
        <span style={{
          fontFamily: playfair,
          fontWeight: 700,
          fontSize: "0.88rem",
          color: goldDeep,
          border: `1.5px solid ${gold}`,
          width: 34,
          height: 34,
          borderRadius: "50%",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          {num}
        </span>
        <span style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>{icon}</span>
        <span style={{ fontSize: "0.67rem", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.18em", color: muted, marginLeft: "auto", fontFamily: dmSans, whiteSpace: "nowrap" }}>
          {category}
        </span>
      </div>

      {/* Title */}
      <h3 style={{ fontFamily: playfair, fontSize: "clamp(1.1rem, 3vw, 1.35rem)", fontWeight: 700, color: ink, letterSpacing: "-0.01em", margin: "0.15rem 0 0 0", lineHeight: 1.2 }}>
        {name}
      </h3>

      {/* Body */}
      <p style={{ fontSize: "0.9rem", margin: "0.65rem 0 0", lineHeight: 1.72, color: muted, fontFamily: dmSans }}>
        {body}
      </p>

      {/* Myth bust callout */}
      <div style={{ margin: "0.75rem 0 0", padding: "0.75rem 1rem", background: "#fff", border: `1px solid ${line}` }}>
        <p style={{ fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.16em", color: goldDeep, fontWeight: 600, marginBottom: "0.35rem", fontFamily: dmSans }}>
          The reality
        </p>
        <p style={{ fontSize: "0.87rem", color: ink, margin: 0, lineHeight: 1.6, fontFamily: dmSans }}>
          {mythBust}
        </p>
      </div>

      {/* Science box */}
      <ScienceBox {...science} />

      {/* Practical */}
      <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.6rem", alignItems: "flex-start" }}>
        <span style={{ color: goldDeep, fontSize: "0.85rem", flexShrink: 0, paddingTop: "0.08rem" }}>→</span>
        <p style={{ fontSize: "0.87rem", color: muted, margin: 0, lineHeight: 1.62, fontFamily: dmSans }}>
          <strong style={{ color: ink }}>In practice:</strong> {practical}
        </p>
      </div>

      {/* Course hook for principle 3 */}
      {courseHook && (
        <div style={{ marginTop: "0.875rem", background: black, padding: "0.875rem 1.2rem", display: "flex", alignItems: "center", gap: "0.875rem" }}>
          <span style={{ color: gold, fontSize: "0.85rem", flexShrink: 0 }}>→</span>
          <p style={{ fontSize: "0.87rem", color: "#c9bfb0", margin: 0, lineHeight: 1.6, fontFamily: dmSans }}>
            This is exactly what the 4-week program is built around — <strong style={{ color: "#fff" }}>structured resistance training that builds muscle progressively</strong>, session by session, week by week.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function NutritionGuideClient() {
  const searchParams = useSearchParams()
  const [unlocked, setUnlocked] = useState(() => searchParams.get("unlocked") === "1")

  return (
    <main style={{ background: paper, minHeight: "100vh" }}>
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "clamp(36px, 6vw, 64px) clamp(20px, 5vw, 40px) 80px" }}>

        {!unlocked ? (
          /* ── Pre-email: teaser + form ── */
          <>
            <Label>Free Guide · Nutrition</Label>
            <h1 style={{ fontFamily: playfair, fontSize: "clamp(2rem, 5.5vw, 3.1rem)", lineHeight: 1.05, letterSpacing: "-0.02em", color: black, fontWeight: 700, marginBottom: "1.2rem", marginTop: 0 }}>
              Stop searching for shortcuts.{" "}
              <em style={{ fontStyle: "italic", fontWeight: 600, color: goldDeep }}>Here&apos;s what the science actually says.</em>
            </h1>
            <p style={{ fontSize: "clamp(0.9rem, 2.5vw, 1.05rem)", color: muted, maxWidth: 580, marginBottom: "2rem", lineHeight: 1.72, fontFamily: dmSans }}>
              The 5 science-backed nutrition principles behind every real body transformation. No hacks, no supplements, no confusion. Just the actual research — with references you can check yourself.
            </p>

            <div style={{ marginBottom: "2rem" }}>
              {[
                ["The only mechanism for fat loss", " — and why belly fat hacks fundamentally miss the point"],
                ["The protein number that changes your body composition", " — not just your weight on the scale"],
                ["Why building muscle is the closest thing to a real metabolism shortcut", ""],
                ["The hidden calorie variable that can cancel your gym session", " — and how to use it instead"],
                ["The hormone lever that decides how hungry you are tomorrow", " — it happens while you sleep"],
              ].map(([bold, rest], i) => (
                <div key={i} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", padding: "0.55rem 0", borderBottom: i < 4 ? `1px solid ${line}` : "none" }}>
                  <span style={{ color: gold, fontSize: "0.85rem", flexShrink: 0, paddingTop: "0.12rem" }}>&#8594;</span>
                  <p style={{ fontFamily: dmSans, fontSize: "0.93rem", color: ink, margin: 0, lineHeight: 1.55 }}>
                    <strong>{bold}</strong>{rest}
                  </p>
                </div>
              ))}
            </div>

            {/* Email gate */}
            <div style={{ background: black, padding: "clamp(1.75rem, 5vw, 2.5rem) clamp(1.5rem, 5vw, 2.75rem)" }}>
              <p style={{ fontSize: "0.68rem", fontWeight: 500, letterSpacing: "0.3em", textTransform: "uppercase", color: goldDeep, marginBottom: "0.75rem", fontFamily: dmSans }}>
                Free · No credit card
              </p>
              <h2 style={{ fontFamily: playfair, fontSize: "clamp(1.4rem, 3.5vw, 1.75rem)", color: "#fff", fontWeight: 700, marginBottom: "0.75rem", marginTop: 0, lineHeight: 1.15 }}>
                Enter your email to get the guide
              </h2>
              <p style={{ fontSize: "0.88rem", color: "#b3ab9c", marginBottom: "1.5rem", maxWidth: 480, lineHeight: 1.65, fontFamily: dmSans }}>
                You will get the full guide instantly, plus a copy in your inbox to keep.
              </p>
              <FreeGuideSignupForm
                source="free-guide-nutrition"
                apiEndpoint="/api/free-guide-nutrition"
                onSuccess={() => setUnlocked(true)}
                formOnly
              />
            </div>

            <p style={{ fontSize: "0.65rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "#9c9590", marginTop: "3rem", textAlign: "center", fontFamily: dmSans }}>
              Lisa McPherson, CPT · lisafitmethod.com
            </p>
          </>
        ) : (
          /* ── Post-email: full guide ── */
          <>
            {/* Confirmation banner */}
            <div style={{ background: panel, borderLeft: `2px solid ${gold}`, padding: "1rem 1.5rem", marginBottom: "2.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ color: gold, fontSize: "1rem", flexShrink: 0 }}>&#10003;</span>
              <p style={{ fontFamily: dmSans, fontSize: "0.85rem", color: muted, margin: 0 }}>
                You are in. Check your inbox for a copy to keep.
              </p>
            </div>

            {/* Header */}
            <Label>Free Guide · Nutrition</Label>
            <h1 style={{ fontFamily: playfair, fontSize: "clamp(2rem, 5.5vw, 3.1rem)", lineHeight: 1.05, letterSpacing: "-0.02em", color: black, fontWeight: 700, marginBottom: "1.2rem", marginTop: 0 }}>
              Stop searching for shortcuts.{" "}
              <em style={{ fontStyle: "italic", fontWeight: 600, color: goldDeep }}>Here&apos;s what the science actually says.</em>
            </h1>
            <p style={{ fontSize: "clamp(0.9rem, 2.5vw, 1.05rem)", color: muted, maxWidth: 600, marginBottom: 0, lineHeight: 1.72, fontFamily: dmSans }}>
              Five science-backed principles. Real references you can check yourself.{" "}
              <strong style={{ color: ink }}>This is what every effective nutrition approach is built on — whether the plan knows it or not.</strong>
            </p>

            <Rule />

            {/* Framing story */}
            <div style={{ background: panel, padding: "clamp(1.5rem, 4vw, 2rem) clamp(1.25rem, 4vw, 2.25rem)", marginBottom: "0.5rem", borderLeft: `2px solid ${gold}` }}>
              <p style={{ fontSize: "0.93rem", lineHeight: 1.75, marginBottom: "0.75rem", color: muted, fontFamily: dmSans }}>
                Every week, millions of people search &ldquo;how to lose belly fat fast.&rdquo; They find fat-burning teas, targeted ab protocols, metabolism-resetting cleanses. I spent years in that loop — working hard, staying confused, not seeing results that matched the effort.
              </p>
              <p style={{ fontSize: "0.93rem", lineHeight: 1.75, marginBottom: "0.75rem", color: muted, fontFamily: dmSans }}>
                I am an engineer. I needed the mechanism, not the marketing. So I went to the actual research. What I found was both simpler and more counterintuitive than the industry wants it to seem: <strong style={{ color: ink }}>fat loss is a solved problem. The science is not complicated. The industry makes it complicated because complexity sells products.</strong>
              </p>
              <p style={{ fontSize: "0.93rem", lineHeight: 1.75, marginBottom: "0.5rem", color: muted, fontFamily: dmSans }}>
                What follows are the five principles the research keeps returning to. Not trends. Not opinions. Mechanisms.
              </p>
              <p style={{ fontFamily: playfair, fontStyle: "italic", fontSize: "1.05rem", color: goldDeep, margin: 0 }}>
                Lisa McPherson, CPT
              </p>
            </div>

            <Rule />

            {/* Principles */}
            <Label>The 5 Principles</Label>
            <h2 style={{ fontFamily: playfair, fontSize: "clamp(1.5rem, 4vw, 1.9rem)", color: black, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "0.6rem", marginTop: 0, lineHeight: 1.1 }}>
              The whole equation.{" "}
              <em style={{ fontStyle: "italic", fontWeight: 600, color: goldDeep }}>Nothing left out.</em>
            </h2>
            <p style={{ fontSize: "0.92rem", maxWidth: 600, marginBottom: "2rem", color: muted, lineHeight: 1.7, fontFamily: dmSans }}>
              These principles are not a diet plan. They are the underlying mechanics. Every effective nutrition approach — keto, Mediterranean, IF, flexible dieting — works because it satisfies some or all of these. Understanding them means you stop following plans blindly and start understanding why things work.
            </p>

            {PRINCIPLES.map((p) => (
              <PrincipleCard key={p.num} {...p} />
            ))}

            <Rule />

            {/* The full equation */}
            <Label>Putting it together</Label>
            <h2 style={{ fontFamily: playfair, fontSize: "clamp(1.5rem, 4vw, 1.9rem)", color: black, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "0.6rem", marginTop: 0, lineHeight: 1.1 }}>
              The equation.{" "}
              <em style={{ fontStyle: "italic", fontWeight: 600, color: goldDeep }}>There is no sixth thing.</em>
            </h2>
            <p style={{ fontSize: "0.92rem", color: muted, lineHeight: 1.7, fontFamily: dmSans, marginBottom: "1.5rem", maxWidth: 600 }}>
              Every sustainable body transformation runs on the same five variables. You do not need to do all five perfectly — but you do need all five in the frame. Ignoring any one of them creates a ceiling you will keep hitting.
            </p>

            {/* Equation visual */}
            <div style={{ background: black, padding: "clamp(1.5rem, 4vw, 2rem) clamp(1.25rem, 4vw, 2rem)", marginBottom: "0.5rem" }}>
              {[
                { icon: <IconFlame />, label: "Calorie Deficit", sub: "The mechanism" },
                { icon: <IconMolecule />, label: "Adequate Protein", sub: "The lever" },
                { icon: <IconBarbell />, label: "Resistance Training", sub: "The multiplier" },
                { icon: <IconSteps />, label: "Daily Movement", sub: "The constant" },
                { icon: <IconMoon />, label: "Quality Sleep", sub: "The regulator" },
              ].map((item, i) => (
                <div key={i}>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.75rem 0" }}>
                    <div style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>{item.icon}</div>
                    <div>
                      <p style={{ fontFamily: playfair, fontSize: "1.05rem", color: "#fff", margin: 0, fontWeight: 600 }}>{item.label}</p>
                      <p style={{ fontFamily: dmSans, fontSize: "0.7rem", color: "#5a544b", margin: 0, textTransform: "uppercase", letterSpacing: "0.12em" }}>{item.sub}</p>
                    </div>
                    {i < 4 && (
                      <span style={{ marginLeft: "auto", color: gold, fontSize: "1.2rem", flexShrink: 0, fontFamily: dmSans }}>+</span>
                    )}
                    {i === 4 && (
                      <span style={{ marginLeft: "auto", color: goldDeep, fontFamily: dmSans, fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.14em", fontWeight: 600 }}>= Results</span>
                    )}
                  </div>
                  {i < 4 && <div style={{ height: 1, background: "#2a2722" }} />}
                </div>
              ))}
            </div>

            <Rule />

            {/* Pitch */}
            <Label>Here&apos;s the honest part</Label>
            <h2 style={{ fontFamily: playfair, fontSize: "clamp(1.4rem, 3.5vw, 1.8rem)", color: black, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "0.8rem", marginTop: 0, lineHeight: 1.12 }}>
              You have the science.{" "}
              <em style={{ fontStyle: "italic", fontWeight: 600, color: goldDeep }}>The course is the structured how.</em>
            </h2>
            <p style={{ fontSize: "0.93rem", marginBottom: "1rem", color: muted, lineHeight: 1.7, fontFamily: dmSans }}>
              Knowing these five principles puts you ahead of most people. But knowledge is not a program. The missing piece is structure: a resistance training plan that builds the muscle at the center of all of this, with the progressive overload that makes it actually work over time.
            </p>
            <p style={{ fontSize: "0.93rem", marginBottom: "1rem", color: muted, lineHeight: 1.7, fontFamily: dmSans }}>
              That is the 4-week Training Foundations program. Built around the principles above. Three days a week. Less than the cost of a single session with a trainer:
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 0.25rem" }}>
              {FEATURES.map(([bold, rest], i) => (
                <li key={i} style={{ fontSize: "0.93rem", padding: "0.55rem 0 0.55rem 2rem", position: "relative", borderBottom: `1px solid ${line}`, color: ink, fontFamily: dmSans, lineHeight: 1.55 }}>
                  <span style={{ position: "absolute", left: 0, color: goldDeep, fontWeight: 500, fontSize: "1rem", lineHeight: "1.4rem" }}>&#8594;</span>
                  <strong>{bold}</strong>{rest}
                </li>
              ))}
            </ul>

            {/* CTA */}
            <div style={{ background: black, padding: "clamp(1.75rem, 5vw, 2.5rem) clamp(1.5rem, 5vw, 2.75rem)", marginTop: "1.75rem" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "0.875rem", marginBottom: "0.25rem", flexWrap: "wrap" }}>
                <span style={{ color: "#5a544b", textDecoration: "line-through", fontFamily: playfair, fontSize: "1.5rem" }}>
                  {COURSE_REGULAR_PRICE_DISPLAY}
                </span>
                <span style={{ color: "#fff", fontFamily: playfair, fontSize: "clamp(2rem, 5vw, 2.9rem)", fontWeight: 700, lineHeight: 1 }}>
                  {COURSE_PRICE_DISPLAY}
                </span>
                <span style={{ fontSize: "0.62rem", fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", color: black, background: gold, padding: "4px 10px", alignSelf: "center", fontFamily: dmSans }}>
                  Limited Time
                </span>
              </div>
              <h3 style={{ fontFamily: playfair, fontSize: "clamp(1.4rem, 3.5vw, 1.7rem)", fontWeight: 700, margin: "1.1rem 0 0.75rem", color: "#fff", letterSpacing: "-0.01em" }}>
                You know the why.{" "}
                <em style={{ fontStyle: "italic", fontWeight: 600, color: gold }}>Get the how.</em>
              </h3>
              <p style={{ fontSize: "0.88rem", color: "#b3ab9c", marginBottom: "1.6rem", maxWidth: 480, lineHeight: 1.65, fontFamily: dmSans }}>
                One payment, lifetime access. The program, the videos, the tracker, and the nutrition module — all built on the principles above. The price returns to {COURSE_REGULAR_PRICE_DISPLAY} soon.
              </p>
              <Link
                href="/checkout"
                style={{
                  display: "block",
                  background: gold,
                  color: black,
                  textAlign: "center",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  padding: "1rem",
                  textDecoration: "none",
                  fontFamily: dmSans,
                  maxWidth: 400,
                }}
              >
                Get Instant Access
              </Link>
              <p style={{ fontSize: "0.68rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5a544b", marginTop: "1rem", fontFamily: dmSans }}>
                One-time payment · Lifetime access · Use it, reuse it, keep building
              </p>
            </div>

            {/* Footer */}
            <p style={{ fontSize: "0.65rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "#9c9590", marginTop: "3rem", textAlign: "center", fontFamily: dmSans }}>
              Lisa McPherson, CPT · lisafitmethod.com · @lisafitmethod
            </p>
          </>
        )}
      </div>
    </main>
  )
}
