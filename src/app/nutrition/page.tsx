import Link from "next/link"
import { fetchSiteSettings } from "@/lib/siteSettings"
import {
  NUTRITION_COURSE_PRICE_DISPLAY,
  NUTRITION_COURSE_REGULAR_PRICE_DISPLAY,
  BUNDLE_PRICE_DISPLAY,
  BUNDLE_INDIVIDUAL_TOTAL_DISPLAY,
  BUNDLE_SAVINGS_DISPLAY,
  FOUNDING_DATE,
} from "@/lib/pricing"
import type { Metadata } from "next"

export const revalidate = 60

export const metadata: Metadata = {
  title: "Nutrition Foundations — Lisa Fit Method",
  description:
    "A 4-week nutrition course for people who train. Personalized TDEE calculator, a science-backed meal plan that adapts to your calorie target, real verified recipes, and habits that stick. One-time payment, yours forever.",
  openGraph: {
    title: "Nutrition Foundations — Lisa Fit Method",
    description: "A 4-week nutrition course for people who train. $77 one-time, yours forever.",
    images: [{ url: "/hero.png", width: 1200, height: 800 }],
  },
}

const MODULES = [
  {
    num: "01",
    tag: "Module 1",
    title: "Understanding Your Body",
    desc: "Learn what BMR and TDEE actually mean, use the interactive calculator to get your personalized calorie target, and understand how your goal changes everything.",
    items: [
      "Interactive TDEE calculator — Mifflin-St Jeor formula",
      "Personalized daily calorie target based on your stats and goal",
      "Training day vs. rest day calorie strategy",
      "Macro targets: protein, fat, and carbs in grams",
      "Save your profile — your meal plan adapts to your numbers",
    ],
  },
  {
    num: "02",
    tag: "Module 2",
    title: "Your Nutrition Blueprint",
    desc: "Protein first, carbs timed around training, fats from the right sources. Learn how to actually build a plate — and stop guessing.",
    items: [
      "Protein targets and the best food sources ranked",
      "Carbohydrate timing for training and recovery",
      "Essential fats and omega-3 for muscle and health",
      "The plate-building method: simple and repeatable",
      "Hydration targets and practical tracking guidance",
    ],
  },
  {
    num: "03",
    tag: "Module 3",
    title: "Your 4-Week Meal Plan",
    desc: "A full four-week plan with real recipes from verified sources. Portions adapt to your saved calorie target. Grocery lists and meal prep included.",
    items: [
      "Week 1–2: habit-building rotation with 9 core recipes",
      "Week 3–4: introduces variety while keeping things simple",
      "Every recipe attributed with source links and verified macros",
      "Grocery list by week — organized for efficient shopping",
      "Sunday and Wednesday meal prep guides",
    ],
  },
  {
    num: "04",
    tag: "Module 4",
    title: "Making It Stick",
    desc: "The strategies that keep nutrition working outside controlled conditions — restaurants, social situations, plateaus, and what to do when the scale isn't moving.",
    items: [
      "Ordering guide for Mexican, Italian, sushi, and fast food",
      "Social situations, alcohol strategy, and morning-after reset",
      "Troubleshooting: plateau, losing too fast, constant hunger",
      "Evidence-based supplements: creatine, protein powder, D3",
      "Pre and post-workout nutrition for training performance",
    ],
  },
]

const FAQS = [
  {
    q: "Do I need to be already training to take this course?",
    a: "No — but it's designed for people who are training or planning to. The meal plan and calorie targets are built around activity levels, so they work best when you have a training routine in place (or are building one).",
  },
  {
    q: "Is the meal plan personalized to my specific numbers?",
    a: "Yes. Module 1 has an interactive TDEE calculator that generates your personal calorie and macro targets. When you save your profile, the Module 3 meal plan automatically scales all portions and daily totals to your target — not a generic number.",
  },
  {
    q: "Are the recipes invented or sourced?",
    a: "Every recipe is sourced from established food and nutrition creators, with full attribution and clickable links to the original. Macros are calculated from actual ingredients — nothing is made up or approximated loosely.",
  },
  {
    q: "I'm not a nutritionist — is this too advanced?",
    a: "It's written for someone with no nutrition background. Every concept is explained simply, with the science cited so you can go deeper if you want. The goal is practical and usable, not academic.",
  },
  {
    q: "Does this replace seeing a dietitian?",
    a: "No. Lisa is a Certified Personal Trainer, not a Registered Dietitian. This course provides general nutrition education for fitness and performance goals. If you have a medical condition, medications, or history of eating disorders, work with a licensed healthcare provider.",
  },
  {
    q: "Can I use this alongside Training Foundations?",
    a: "Absolutely — that's the intent. The two courses are designed to complement each other. Module 4 covers how to time your nutrition around your training sessions.",
  },
]

export default async function NutritionPage() {
  const settings = await fetchSiteSettings()
  const accent = settings.colors.accent
  const hs = settings.typography.headingScale
  const bs = settings.typography.bodyScale

  return (
    <main style={{ background: "#faf8f5", color: "#1a1a1a", fontFamily: "var(--font-dm-sans), sans-serif", overflowX: "hidden" }}>
      <style>{`
        :root {
          --black: #0a0a0a; --off-white: #f5f2ee; --warm-white: #faf8f5;
          --accent: ${accent}; --accent-dark: #a8895e; --text: #1a1a1a; --muted: #6b6560;
          --heading-scale: ${hs}; --body-scale: ${bs};
        }
      `}</style>

      {/* HERO */}
      <section style={{ background: "#0a0a0a", padding: "120px 80px 100px" }} className="nutrition-hero">
        <style>{`
          .nutrition-hero-inner {
            max-width: 1100px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 80px;
            align-items: start;
          }
          @media (max-width: 768px) {
            .nutrition-hero { padding: 80px 24px 72px !important; }
            .nutrition-hero-inner { grid-template-columns: 1fr; gap: 40px; }
          }
        `}</style>
        <div className="nutrition-hero-inner">
          <div>
            <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: accent, marginBottom: 20 }}>
              Lisa Fit Method
            </p>
            <h1 style={{ fontFamily: "var(--font-playfair), serif", fontSize: `calc(clamp(44px, 5vw, 72px) * ${hs})`, fontWeight: 900, color: "#f5f2ee", lineHeight: 1.05, marginBottom: 24 }}>
              Nutrition<br />
              <em style={{ fontStyle: "italic", color: accent }}>Foundations.</em>
            </h1>
            <p style={{ fontSize: `calc(17px * ${bs})`, color: "rgba(245,242,238,0.6)", lineHeight: 1.5, maxWidth: 520, marginBottom: 32 }}>
              A 4-week nutrition course built for people who train. Personalized to your body. Grounded in research. Practical enough to actually use.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link href="#modules" style={{ display: "inline-block", border: `1px solid ${accent}`, color: accent, fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 12, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none", padding: "14px 28px" }}>
                Explore the Modules
              </Link>
            </div>
          </div>
          <div style={{ minWidth: 200 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 18, color: "rgba(245,242,238,0.3)", textDecoration: "line-through", fontFamily: "var(--font-dm-sans), sans-serif" }}>{NUTRITION_COURSE_REGULAR_PRICE_DISPLAY}</span>
              <span style={{ fontSize: 56, fontWeight: 700, color: accent, fontFamily: "var(--font-dm-sans), sans-serif", lineHeight: 1 }}>{NUTRITION_COURSE_PRICE_DISPLAY}</span>
              <span style={{ fontSize: 10, color: "#0a0a0a", background: accent, padding: "5px 10px", fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>Founding Price</span>
            </div>
            <p style={{ fontSize: 11, color: "rgba(245,242,238,0.3)", fontFamily: "var(--font-dm-sans), sans-serif", lineHeight: 1.4, marginBottom: 16 }}>Regular {NUTRITION_COURSE_REGULAR_PRICE_DISPLAY} from {FOUNDING_DATE}</p>
            <Link href="/checkout?product=nutrition" style={{ display: "block", background: accent, color: "#0a0a0a", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none", padding: "20px 32px", textAlign: "center", marginBottom: 14 }}>
              Get Instant Access
            </Link>
            <p style={{ fontSize: 11, color: "rgba(245,242,238,0.3)", fontFamily: "var(--font-dm-sans), sans-serif", lineHeight: 1.6, textAlign: "center" }}>
              One-time payment · Lifetime access<br />No subscription · No recurring fees
            </p>
          </div>
        </div>
      </section>

      {/* WHAT YOU GET — 3 callouts */}
      <section style={{ background: "#111111", padding: "0" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0 }} className="callout-grid">
          <style>{`
            .callout-grid { @media (max-width: 640px) { grid-template-columns: 1fr !important; } }
          `}</style>
          {[
            { label: "Personalized Calculator", body: "Your TDEE, macro targets, and training-day vs. rest-day calories — calculated for your body and your goal." },
            { label: "Real Recipes, Real Sources", body: "9 verified recipes from established creators, attributed with links. Portions scale automatically to your calorie target." },
            { label: "Science, Not Guesswork", body: "Every recommendation is backed by cited research — Morton 2018, Burke 2011, Smith 2011, and more." },
          ].map((item) => (
            <div key={item.label} style={{ padding: "48px 40px", borderRight: "1px solid #1a1a1a", borderBottom: "1px solid #1a1a1a" }}>
              <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: 18, fontWeight: 700, color: "#f5f2ee", marginBottom: 12, lineHeight: 1.3 }}>{item.label}</p>
              <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 13, color: "rgba(245,242,238,0.45)", lineHeight: 1.6 }}>{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* MODULES */}
      <section id="modules" style={{ background: "#0a0a0a", padding: "80px 80px 120px" }} className="nutrition-modules">
        <style>{`
          @media (max-width: 768px) { .nutrition-modules { padding: 60px 24px 80px !important; } .nutrition-modules-grid { grid-template-columns: 1fr !important; } }
        `}</style>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ borderBottom: "1px solid rgba(245,242,238,0.08)", paddingBottom: 40, marginBottom: 48 }}>
            <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: accent, marginBottom: 16 }}>What&apos;s inside</p>
            <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: `calc(clamp(32px, 3vw, 48px) * ${hs})`, fontWeight: 700, color: "#f5f2ee", lineHeight: 1.1 }}>
              Four modules. <em style={{ fontStyle: "italic", color: accent }}>One real system.</em>
            </h2>
          </div>
          <div className="nutrition-modules-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2, background: "rgba(245,242,238,0.04)" }}>
            {MODULES.map((mod) => (
              <div key={mod.num} style={{ background: "#0a0a0a", padding: "48px 40px", position: "relative" }}>
                <span style={{ fontFamily: "var(--font-playfair), serif", fontSize: 64, fontWeight: 900, color: "rgba(200,169,126,0.08)", position: "absolute", top: 24, right: 32, lineHeight: 1 }}>
                  {mod.num}
                </span>
                <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", color: accent, marginBottom: 14 }}>{mod.tag}</p>
                <h3 style={{ fontFamily: "var(--font-playfair), serif", fontSize: `calc(22px * ${hs})`, fontWeight: 700, color: "#f5f2ee", marginBottom: 14, lineHeight: 1.3 }}>{mod.title}</h3>
                <p style={{ fontSize: `calc(13px * ${bs})`, lineHeight: 1.5, color: "rgba(245,242,238,0.4)", marginBottom: 20 }}>{mod.desc}</p>
                <ul style={{ listStyle: "none" }}>
                  {mod.items.map((item) => (
                    <li key={item} style={{ fontSize: `calc(12px * ${bs})`, color: "rgba(245,242,238,0.35)", padding: "5px 0 5px 16px", position: "relative", lineHeight: 1.5 }}>
                      <span style={{ position: "absolute", left: 0, color: accent, fontSize: 11 }}>→</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section style={{ background: "#faf8f5", padding: "120px 80px" }} className="nutrition-for">
        <style>{`
          @media (max-width: 768px) { .nutrition-for { padding: 80px 24px !important; } .nutrition-for-grid { grid-template-columns: 1fr !important; gap: 48px !important; } }
        `}</style>
        <div className="nutrition-for-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, maxWidth: 1100, margin: "0 auto" }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: "#a8895e", marginBottom: 16 }}>Is this for me?</p>
            <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: `calc(clamp(32px, 3.5vw, 46px) * ${hs})`, fontWeight: 700, color: "#0a0a0a", lineHeight: 1.1, marginBottom: 32 }}>
              This is for you <em style={{ fontStyle: "italic", color: "#a8895e" }}>if you&apos;re serious.</em>
            </h2>
            <ul style={{ listStyle: "none" }}>
              {[
                "You train consistently but your diet doesn't match your effort",
                "You don't know how many calories you actually need",
                "You've tried tracking food but gave up because it felt too complicated",
                "You want a meal plan that's built around real food, not a list of restrictions",
                "You eat well at home but fall apart eating out or on weekends",
                "You want to understand the why, not just follow a plan blindly",
              ].map((item) => (
                <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 0", borderBottom: "1px solid rgba(0,0,0,0.06)", fontSize: `calc(14px * ${bs})`, color: "#1a1a1a", lineHeight: 1.5 }}>
                  <span style={{ color: "#a8895e", fontWeight: 700, flexShrink: 0 }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div style={{ paddingTop: 60 }}>
            <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: "#a8895e", marginBottom: 16 }}>Pair it with</p>
            <h3 style={{ fontFamily: "var(--font-playfair), serif", fontSize: `calc(26px * ${hs})`, fontWeight: 700, color: "#0a0a0a", marginBottom: 20, lineHeight: 1.2 }}>
              Train smarter with<br /><em style={{ fontStyle: "italic", color: "#a8895e" }}>Training Foundations.</em>
            </h3>
            <p style={{ fontSize: `calc(14px * ${bs})`, color: "#1a1a1a", lineHeight: 1.6, marginBottom: 16 }}>
              Nutrition Foundations pairs perfectly with Training Foundations — a 4-week beginner strength training program covering the five foundational movements with built-in workout tracking and progressive overload guidance.
            </p>
            <p style={{ fontSize: `calc(13px * ${bs})`, color: "#6b6560", lineHeight: 1.5, marginBottom: 28 }}>
              Together, they give you a training system and a nutrition system that are designed to work alongside each other.
            </p>
            <Link href="/courses" style={{ display: "inline-block", border: "2px solid #a8895e", color: "#a8895e", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none", padding: "16px 32px" }}>
              Explore Training Foundations →
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ background: "#f5f2ee", padding: "100px 80px" }} className="nutrition-faq">
        <style>{`
          @media (max-width: 768px) { .nutrition-faq { padding: 72px 24px !important; } }
        `}</style>
        <div style={{ maxWidth: 780, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: "#a8895e", marginBottom: 16 }}>Questions</p>
          <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: `calc(clamp(28px, 3vw, 42px) * ${hs})`, fontWeight: 700, color: "#0a0a0a", marginBottom: 48, lineHeight: 1.15 }}>
            Common questions.
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {FAQS.map((faq) => (
              <div key={faq.q} style={{ padding: "28px 0", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
                <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: `calc(17px * ${hs})`, fontWeight: 600, color: "#0a0a0a", marginBottom: 12, lineHeight: 1.35 }}>
                  {faq.q}
                </p>
                <p style={{ fontSize: `calc(14px * ${bs})`, color: "#6b6560", lineHeight: 1.6 }}>
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DISCLAIMER */}
      <section style={{ background: "#f5f2ee", padding: "0 80px 80px" }} className="nutrition-disclaimer-section">
        <style>{`
          @media (max-width: 768px) { .nutrition-disclaimer-section { padding: 0 24px 60px !important; } }
        `}</style>
        <div style={{ maxWidth: 780, margin: "0 auto", background: "rgba(0,0,0,0.04)", padding: "24px 28px" }}>
          <p style={{ fontSize: 11, color: "#6b6560", lineHeight: 1.7 }}>
            <strong style={{ color: "#1a1a1a" }}>Disclaimer:</strong> Lisa McPherson is a NASM Certified Personal Trainer, not a Registered Dietitian or licensed medical professional. This course provides general nutrition education for fitness and performance goals — not medical nutrition therapy. It does not replace advice from a healthcare provider. Individual results vary. Always consult your physician before starting a new nutrition plan, especially if you have a medical condition, take medications, or have a history of eating disorders.
          </p>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ background: "#0a0a0a", padding: "120px 80px", textAlign: "center", position: "relative", overflow: "hidden" }} className="nutrition-final-cta">
        <style>{`
          @media (max-width: 768px) { .nutrition-final-cta { padding: 80px 24px !important; } }
        `}</style>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 700, height: 700, background: "radial-gradient(circle, rgba(200,169,126,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
        <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: accent, marginBottom: 20, position: "relative", zIndex: 1 }}>Ready to start?</p>
        <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: `calc(clamp(38px, 4.5vw, 60px) * ${hs})`, fontWeight: 900, color: "#f5f2ee", lineHeight: 1.1, marginBottom: 12, position: "relative", zIndex: 1 }}>
          Eat to match<br />
          <em style={{ fontStyle: "italic", color: accent }}>your training.</em>
        </h2>
        <p style={{ fontSize: `calc(15px * ${bs})`, color: "rgba(245,242,238,0.45)", maxWidth: 440, margin: "0 auto 40px", lineHeight: 1.5, position: "relative", zIndex: 1 }}>
          Four modules. A personalized calculator. A full meal plan. Everything you need to stop guessing and start eating with intention.
        </p>
        <div style={{ position: "relative", zIndex: 1, display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
          <span style={{ display: "inline-block", fontSize: 10, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#0a0a0a", background: accent, padding: "6px 16px", marginBottom: 20, fontFamily: "var(--font-dm-sans), sans-serif" }}>Founding Member Price</span>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 20, color: "rgba(245,242,238,0.3)", textDecoration: "line-through", fontFamily: "var(--font-dm-sans), sans-serif" }}>{NUTRITION_COURSE_REGULAR_PRICE_DISPLAY}</span>
            <span style={{ fontSize: 64, fontWeight: 700, color: accent, fontFamily: "var(--font-dm-sans), sans-serif", lineHeight: 1 }}>{NUTRITION_COURSE_PRICE_DISPLAY}</span>
          </div>
          <p style={{ fontSize: 12, color: "rgba(245,242,238,0.25)", fontFamily: "var(--font-dm-sans), sans-serif", marginBottom: 28 }}>Regular {NUTRITION_COURSE_REGULAR_PRICE_DISPLAY} from {FOUNDING_DATE}</p>
          <Link href="/checkout?product=nutrition" style={{ display: "inline-block", background: accent, color: "#0a0a0a", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none", padding: "20px 72px", marginBottom: 16 }}>
            Get Instant Access
          </Link>
          <p style={{ fontSize: 13, color: "rgba(245,242,238,0.35)", fontFamily: "var(--font-dm-sans), sans-serif", marginBottom: 40 }}>
            One-time payment · <strong style={{ color: "rgba(245,242,238,0.55)", fontWeight: 500 }}>Lifetime access</strong> · No subscription
          </p>
          <div style={{ paddingTop: 32, borderTop: "1px solid rgba(245,242,238,0.06)", width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <p style={{ fontSize: 11, color: "rgba(245,242,238,0.25)", fontFamily: "var(--font-dm-sans), sans-serif", letterSpacing: "0.1em", textTransform: "uppercase" }}>Better together</p>
            <div style={{ background: "#1a1208", padding: "20px 28px", width: "100%", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
              <div>
                <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: accent, marginBottom: 4, fontFamily: "var(--font-dm-sans), sans-serif" }}>Foundations Bundle</p>
                <p style={{ fontSize: 12, color: "rgba(245,242,238,0.4)", fontFamily: "var(--font-dm-sans), sans-serif" }}>Nutrition + Training Foundations · Save {BUNDLE_SAVINGS_DISPLAY} vs. {BUNDLE_INDIVIDUAL_TOTAL_DISPLAY} individual</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 28, fontWeight: 700, color: accent, fontFamily: "var(--font-dm-sans), sans-serif" }}>{BUNDLE_PRICE_DISPLAY}</span>
                <Link href="/checkout?product=bundle" style={{ display: "inline-block", background: accent, color: "#0a0a0a", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none", padding: "12px 24px", whiteSpace: "nowrap" }}>Get Both Courses</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
