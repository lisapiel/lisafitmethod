import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Module 4 — Nutrition Foundations | Lisa Fit Method",
}

const gold = "#c9a96e"
const cream = "#f0e6d3"
const border = "#2a2a2a"

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: "0.65rem", fontWeight: 500, letterSpacing: "0.3em", textTransform: "uppercase", color: gold, marginBottom: "0.75rem", fontFamily: "var(--font-montserrat), sans-serif" }}>
      {children}
    </div>
  )
}

function PrincipleCard({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: "2rem", background: "#161616", border: `1px solid ${border}`, borderLeft: `3px solid ${gold}`, marginBottom: "1.5rem" }}>
      <div style={{ fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.25em", textTransform: "uppercase", color: gold, marginBottom: "0.5rem", fontFamily: "var(--font-montserrat), sans-serif" }}>
        {num}
      </div>
      <div style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.3rem", fontWeight: 400, color: cream, marginBottom: "0.75rem" }}>
        {title}
      </div>
      <p style={{ fontSize: "0.88rem", color: "#b0a090", lineHeight: 1.5 }}>{children}</p>
    </div>
  )
}

export default function Module4Page() {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "3rem 2.5rem 6rem" }} className="course-body">
      <style>{`@media (max-width: 768px) { .course-body { padding: 2rem 1rem 6rem !important; } }`}</style>

      <SectionLabel>Module 4</SectionLabel>
      <h2 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 300, color: cream, lineHeight: 1.2, marginBottom: "1rem" }}>
        Nutrition Foundations
      </h2>
      <p style={{ fontSize: "0.9rem", color: "#888", lineHeight: 1.5, maxWidth: 700, marginBottom: "3rem", paddingBottom: "2rem", borderBottom: `1px solid ${border}` }}>
        This is not a diet plan. It is not a calorie calculator. It is five principles that if you apply them consistently will support everything you do in the gym and help you build and maintain a healthy body composition without obsessing over food. About a year ago I started taking nutrition seriously for the first time. Not dieting, not tracking every gram, just genuinely understanding what my body needed to perform and recover. The difference it made was bigger than any program change I had ever made. Food is not separate from your fitness. It is half of it.
      </p>

      <PrincipleCard num="Principle 1" title="Protein is your priority">
        Protein is the building block of muscle. Without enough of it the work you do in the gym doesn&apos;t translate into the results you want. A simple daily target is 0.7 to 1 gram of protein per pound of bodyweight. Build your meals around a protein source first and add everything else around it. Good sources: chicken, turkey, eggs, Greek yogurt, cottage cheese, fish, lean beef. Protein shakes can help you hit your target but they supplement real food, they don&apos;t replace it.
      </PrincipleCard>

      <PrincipleCard num="Principle 2" title="Eat enough to train">
        Undereating while trying to build strength is one of the most common mistakes beginners make. If you are consistently tired, not recovering well between sessions, or not getting stronger over time, there is a good chance you are not eating enough. Strength training requires fuel. Your body cannot build muscle in a significant deficit.
      </PrincipleCard>

      <PrincipleCard num="Principle 3" title="Consistency beats perfection">
        One bad meal does not ruin your progress. One perfect meal does not build your body. It is the pattern over weeks and months that determines your results. Stop looking for the perfect approach and start building the habit of eating mostly whole foods, mostly enough protein, and mostly in reasonable amounts.
      </PrincipleCard>

      <PrincipleCard num="Principle 4" title="Hydration affects everything">
        Dehydration directly impairs performance, recovery, focus, and joint health. A simple daily target is half your bodyweight in ounces of water, which works out to roughly 1.5 to 2.5 liters depending on your size. If you train hard or sweat a lot, aim for the higher end.
      </PrincipleCard>

      <PrincipleCard num="Principle 5" title="Don't complicate it until you've mastered the basics">
        Meal timing, detailed macro tracking, supplements, intermittent fasting. None of them matter until you have mastered eating enough protein, eating consistently, and staying hydrated. Build the foundation before you add complexity. The same principle that applies to your training applies here too.
      </PrincipleCard>

      {/* WHAT'S NEXT */}
      <div
        id="next"
        style={{ textAlign: "center", padding: "4rem 0", borderTop: `1px solid ${border}`, maxWidth: 600, margin: "3rem auto 0" }}
      >
        <h2
          style={{
            fontFamily: "var(--font-cormorant), serif",
            fontSize: "clamp(2rem, 5vw, 3.5rem)",
            fontWeight: 300,
            color: cream,
            marginBottom: "1.5rem",
            lineHeight: 1.2,
          }}
        >
          You finished.<br />
          <em>That&apos;s already more<br />than most people do.</em>
        </h2>
        <p style={{ fontSize: "0.9rem", color: "#888", lineHeight: 1.5, marginBottom: "1rem" }}>
          A lot of people buy guides and never open them. You not only opened this one, you worked through it. You now understand how to move well, why your glutes and core matter more than most people realize, how to structure your training, and how to fuel it. That foundation took most coaches years to learn. You built it in four weeks.
        </p>
        <p style={{ fontSize: "0.9rem", color: "#888", lineHeight: 1.5, marginBottom: "1rem" }}>
          Everything you do from here will be better because of it.
        </p>

        <div style={{ marginTop: "1rem", padding: "2rem", background: "#161616", border: `1px solid ${border}`, textAlign: "left" }}>
          <SectionLabel>Follow along on Instagram and TikTok</SectionLabel>
          <p style={{ fontSize: "0.88rem", color: "#888", marginBottom: "0.75rem" }}>
            Weekly form breakdowns, training tips, and honest content built on the same principles in this guide. That is also where you will hear about everything coming next first, including the program that picks up exactly where this one leaves off.
          </p>
          <div style={{ fontSize: "0.8rem", fontWeight: 500, letterSpacing: "0.2em", color: gold }}>@lisafitmethod</div>
        </div>

        <div style={{ marginTop: "1rem", padding: "2rem", background: "#161616", border: `1px solid ${border}`, textAlign: "left" }}>
          <SectionLabel>Questions or want more structure?</SectionLabel>
          <p style={{ fontSize: "0.88rem", color: "#888" }}>
            DM me at @lisafitmethod on Instagram or TikTok. I read everything.
          </p>
        </div>

        <p style={{ marginTop: "2rem", fontSize: "0.88rem", color: "#888" }}>
          Thank you for trusting me with your training. Now go do the work.
        </p>
        <div
          style={{
            fontFamily: "var(--font-cormorant), serif",
            fontStyle: "italic",
            fontSize: "1.5rem",
            color: cream,
            marginTop: "2.5rem",
          }}
        >
          Lisa McPherson
        </div>
      </div>

      <div style={{ display: "flex", gap: "1rem", marginTop: "3rem", paddingTop: "2rem", borderTop: `1px solid ${border}` }}>
        <Link href="/training-foundations/module3" style={{ display: "inline-block", background: "none", color: gold, border: `1px solid ${gold}`, padding: "0.85rem 2rem", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", textDecoration: "none", fontFamily: "var(--font-montserrat), sans-serif" }}>
          ← Module 3
        </Link>
      </div>
    </div>
  )
}
