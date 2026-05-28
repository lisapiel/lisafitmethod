"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import RecipeCard from "@/components/nutrition/RecipeCard"
import MealPlanDay, { type DayPlan } from "@/components/nutrition/MealPlanDay"
import { RECIPES } from "@/lib/nutritionRecipes"

const gold = "#c9a96e"
const goldDeep = "#a8895e"
const cream = "#f0e6d3"
const muted = "#b0a090"
const dark = "#161616"
const border = "#2a2a2a"

// 4-week plan using the verified recipe set
// Weeks 1+2: habit-building with consistent, simple meals
// Weeks 3+4: introduce variety while keeping structure

const WEEK_1_2: DayPlan[] = [
  { day: "Monday", breakfast: RECIPES.cottageCheesEggs, lunch: RECIPES.chickenSalad, dinner: RECIPES.beefBroccoli, snack: RECIPES.cottageCheeseBowl },
  { day: "Tuesday", breakfast: RECIPES.overnightOats, lunch: RECIPES.tunaSalad, dinner: RECIPES.turkeyMeatballs, snack: RECIPES.cottageCheeseBowl },
  { day: "Wednesday", breakfast: RECIPES.cottageCheesEggs, lunch: RECIPES.mediterraneanBowl, dinner: RECIPES.salmon, snack: RECIPES.cottageCheeseBowl },
  { day: "Thursday", breakfast: RECIPES.overnightOats, lunch: RECIPES.chickenSalad, dinner: RECIPES.beefBroccoli, snack: RECIPES.cottageCheeseBowl },
  { day: "Friday", breakfast: RECIPES.cottageCheesEggs, lunch: RECIPES.tunaSalad, dinner: RECIPES.salmon, snack: RECIPES.cottageCheeseBowl },
  { day: "Saturday", breakfast: RECIPES.overnightOats, lunch: RECIPES.mediterraneanBowl, dinner: RECIPES.turkeyMeatballs, snack: RECIPES.cottageCheeseBowl },
  { day: "Sunday", breakfast: RECIPES.cottageCheesEggs, lunch: RECIPES.chickenSalad, dinner: RECIPES.beefBroccoli, snack: RECIPES.cottageCheeseBowl },
]

const WEEK_3_4: DayPlan[] = [
  { day: "Monday", breakfast: RECIPES.overnightOats, lunch: RECIPES.mediterraneanBowl, dinner: RECIPES.turkeyMeatballs, snack: RECIPES.cottageCheeseBowl },
  { day: "Tuesday", breakfast: RECIPES.cottageCheesEggs, lunch: RECIPES.tunaSalad, dinner: RECIPES.salmon, snack: RECIPES.cottageCheeseBowl },
  { day: "Wednesday", breakfast: RECIPES.overnightOats, lunch: RECIPES.chickenSalad, dinner: RECIPES.beefBroccoli, snack: RECIPES.cottageCheeseBowl },
  { day: "Thursday", breakfast: RECIPES.cottageCheesEggs, lunch: RECIPES.mediterraneanBowl, dinner: RECIPES.salmon, snack: RECIPES.cottageCheeseBowl },
  { day: "Friday", breakfast: RECIPES.overnightOats, lunch: RECIPES.tunaSalad, dinner: RECIPES.turkeyMeatballs, snack: RECIPES.cottageCheeseBowl },
  { day: "Saturday", breakfast: RECIPES.cottageCheesEggs, lunch: RECIPES.chickenSalad, dinner: RECIPES.beefBroccoli, snack: RECIPES.cottageCheeseBowl },
  { day: "Sunday", breakfast: RECIPES.overnightOats, lunch: RECIPES.mediterraneanBowl, dinner: RECIPES.salmon, snack: RECIPES.cottageCheeseBowl },
]

const GROCERY_LIST_W12 = [
  { category: "Protein", items: ["Chicken breast (2–3 lbs)", "93/7 lean ground beef (1.5 lbs)", "93% lean ground turkey (1 lb)", "Canned tuna in water (4–5 cans)", "Salmon fillets (2 x 6oz)", "Eggs (1 dozen)", "Low-fat cottage cheese (32oz)", "Plain Greek yogurt (32oz, 2%)"] },
  { category: "Carbs & Veg", items: ["Rolled oats (1 large container)", "Broccoli (2–3 heads or 2 bags frozen)", "Asparagus (1 bunch)", "Cherry tomatoes (1 pint)", "Cucumber (2)", "Mixed greens (1 bag)", "Red onion (1)", "Bell peppers (2–3)"] },
  { category: "Pantry & Extras", items: ["Coconut aminos or low-sodium soy sauce", "Hoisin sauce", "Dijon mustard", "Fresh lemons (4)", "Dill (fresh or dried)", "Italian seasoning", "Garlic (1 head)", "Fresh ginger", "Parmesan (small wedge)", "Almond flour (small bag)", "Marinara sauce (1 jar)", "Berries for cottage cheese bowls", "Chia seeds"] },
]

const GROCERY_LIST_W34 = [
  { category: "Protein", items: ["Chicken breast (2 lbs)", "Salmon fillets (4 x 6oz)", "93/7 lean ground beef (1.5 lbs)", "93% lean ground turkey (1 lb)", "Canned tuna in water (3 cans)", "Eggs (1 dozen)", "Low-fat cottage cheese (32oz)", "Plain Greek yogurt (32oz, 2%)"] },
  { category: "Carbs & Veg", items: ["Quinoa (1 bag)", "Broccoli (2 heads or 2 bags frozen)", "Asparagus (2 bunches)", "Cherry tomatoes (1 pint)", "Cucumber (2)", "Mixed greens (1 bag)", "Celery (1 bunch)", "Red onion (1)"] },
  { category: "Pantry & Extras", items: ["Tzatziki sauce", "Oregano (dried)", "Honey (small jar)", "Low-sodium soy sauce", "Coconut aminos", "Fresh lemons (4)", "Marinara sauce (1 jar)", "Parmesan", "Almond flour", "Berries", "Rolled oats (if running low)"] },
]

// Average base kcal/day for each plan block (sum of recipes, not a target)
const AVG_BASE_W12 = Math.round(
  WEEK_1_2.reduce((sum, d) => sum + d.breakfast.calories + d.lunch.calories + d.dinner.calories + d.snack.calories, 0) / WEEK_1_2.length
)
const AVG_BASE_W34 = Math.round(
  WEEK_3_4.reduce((sum, d) => sum + d.breakfast.calories + d.lunch.calories + d.dinner.calories + d.snack.calories, 0) / WEEK_3_4.length
)

interface NutritionProfile {
  calories: number
  protein: number
  carbs: number
  fat: number
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.3em", textTransform: "uppercase", color: goldDeep, marginBottom: "0.75rem", fontFamily: "var(--font-montserrat), sans-serif" }}>
      {children}
    </p>
  )
}

function Divider() {
  return <div style={{ height: 1, background: border, margin: "2.5rem 0" }} />
}

function GroceryList({ list, scalePct }: { list: typeof GROCERY_LIST_W12; scalePct?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {scalePct !== undefined && Math.abs(scalePct - 100) > 5 && (
        <div style={{ background: "rgba(201,169,110,0.07)", border: `1px solid rgba(201,169,110,0.2)`, padding: "0.6rem 1rem", marginBottom: 4 }}>
          <p style={{ fontSize: "0.68rem", color: goldDeep, margin: 0, fontFamily: "var(--font-montserrat), sans-serif", lineHeight: 1.5 }}>
            {scalePct > 100
              ? `Your target is higher than the base plan. Scale quantities up by approximately ${scalePct - 100}%.`
              : `Your target is lower than the base plan. Scale quantities down by approximately ${100 - scalePct}%.`}
          </p>
        </div>
      )}
      {list.map((section) => (
        <div key={section.category} style={{ background: dark, border: `1px solid ${border}`, padding: "1rem 1.25rem" }}>
          <p style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: gold, marginBottom: "0.6rem", fontFamily: "var(--font-montserrat), sans-serif" }}>
            {section.category}
          </p>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
            {section.items.map((item) => (
              <li key={item} style={{ fontSize: "0.78rem", color: muted, paddingLeft: "1rem", position: "relative", fontFamily: "var(--font-montserrat), sans-serif" }}>
                <span style={{ position: "absolute", left: 0, color: "#444" }}>›</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

export default function Module3Client() {
  const [profile, setProfile] = useState<NutritionProfile | null>(null)
  const [activeWeek, setActiveWeek] = useState<1 | 2 | 3 | 4>(1)
  const [showRecipes, setShowRecipes] = useState(false)
  const [showGrocery, setShowGrocery] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem("lfm_nutrition_profile")
      if (stored) {
        const p = JSON.parse(stored) as Partial<NutritionProfile>
        if (p.calories && p.calories > 0) {
          setProfile({ calories: p.calories, protein: p.protein ?? 0, carbs: p.carbs ?? 0, fat: p.fat ?? 0 })
        }
      }
    } catch {
      // localStorage not available
    }
  }, [])

  const currentPlan = activeWeek <= 2 ? WEEK_1_2 : WEEK_3_4
  const avgBase = activeWeek <= 2 ? AVG_BASE_W12 : AVG_BASE_W34

  // Scale factor for recipe cards: based on average daily total for the current plan block
  const recipeScaleFactor = profile ? profile.calories / avgBase : 1

  // Grocery scale percentage relative to base plan
  const groceryScalePct = profile ? Math.round((profile.calories / avgBase) * 100) : undefined

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "3rem 2.5rem 6rem" }} className="mod-body">
      <style>{`
        @media (max-width: 768px) { .mod-body { padding: 2rem 1rem 6rem !important; } }
      `}</style>

      <Label>Module 3 · Meal Planning</Label>
      <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(1.8rem, 4.5vw, 2.6rem)", fontWeight: 300, color: cream, lineHeight: 1.15, marginBottom: "1.25rem", marginTop: 0 }}>
        Your 4-Week Meal Plan<br />
        <em style={{ color: gold }}>Built around your numbers.</em>
      </h1>

      {/* Personalisation banner */}
      {profile ? (
        <div style={{ background: "rgba(201,169,110,0.06)", border: `1px solid ${gold}`, padding: "1.1rem 1.25rem", marginBottom: "1.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.75rem" }}>
            <span style={{ color: gold, fontSize: "0.85rem", flexShrink: 0 }}>✓</span>
            <p style={{ fontSize: "0.72rem", fontWeight: 600, color: gold, margin: 0, fontFamily: "var(--font-montserrat), sans-serif", letterSpacing: "0.06em" }}>
              Personalized to your target: {profile.calories} kcal/day
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: "0.75rem" }}>
            {[
              { label: "Protein target", value: `${profile.protein}g` },
              { label: "Carbs target", value: `${profile.carbs}g` },
              { label: "Fat target", value: `${profile.fat}g` },
            ].map((m) => (
              <div key={m.label} style={{ background: "rgba(0,0,0,0.3)", padding: "0.5rem 0.75rem", border: `1px solid rgba(201,169,110,0.15)` }}>
                <p style={{ fontSize: "0.5rem", color: "#666", fontFamily: "var(--font-montserrat), sans-serif", margin: "0 0 0.15rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>{m.label}</p>
                <p style={{ fontSize: "0.88rem", fontFamily: "var(--font-cormorant), serif", color: cream, margin: 0, lineHeight: 1 }}>{m.value}</p>
              </div>
            ))}
          </div>
          <p style={{ fontSize: "0.68rem", color: "#888", margin: 0, fontFamily: "var(--font-montserrat), sans-serif", lineHeight: 1.55 }}>
            Each day&apos;s portions are scaled to match your {profile.calories} kcal target. Macros are approximated within a practical real-world range based on recipe composition.
          </p>
        </div>
      ) : (
        <div style={{ background: dark, border: `1px solid ${border}`, borderLeft: `3px solid ${goldDeep}`, padding: "0.875rem 1.25rem", marginBottom: "1.75rem" }}>
          <p style={{ fontSize: "0.72rem", color: "#666", fontFamily: "var(--font-montserrat), sans-serif", lineHeight: 1.5, margin: 0 }}>
            <strong style={{ color: muted }}>Profile not set.</strong> This plan is showing unscaled base portions.{" "}
            <Link href="/nutrition-foundations/module1" style={{ color: gold, textDecoration: "none" }}>
              Complete the calculator in Module 1 →
            </Link>{" "}
            to personalize your portions and daily totals.
          </p>
        </div>
      )}

      <p style={{ fontSize: "0.88rem", color: muted, lineHeight: 1.72, marginBottom: "2rem", fontFamily: "var(--font-montserrat), sans-serif" }}>
        All recipes in this plan come from verified, well-reviewed sources — linked directly so you can check them yourself. Macros are calculated from the actual ingredients. Nothing is invented. The plan follows a simple structure: Weeks 1&ndash;2 build the habit with consistent meals; Weeks 3&ndash;4 introduce variety while keeping the same framework.
      </p>

      <Divider />

      {/* How portions work */}
      <Label>How portions work</Label>
      <div style={{ background: dark, border: `1px solid ${border}`, padding: "1.25rem 1.5rem", marginBottom: "1.5rem" }}>
        <p style={{ fontSize: "0.82rem", color: muted, lineHeight: 1.65, margin: 0, fontFamily: "var(--font-montserrat), sans-serif" }}>
          Each day&apos;s meals are scaled so the daily total matches your saved calorie target from Module 1. The recipe structure stays the same; portions increase or decrease proportionally. Daily macro totals are shown for each day in the plan below.
        </p>
        {!profile && (
          <p style={{ fontSize: "0.78rem", color: goldDeep, margin: "0.75rem 0 0", fontFamily: "var(--font-montserrat), sans-serif" }}>
            Save your profile in Module 1 to activate personalized portions.
          </p>
        )}
      </div>

      <Divider />

      {/* Week selector */}
      <Label>The 4-Week Plan</Label>
      <div style={{ display: "flex", gap: 6, marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {([1, 2, 3, 4] as const).map((week) => (
          <button
            key={week}
            type="button"
            onClick={() => setActiveWeek(week)}
            style={{
              padding: "0.6rem 1.25rem",
              background: activeWeek === week ? gold : dark,
              color: activeWeek === week ? "#0a0a0a" : muted,
              border: `1px solid ${activeWeek === week ? gold : border}`,
              fontFamily: "var(--font-montserrat), sans-serif",
              fontSize: "0.68rem",
              fontWeight: 600,
              letterSpacing: "0.12em",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            Week {week}
          </button>
        ))}
      </div>

      {activeWeek <= 2 ? (
        <div style={{ background: "rgba(201,169,110,0.04)", border: `1px solid ${border}`, padding: "0.75rem 1.25rem", marginBottom: "1rem" }}>
          <p style={{ fontSize: "0.72rem", color: muted, fontFamily: "var(--font-montserrat), sans-serif", margin: 0, lineHeight: 1.5 }}>
            <strong style={{ color: cream }}>Weeks 1&ndash;2: Build the habit.</strong> Consistent meals across both weeks. The repetition is intentional — your brain builds a grocery routine, you get faster at prep, and you learn your numbers without having to think.
          </p>
        </div>
      ) : (
        <div style={{ background: "rgba(201,169,110,0.04)", border: `1px solid ${border}`, padding: "0.75rem 1.25rem", marginBottom: "1rem" }}>
          <p style={{ fontSize: "0.72rem", color: muted, fontFamily: "var(--font-montserrat), sans-serif", margin: 0, lineHeight: 1.5 }}>
            <strong style={{ color: cream }}>Weeks 3&ndash;4: Add variety.</strong> Same recipes, different rotation. The framework is established — now you can mix things up without losing the structure. Review how your body responded in Weeks 1&ndash;2 and adjust if needed.
          </p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {currentPlan.map((day) => (
          <MealPlanDay key={day.day} plan={day} calorieTarget={profile?.calories} />
        ))}
      </div>

      <Divider />

      {/* Recipe Cards */}
      <div style={{ marginBottom: "1.5rem" }}>
        <button
          type="button"
          onClick={() => setShowRecipes((v) => !v)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "none",
            border: `1px solid ${border}`,
            color: cream,
            fontFamily: "var(--font-montserrat), sans-serif",
            fontSize: "0.72rem",
            fontWeight: 600,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            padding: "0.875rem 1.25rem",
            cursor: "pointer",
            width: "100%",
            textAlign: "left",
            transition: "border-color 0.15s",
          }}
        >
          <span style={{ color: showRecipes ? gold : "#555", fontSize: "1rem", lineHeight: 1 }}>{showRecipes ? "▾" : "▸"}</span>
          Recipe Details & Source Links {showRecipes ? "(collapse)" : "(expand)"}
        </button>

        {showRecipes && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
            {Object.values(RECIPES).map((recipe) => (
              <RecipeCard key={recipe.name} recipe={recipe} scaleFactor={recipeScaleFactor} />
            ))}
          </div>
        )}
      </div>

      {/* Grocery lists */}
      <div style={{ marginBottom: "1.5rem" }}>
        <button
          type="button"
          onClick={() => setShowGrocery((v) => !v)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "none",
            border: `1px solid ${border}`,
            color: cream,
            fontFamily: "var(--font-montserrat), sans-serif",
            fontSize: "0.72rem",
            fontWeight: 600,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            padding: "0.875rem 1.25rem",
            cursor: "pointer",
            width: "100%",
            textAlign: "left",
          }}
        >
          <span style={{ color: showGrocery ? gold : "#555", fontSize: "1rem", lineHeight: 1 }}>{showGrocery ? "▾" : "▸"}</span>
          Grocery Lists {showGrocery ? "(collapse)" : "(expand)"}
        </button>

        {showGrocery && (
          <div style={{ marginTop: 8 }}>
            <div style={{ marginBottom: "1.25rem" }}>
              <p style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: goldDeep, marginBottom: "0.75rem", fontFamily: "var(--font-montserrat), sans-serif" }}>
                Weeks 1 &amp; 2
              </p>
              <GroceryList list={GROCERY_LIST_W12} scalePct={groceryScalePct} />
            </div>
            <div>
              <p style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: goldDeep, marginBottom: "0.75rem", fontFamily: "var(--font-montserrat), sans-serif" }}>
                Weeks 3 &amp; 4
              </p>
              <GroceryList list={GROCERY_LIST_W34} scalePct={groceryScalePct} />
            </div>
          </div>
        )}
      </div>

      <Divider />

      {/* Meal prep guide */}
      <Label>Meal Prep Guide</Label>
      <h2 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(1.3rem, 3vw, 1.8rem)", fontWeight: 300, color: cream, lineHeight: 1.2, marginBottom: "1rem" }}>
        How to set up your week in under 2 hours
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: "1rem" }} className="prep-grid">
        <style>{`.prep-grid { @media (max-width: 600px) { grid-template-columns: 1fr !important; } }`}</style>
        {[
          {
            day: "Sunday (60–75 min)",
            tasks: [
              "Cook 2–3 lbs chicken breast (bake at 400°F for 22 min, then shred for salads and bowls)",
              "Make 6–8 servings overnight oats (jar prep, 5 min total)",
              "Brown and season ground beef or turkey (10 min)",
              "Wash and chop veg (cucumber, celery, peppers, cherry tomatoes)",
              "Batch-cook quinoa if using (20 min)",
            ],
          },
          {
            day: "Wednesday (20–30 min)",
            tasks: [
              "Check what's left — restock protein if needed",
              "Cook fresh salmon (sheet pan, 20 min)",
              "Refill overnight oat jars for the second half of the week",
              "Restock chopped veg",
            ],
          },
        ].map((session) => (
          <div key={session.day} style={{ background: dark, border: `1px solid ${border}`, padding: "1.25rem" }}>
            <p style={{ fontSize: "0.65rem", fontWeight: 700, color: gold, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.75rem", fontFamily: "var(--font-montserrat), sans-serif" }}>
              {session.day}
            </p>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {session.tasks.map((t) => (
                <li key={t} style={{ fontSize: "0.75rem", color: muted, paddingLeft: "1rem", position: "relative", lineHeight: 1.5, fontFamily: "var(--font-montserrat), sans-serif" }}>
                  <span style={{ position: "absolute", left: 0, color: goldDeep }}>›</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div style={{ background: "#0d0d0d", border: `1px solid #1a1a1a`, padding: "1rem 1.25rem", marginBottom: "1.5rem" }}>
        <p style={{ fontSize: "0.75rem", color: "#555", margin: 0, lineHeight: 1.6, fontFamily: "var(--font-montserrat), sans-serif" }}>
          <strong style={{ color: "#777" }}>The principle:</strong> Prepare protein in bulk — it&apos;s the most time-consuming part. Everything else assembles quickly when the protein is ready. The 90-minute Sunday session makes the rest of the week feel effortless.
        </p>
      </div>

      <Divider />

      {/* Recipe attribution */}
      <div style={{ background: dark, border: `1px solid ${border}`, borderLeft: `3px solid #333`, padding: "1rem 1.25rem" }}>
        <p style={{ fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "#555", marginBottom: "0.35rem", fontFamily: "var(--font-montserrat), sans-serif" }}>
          Recipe attribution
        </p>
        <p style={{ fontSize: "0.72rem", color: "#555", margin: 0, lineHeight: 1.6, fontFamily: "var(--font-montserrat), sans-serif" }}>
          All recipes in this plan are sourced from and attributed to their original creators. Macros are calculated from standard ingredient amounts and may vary slightly based on specific brands and exact measurements. Click any source link to see the original recipe with full instructions.
        </p>
      </div>

      <Divider />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <Link
          href="/nutrition-foundations/module2"
          style={{ fontSize: "0.68rem", color: "#555", fontFamily: "var(--font-montserrat), sans-serif", textDecoration: "none", letterSpacing: "0.1em" }}
        >
          ← Module 2
        </Link>
        <Link
          href="/nutrition-foundations/module4"
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
          Module 4: Making It Stick →
        </Link>
      </div>
    </div>
  )
}
