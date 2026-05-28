"use client"

import Link from "next/link"
import NutritionDisclaimer from "@/components/nutrition/NutritionDisclaimer"
import ScienceBox from "@/components/nutrition/ScienceBox"

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

function TipBox({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "#0a0a0a", border: `1px solid ${border}`, borderLeft: `2px solid ${goldDeep}`, padding: "0.875rem 1.25rem", marginTop: "1rem" }}>
      <p style={{ fontSize: "0.82rem", color: muted, margin: 0, lineHeight: 1.65, fontFamily: "var(--font-montserrat), sans-serif" }}>
        {children}
      </p>
    </div>
  )
}

export default function Module4Client() {
  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: "3rem 2.5rem 6rem" }} className="mod-body">
      <style>{`
        @media (max-width: 768px) { .mod-body { padding: 2rem 1rem 6rem !important; } }
      `}</style>

      <NutritionDisclaimer />

      <Label>Module 4 · Sustainability</Label>
      <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(1.8rem, 4.5vw, 2.6rem)", fontWeight: 300, color: cream, lineHeight: 1.15, marginBottom: "1.25rem", marginTop: 0 }}>
        Making It Stick<br />
        <em style={{ color: gold }}>The part most people skip.</em>
      </h1>
      <p style={{ fontSize: "0.88rem", color: muted, lineHeight: 1.72, marginBottom: "2rem", fontFamily: "var(--font-montserrat), sans-serif" }}>
        The meal plan works on paper. Real life is where nutrition plans fall apart. This module is about what to do when you leave the controlled environment of your meal prep routine: eating out, social situations, plateaus, and the long game beyond 4 weeks.
      </p>

      <Divider />

      {/* Eating out */}
      <Label>Eating out</Label>
      <H2>Ordering strategically without being that person</H2>
      <p style={{ fontSize: "0.88rem", color: muted, lineHeight: 1.72, fontFamily: "var(--font-montserrat), sans-serif", marginBottom: "1rem" }}>
        The goal when eating out is not perfection. It&apos;s making the best choice available and accounting for it. The protein-first framework works in any restaurant.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {[
          {
            cuisine: "Mexican / Tex-Mex",
            strategy: "Bowl over burrito. Protein base (chicken, steak, shrimp) + rice + black beans + salsa + guac. Skip the tortilla or get one. Avoid sour cream if cutting fat.",
          },
          {
            cuisine: "Italian",
            strategy: "Protein-forward order: grilled fish or chicken over pasta. If pasta: choose a tomato-based sauce over cream-based. Portion pasta to ¼ plate, protein to ½ plate.",
          },
          {
            cuisine: "Sushi / Japanese",
            strategy: "Sashimi or nigiri over rolls (less rice, no fried components). Edamame is high protein. Miso soup adds sodium, so account for water retention, not fat gain.",
          },
          {
            cuisine: "Fast food / on the go",
            strategy: "Grilled chicken over fried. Protein bowl or salad with a protein topping over a sandwich. Skip the large fries, order small or none. A burger without the bun cuts ~200 kcal and ~30g carbs.",
          },
          {
            cuisine: "Steakhouse / grill",
            strategy: "Lean cuts: sirloin, tenderloin, eye of round over ribeye or T-bone. Side salad over fries. Avoid butter-basted options if calories are a concern.",
          },
        ].map((item) => (
          <div key={item.cuisine} style={{ background: dark, border: `1px solid ${border}`, padding: "0.875rem 1.25rem" }}>
            <p style={{ fontSize: "0.68rem", fontWeight: 700, color: gold, marginBottom: "0.4rem", fontFamily: "var(--font-montserrat), sans-serif", letterSpacing: "0.08em" }}>{item.cuisine}</p>
            <p style={{ fontSize: "0.78rem", color: muted, margin: 0, lineHeight: 1.6, fontFamily: "var(--font-montserrat), sans-serif" }}>{item.strategy}</p>
          </div>
        ))}
      </div>

      <TipBox>
        A general eating-out rule: look for the highest protein option that fits the context, don&apos;t eat the bread basket before the meal, and don&apos;t stress about one meal. One off-plan meal does not derail progress. A week of using meals as excuses does.
      </TipBox>

      <Divider />

      {/* Social situations */}
      <Label>Social situations</Label>
      <H2>Parties, events, and making it not weird</H2>
      <p style={{ fontSize: "0.88rem", color: muted, lineHeight: 1.72, fontFamily: "var(--font-montserrat), sans-serif", marginBottom: "1rem" }}>
        You do not need to announce you&apos;re &ldquo;eating healthy&rdquo; or turn down every social event. The goal is a strategy, not a performance.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: "1rem" }}>
        {[
          { label: "Pre-eating", desc: "Have a high-protein meal or snack before a party or event where food will be unpredictable. You can still eat there. You won't arrive ravenous and make poor decisions." },
          { label: "Alcohol", desc: "Alcohol has 7 kcal/gram. It cannot be stored as fat directly, but it's prioritised for metabolism, which means fat oxidation stops while alcohol is being processed. Light drinking (1-2 drinks) is unlikely to derail anything. Frequent heavy drinking will. Prefer spirits + soda water over beer or cocktails with sugary mixers if managing calories." },
          { label: "Buffets and parties", desc: "Plate food once, mindfully. Protein anchors your plate. Skip the items you don't actively want. Eat the ones you do. You don't have to eat everything just because it's there." },
          { label: "The morning after", desc: "Weight may be up from sodium and alcohol water retention, not fat. Don't panic. Return to your normal eating pattern the next day. One event does not require a detox or restriction phase." },
        ].map((item) => (
          <div key={item.label} style={{ background: dark, border: `1px solid ${border}`, padding: "0.875rem 1.25rem" }}>
            <p style={{ fontSize: "0.72rem", fontWeight: 700, color: cream, marginBottom: "0.35rem", fontFamily: "var(--font-montserrat), sans-serif" }}>{item.label}</p>
            <p style={{ fontSize: "0.78rem", color: muted, margin: 0, lineHeight: 1.6, fontFamily: "var(--font-montserrat), sans-serif" }}>{item.desc}</p>
          </div>
        ))}
      </div>

      <Divider />

      {/* Troubleshooting */}
      <Label>Troubleshooting</Label>
      <H2>When things aren&apos;t working</H2>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {[
          {
            problem: "Scale isn't moving after 2 weeks",
            steps: [
              "Step 1: Check NEAT first. Are you moving as much as you think? Add a 20-minute walk after dinner daily for one week and reassess before touching your calories.",
              "Step 2: Audit protein. Are you actually hitting your protein target? Under-eating protein is the most common hidden reason for slow progress. It increases hunger and reduces muscle preservation.",
              "Step 3: Reduce target by 100–150 kcal/day. Do not cut more than this at once. Give it 2 more weeks.",
              "Step 4: Check sleep. Sleep deprivation measurably increases hunger hormones and can stall fat loss independent of calories.",
            ],
          },
          {
            problem: "Losing weight too fast (more than 1.5 lb/week)",
            steps: [
              "Add 100-150 kcal/day from a carb source: rice, oats, or fruit.",
              "Ensure you're hitting your protein target. Rapid weight loss with low protein = muscle loss.",
              "Consider whether stress or illness is a factor. Both can suppress appetite and inflate losses.",
            ],
          },
          {
            problem: "Constant hunger",
            steps: [
              "Increase protein immediately. It's the most satiating macro gram-for-gram.",
              "Add more volume with non-starchy veg: spinach, cucumber, broccoli, zucchini. These add fibre and volume for almost no calories.",
              "Check if you're drinking enough water. Mild dehydration is frequently mistaken for hunger.",
              "Assess if your deficit is too aggressive. A 400 kcal deficit should be manageable; a 700+ kcal deficit often isn't.",
            ],
          },
        ].map((item) => (
          <div key={item.problem} style={{ background: dark, border: `1px solid ${border}`, padding: "1.25rem" }}>
            <p style={{ fontSize: "0.75rem", fontWeight: 700, color: cream, marginBottom: "0.75rem", fontFamily: "var(--font-montserrat), sans-serif" }}>
              ⚠ {item.problem}
            </p>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {item.steps.map((step) => (
                <li key={step} style={{ fontSize: "0.78rem", color: muted, paddingLeft: "1.25rem", position: "relative", lineHeight: 1.6, fontFamily: "var(--font-montserrat), sans-serif" }}>
                  <span style={{ position: "absolute", left: 0, color: goldDeep }}>›</span>
                  {step}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <Divider />

      {/* Supplements */}
      <Label>Supplements</Label>
      <H2>What actually works (short list)</H2>
      <p style={{ fontSize: "0.88rem", color: muted, lineHeight: 1.72, fontFamily: "var(--font-montserrat), sans-serif", marginBottom: "1rem" }}>
        The supplement industry generates billions by selling products with weak or no evidence. Below are the only three with strong, consistent evidence in healthy, training individuals. Everything else (fat burners, BCAAs, pre-workout dependency, &ldquo;metabolism boosters&rdquo;) is largely marketing.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: "1.25rem" }}>
        {[
          {
            name: "Creatine Monohydrate",
            dose: "3–5g/day",
            evidence: "The most studied sports supplement in existence. Increases phosphocreatine availability in muscle cells, directly improving output in high-intensity exercise. Modest but real increase in strength and lean mass over time. No loading phase required.",
          },
          {
            name: "Protein Powder (whey or casein)",
            dose: "As needed to hit daily protein target",
            evidence: "Not magic. It's just food in powder form. Useful if you consistently struggle to hit protein targets through whole foods. Whey digests quickly (post-workout), casein slowly (before bed). Not required if you can hit targets with food.",
          },
          {
            name: "Vitamin D3",
            dose: "1,000–2,000 IU/day",
            evidence: "Most people in northern latitudes are deficient. Vitamin D is involved in muscle function, immune regulation, and mood. Deficiency is associated with reduced athletic performance. The only supplement worth taking as general insurance without testing.",
          },
        ].map((supp) => (
          <div key={supp.name} style={{ background: dark, border: `1px solid ${border}`, padding: "1rem 1.25rem" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: "0.4rem", flexWrap: "wrap" }}>
              <p style={{ fontSize: "0.82rem", fontWeight: 700, color: cream, margin: 0, fontFamily: "var(--font-montserrat), sans-serif" }}>{supp.name}</p>
              <span style={{ fontSize: "0.62rem", color: gold, fontFamily: "var(--font-montserrat), sans-serif", fontWeight: 600 }}>{supp.dose}</span>
            </div>
            <p style={{ fontSize: "0.78rem", color: muted, margin: 0, lineHeight: 1.6, fontFamily: "var(--font-montserrat), sans-serif" }}>{supp.evidence}</p>
          </div>
        ))}
      </div>

      <ScienceBox
        study="Lanhers et al. (2017): Creatine"
        finding="A meta-analysis of 22 RCTs found creatine supplementation significantly increased upper and lower limb muscle strength compared to placebo when combined with resistance training, with effects most pronounced in younger participants."
        cite="Lanhers C et al. Creatine supplementation and upper limb strength performance: a systematic review and meta-analysis. Sports Med. 2017;47(1):163–173."
      />

      <div style={{ marginTop: "0.75rem", background: "#0d0d0d", padding: "0.875rem 1.25rem", border: `1px solid #1a1a1a` }}>
        <p style={{ fontSize: "0.72rem", color: "#555", margin: 0, lineHeight: 1.6, fontFamily: "var(--font-montserrat), sans-serif" }}>
          <strong style={{ color: "#666" }}>Important:</strong> As a CPT, I can share general educational information about supplements but cannot recommend specific supplements to treat or diagnose health conditions. Consult your doctor before adding any supplement, especially if you take medications or have a medical condition.
        </p>
      </div>

      <Divider />

      {/* Connecting to training */}
      <Label>Connecting everything</Label>
      <H2>Nutrition and your training program</H2>
      <p style={{ fontSize: "0.88rem", color: muted, lineHeight: 1.72, fontFamily: "var(--font-montserrat), sans-serif", marginBottom: "1rem" }}>
        Nutrition and training are not separate things. They work as a system. Each optimises the other.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: "1.25rem" }}>
        {[
          { time: "Pre-training (1–2 hours before)", guidance: "A moderate-carb, moderate-protein meal. Enough to fuel the session without causing GI discomfort. Example: overnight oats or rice with chicken." },
          { time: "Post-training (within 2 hours)", guidance: "Protein is the priority. It triggers muscle protein synthesis. Adding carbs here helps replenish glycogen. The 30-minute anabolic window is a myth, but eating protein-rich food within 2 hours is genuinely beneficial." },
          { time: "Rest days", guidance: "Appetite often drops on rest days. This is normal. You can eat slightly less, but maintain your protein target. Carbs can reduce by 20-30% on rest days if you're tracking training vs rest day calories." },
          { time: "Sleep and recovery", guidance: "7-9 hours is a nutritional variable, not just a lifestyle choice. Sleep deprivation increases ghrelin (hunger), reduces leptin (satiety), and reduces insulin sensitivity, all of which actively work against your nutrition targets." },
        ].map((item) => (
          <div key={item.time} style={{ background: dark, border: `1px solid ${border}`, padding: "0.875rem 1.25rem" }}>
            <p style={{ fontSize: "0.65rem", fontWeight: 700, color: gold, marginBottom: "0.3rem", fontFamily: "var(--font-montserrat), sans-serif", letterSpacing: "0.08em" }}>{item.time}</p>
            <p style={{ fontSize: "0.78rem", color: muted, margin: 0, lineHeight: 1.6, fontFamily: "var(--font-montserrat), sans-serif" }}>{item.guidance}</p>
          </div>
        ))}
      </div>

      {/* Training Foundations crossell */}
      <div style={{ background: "#0a0a0a", border: `1px solid ${border}`, padding: "1.5rem", marginBottom: "1.5rem" }}>
        <p style={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.25em", textTransform: "uppercase", color: goldDeep, marginBottom: "0.5rem", fontFamily: "var(--font-montserrat), sans-serif" }}>
          Also from Lisa Fit Method
        </p>
        <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.1rem", color: cream, margin: "0 0 0.5rem" }}>
          The nutrition supports the training. The training builds what the nutrition preserves.
        </p>
        <p style={{ fontSize: "0.78rem", color: muted, lineHeight: 1.6, margin: "0 0 1rem", fontFamily: "var(--font-montserrat), sans-serif" }}>
          If you haven&apos;t started the Training Foundations course, the full 4-week resistance training program is available alongside this nutrition course. Built on the same principles: structured, progressive, and designed to last.
        </p>
        <Link
          href="/training-foundations"
          style={{
            display: "inline-block",
            border: `1px solid ${goldDeep}`,
            color: gold,
            padding: "0.7rem 1.5rem",
            fontSize: "0.65rem",
            fontWeight: 600,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            textDecoration: "none",
            fontFamily: "var(--font-montserrat), sans-serif",
          }}
        >
          Open Training Foundations →
        </Link>
      </div>

      <Divider />

      {/* Lisa's note */}
      <Label>A note from Lisa</Label>
      <div style={{ borderLeft: `2px solid ${goldDeep}`, paddingLeft: "1.5rem" }}>
        <p style={{ fontSize: "0.88rem", color: muted, lineHeight: 1.75, fontFamily: "var(--font-montserrat), sans-serif", marginBottom: "0.75rem" }}>
          I built this course because the information that exists is either too complicated, too generic, or too motivated by selling you something. There is no supplement that replaces eating enough protein. There is no detox that improves on a calorie deficit. There is no meal timing trick that matters more than hitting your macro targets most days.
        </p>
        <p style={{ fontSize: "0.88rem", color: muted, lineHeight: 1.75, fontFamily: "var(--font-montserrat), sans-serif", marginBottom: "0.75rem" }}>
          I am a personal trainer, not a dietitian. Everything in this course is general education that I believe is accurate and helpful, but you know your own body and your own situation. If something isn&apos;t working after an honest 4-week effort, work with a registered dietitian who can look at the full picture.
        </p>
        <p style={{ fontSize: "0.88rem", color: muted, lineHeight: 1.75, fontFamily: "var(--font-montserrat), sans-serif", marginBottom: "0.5rem" }}>
          The recipes are real. The science is real. The results depend on you doing the work consistently. You now have the framework. Go use it.
        </p>
        <p style={{ fontFamily: "var(--font-cormorant), serif", fontStyle: "italic", fontSize: "1.1rem", color: cream }}>
          Lisa McPherson, CPT
        </p>
      </div>

      <Divider />

      {/* Full legal disclaimer footer */}
      <div style={{ background: dark, border: `1px solid ${border}`, padding: "1.25rem 1.5rem" }}>
        <p style={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#555", marginBottom: "0.5rem", fontFamily: "var(--font-montserrat), sans-serif" }}>
          Full Disclaimer
        </p>
        <p style={{ fontSize: "0.72rem", color: "#555", margin: 0, lineHeight: 1.7, fontFamily: "var(--font-montserrat), sans-serif" }}>
          This content is for general educational purposes only. Lisa McPherson is a NASM Certified Personal Trainer, not a Registered Dietitian, licensed nutritionist, or medical professional. This course does not constitute medical nutrition therapy and does not replace advice from a qualified healthcare provider. Always consult your physician before starting a new nutrition program, especially if you have a medical condition, are pregnant or nursing, take medications, or have a history of eating disorders. Individual results vary. References to research are provided for educational context; they should not be interpreted as endorsement of specific claims or products.
        </p>
      </div>

      <Divider />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <Link
          href="/nutrition-foundations/module3"
          style={{ fontSize: "0.68rem", color: "#555", fontFamily: "var(--font-montserrat), sans-serif", textDecoration: "none", letterSpacing: "0.1em" }}
        >
          ← Module 3
        </Link>
        <Link
          href="/nutrition-foundations/resources"
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
          References & Resources →
        </Link>
      </div>
    </div>
  )
}
