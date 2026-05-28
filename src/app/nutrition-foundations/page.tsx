import Link from "next/link"
import type { Metadata } from "next"
import CrossSellShelf from "@/components/CrossSellShelf.client"

export const metadata: Metadata = {
  title: "Introduction — Nutrition Foundations | Lisa Fit Method",
}

const gold = "#c9a96e"
const cream = "#f0e6d3"
const muted = "#b0a090"
const dark = "#161616"
const border = "#2a2a2a"

const MODULES = [
  { num: "01", href: "/nutrition-foundations/module1", title: "Understanding Your Body", desc: "Calculate your BMR and TDEE. Know exactly how many calories you need — on training days and rest days." },
  { num: "02", href: "/nutrition-foundations/module2", title: "Your Nutrition Blueprint", desc: "Protein, carbs, and fats explained clearly. Build a plate that supports your goals without obsessing over every gram." },
  { num: "03", href: "/nutrition-foundations/module3", title: "Your 4-Week Meal Plan", desc: "A personalised meal plan built around your calorie target. Real verified recipes, weekly grocery lists, and meal prep guides." },
  { num: "04", href: "/nutrition-foundations/module4", title: "Making It Stick", desc: "Eating out, social situations, supplements, troubleshooting plateaus, and how to keep going when life gets in the way." },
]

export default function NutritionIntroPage() {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "3rem 2.5rem 6rem" }} className="course-body">
      <style>{`
        @media (max-width: 768px) { .course-body { padding: 2rem 1rem 6rem !important; } }
      `}</style>

      <p style={{ fontSize: "0.65rem", fontWeight: 500, letterSpacing: "0.3em", textTransform: "uppercase", color: gold, marginBottom: "0.75rem", fontFamily: "var(--font-montserrat), sans-serif" }}>
        Introduction
      </p>
      <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 300, color: cream, lineHeight: 1.2, marginBottom: "1.5rem" }}>
        Nutrition is not complicated.<br /><em style={{ color: gold }}>The industry makes it complicated.</em>
      </h1>

      <div style={{ marginBottom: "2rem" }}>
        <p style={{ fontSize: "0.9rem", color: muted, lineHeight: 1.65 }}>
          I&apos;m a Certified Personal Trainer, not a dietitian. But I&apos;ve spent years researching what the actual science says about nutrition and body composition — and stripping away everything the industry adds to make it confusing.
        </p>
        <br />
        <p style={{ fontSize: "0.9rem", color: muted, lineHeight: 1.65 }}>
          This course gives you the real mechanism. How your body uses energy, what your numbers actually mean, and a 4-week meal plan built specifically around your calorie needs — not a generic plan, yours.
        </p>
        <br />
        <p style={{ fontSize: "0.9rem", color: muted, lineHeight: 1.65 }}>
          The recipes in the meal plan come from verified, well-reviewed sources. I&apos;ve linked every one so you can check them yourself. The macros are calculated from the actual ingredients. Nothing is invented.
        </p>
        <br />
        <p style={{ fontFamily: "var(--font-cormorant), serif", fontStyle: "italic", fontSize: "1.1rem", color: cream }}>
          Lisa McPherson, CPT
        </p>
      </div>

      {/* Legal disclaimer */}
      <div style={{ background: dark, border: `1px solid ${border}`, borderLeft: `3px solid #444`, padding: "1rem 1.25rem", marginBottom: "2.5rem" }}>
        <p style={{ fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#555", marginBottom: "0.5rem", fontFamily: "var(--font-montserrat), sans-serif" }}>
          Important notice
        </p>
        <p style={{ fontSize: "0.78rem", color: "#888", lineHeight: 1.6, margin: 0, fontFamily: "var(--font-montserrat), sans-serif" }}>
          Lisa McPherson is a Certified Personal Trainer (CPT), not a Registered Dietitian or licensed medical professional. This course provides general nutrition education to support fitness and performance goals — it is not medical nutrition therapy and does not replace advice from a healthcare provider. Always consult your physician before starting a new nutrition plan, especially if you have a medical condition, take medications, or have a history of eating disorders. Individual results vary.
        </p>
      </div>

      {/* Module overview */}
      <p style={{ fontSize: "0.65rem", fontWeight: 500, letterSpacing: "0.3em", textTransform: "uppercase", color: gold, marginBottom: "1rem", fontFamily: "var(--font-montserrat), sans-serif" }}>
        What&apos;s inside
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: "2.5rem" }}>
        {MODULES.map((mod) => (
          <Link
            key={mod.num}
            href={mod.href}
            style={{ textDecoration: "none", display: "flex", gap: 20, padding: "1.25rem 1.5rem", background: dark, border: `1px solid ${border}`, transition: "border-color 0.2s" }}
          >
            <span style={{ fontFamily: "var(--font-cormorant), serif", fontSize: 40, fontWeight: 300, color: "rgba(201,169,110,0.15)", lineHeight: 1, flexShrink: 0, width: 40 }}>
              {mod.num}
            </span>
            <div>
              <p style={{ fontSize: "0.8rem", fontWeight: 600, color: cream, marginBottom: "0.3rem", fontFamily: "var(--font-montserrat), sans-serif" }}>
                {mod.title}
              </p>
              <p style={{ fontSize: "0.75rem", color: "#666", lineHeight: 1.55, margin: 0, fontFamily: "var(--font-montserrat), sans-serif" }}>
                {mod.desc}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* How to use */}
      <div style={{ padding: "2rem", background: dark, border: `1px solid ${border}`, marginBottom: "2rem" }}>
        <p style={{ fontSize: "0.65rem", fontWeight: 500, letterSpacing: "0.3em", textTransform: "uppercase", color: gold, marginBottom: "0.75rem", fontFamily: "var(--font-montserrat), sans-serif" }}>
          How to use this course
        </p>
        <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.6rem", margin: 0, padding: 0 }}>
          {[
            "Start with Module 1 and fill in the TDEE calculator — your meal plan in Module 3 is built around your results",
            "Read Module 2 before opening the meal plan so you understand what you're doing and why",
            "Module 3 shows your personalised portions — save your profile in Module 1 first",
            "Module 4 is the one most people skip — don't",
          ].map((item) => (
            <li key={item} style={{ fontSize: "0.82rem", color: muted, lineHeight: 1.45, paddingLeft: "1.25rem", position: "relative" }}>
              <span style={{ position: "absolute", left: 0, color: gold, opacity: 0.6, fontSize: "0.75rem" }}>›</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <Link
        href="/nutrition-foundations/module1"
        style={{
          display: "inline-block",
          background: gold,
          color: "#0a0a0a",
          padding: "0.85rem 2rem",
          fontSize: "0.7rem",
          fontWeight: 600,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          textDecoration: "none",
          fontFamily: "var(--font-montserrat), sans-serif",
        }}
      >
        Start Module 1 →
      </Link>

      <CrossSellShelf currentProduct="nutrition" />
    </div>
  )
}
