import Link from "next/link"
import type { Metadata } from "next"
import CrossSellShelf from "@/components/CrossSellShelf.client"

export const metadata: Metadata = {
  title: "Introduction: Nutrition Foundations | Lisa Fit Method",
}

const gold = "#c9a96e"
const cream = "#f0e6d3"
const muted = "#b0a090"
const dark = "#161616"
const border = "#2a2a2a"

const MODULES = [
  { num: "01", href: "/nutrition-foundations/module1", title: "Understanding Your Body", desc: "Calculate your BMR and TDEE so you understand how many calories your body actually needs on both training and rest days." },
  { num: "02", href: "/nutrition-foundations/module2", title: "Your Nutrition Blueprint", desc: "Learn how protein, carbohydrates, and fats work together to support muscle growth, recovery, energy, and fat loss without obsessing over perfection." },
  { num: "03", href: "/nutrition-foundations/module3", title: "Your 4-Week Meal Plan", desc: "A personalized meal plan built around your calorie target, including verified recipes, grocery lists, meal prep guidance, and portion adjustments based on your needs." },
  { num: "04", href: "/nutrition-foundations/module4", title: "Making It Stick", desc: "Learn how to handle eating out, social events, cravings, supplements, plateaus, travel, and real life without constantly starting over." },
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
        Nutrition is not complicated.<br /><em style={{ color: gold }}>The industry makes it seem complicated.</em>
      </h1>

      <div style={{ marginBottom: "2rem" }}>
        <p style={{ fontSize: "0.9rem", color: muted, lineHeight: 1.65 }}>
          Most of the confusion comes from people trying to sell shortcuts, extremes, or rules that sound more impressive than the actual fundamentals.
        </p>
        <br />
        <p style={{ fontSize: "0.9rem", color: muted, lineHeight: 1.65 }}>
          I&apos;m a Certified Personal Trainer, not a dietitian. But after years of struggling to understand why some approaches worked and others didn&apos;t, I went back to the research and focused on the actual mechanisms behind fat loss, muscle growth, energy balance, and long-term body composition.
        </p>
        <br />
        <p style={{ fontSize: "0.9rem", color: muted, lineHeight: 1.65 }}>
          This course is built to simplify all of that. You&apos;ll learn how your body actually uses energy, how to calculate the numbers that matter for your goals, and how to structure nutrition in a way that is realistic, sustainable, and effective long term.
        </p>
        <br />
        <p style={{ fontSize: "0.9rem", color: muted, lineHeight: 1.65 }}>
          Inside, you&apos;ll find a 4-week meal plan built around your personal calorie needs, not a generic template copied onto everyone. The recipes come from verified, well-reviewed sources, and every recipe is linked so you can check the originals yourself. The macros are calculated from the actual ingredients used. Nothing is guessed or invented.
        </p>
        <br />
        <p style={{ fontSize: "0.9rem", color: muted, lineHeight: 1.65 }}>
          The goal is not to make you obsessed with tracking every calorie forever. The goal is to help you finally understand what works, why it works, and how to build habits you can realistically maintain.
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
          Lisa McPherson is a Certified Personal Trainer (CPT), not a Registered Dietitian or licensed medical professional. This course provides general nutrition education designed to support fitness, performance, and body composition goals. It is not medical nutrition therapy and should not replace advice from a qualified healthcare provider. Always consult your physician before making major dietary changes, especially if you have a medical condition, take medications, are pregnant, or have a history of disordered eating or eating disorders. Individual results will vary based on consistency, activity level, sleep, stress, genetics, medical history, and overall lifestyle factors.
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
            "Start with Module 1 and complete the TDEE calculator first. Your meal plan in Module 3 is built around those results.",
            "Read Module 2 before jumping into the meal plan so you understand the reasoning behind the structure.",
            "Save your profile in Module 1 before using Module 3 so your personalized portions calculate correctly.",
            "Most people focus only on the meal plan and skip Module 4. Don't. Sustainability is what actually creates long-term results.",
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
