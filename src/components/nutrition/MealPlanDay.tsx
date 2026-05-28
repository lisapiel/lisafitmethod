import { type Recipe } from "./RecipeCard"

const gold = "#c9a96e"
const goldDeep = "#a8895e"
const cream = "#f0e6d3"
const dark = "#111"
const border = "#2a2a2a"

interface DayPlan {
  day: string
  breakfast: Recipe
  lunch: Recipe
  dinner: Recipe
  snack: Recipe
}

function MealRow({ type, recipe, scaleFactor }: { type: string; recipe: Recipe; scaleFactor: number }) {
  const scale = (v: number) => Math.round(v * scaleFactor)
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "0.6rem 0", borderBottom: `1px solid #1a1a1a` }}>
      <span style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#555", fontFamily: "var(--font-montserrat), sans-serif", width: 64, flexShrink: 0, paddingTop: "0.1rem" }}>
        {type}
      </span>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: "0.78rem", color: cream, margin: "0 0 0.1rem", fontFamily: "var(--font-montserrat), sans-serif" }}>
          {recipe.name}
        </p>
        <span style={{ fontSize: "0.58rem", color: "#666", fontFamily: "var(--font-montserrat), sans-serif" }}>
          {scale(recipe.calories)} kcal · {scale(recipe.proteinG)}g P
        </span>
      </div>
    </div>
  )
}

export default function MealPlanDay({ plan, calorieTarget }: { plan: DayPlan; calorieTarget?: number }) {
  const baseCals = plan.breakfast.calories + plan.lunch.calories + plan.dinner.calories + plan.snack.calories
  const scaleFactor = calorieTarget ? calorieTarget / baseCals : 1
  const scale = (v: number) => Math.round(v * scaleFactor)

  const totalCals = calorieTarget ?? scale(baseCals)
  const totalProtein = scale(plan.breakfast.proteinG + plan.lunch.proteinG + plan.dinner.proteinG + plan.snack.proteinG)
  const totalCarbs = scale(plan.breakfast.carbsG + plan.lunch.carbsG + plan.dinner.carbsG + plan.snack.carbsG)
  const totalFat = scale(plan.breakfast.fatG + plan.lunch.fatG + plan.dinner.fatG + plan.snack.fatG)

  const isPersonalized = calorieTarget !== undefined

  return (
    <div style={{ background: dark, border: `1px solid ${border}` }}>
      {/* Header: day name + macro summary */}
      <div style={{ padding: "0.875rem 1rem", borderBottom: `1px solid ${border}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.6rem" }}>
          <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.05rem", fontWeight: 600, color: gold, margin: 0 }}>
            {plan.day}
          </p>
          {isPersonalized && (
            <span style={{ fontSize: "0.52rem", color: goldDeep, fontFamily: "var(--font-montserrat), sans-serif", letterSpacing: "0.08em" }}>
              ✓ Adjusted to your target
            </span>
          )}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4 }}>
          {[
            { label: "Calories", value: String(totalCals), unit: " kcal", primary: true },
            { label: "Protein", value: String(totalProtein), unit: "g", primary: false },
            { label: "Carbs", value: String(totalCarbs), unit: "g", primary: false },
            { label: "Fat", value: String(totalFat), unit: "g", primary: false },
          ].map((m) => (
            <div key={m.label} style={{ background: "#0c0c0c", padding: "0.45rem 0.5rem", border: `1px solid #1a1a1a` }}>
              <p style={{ fontSize: "0.5rem", color: "#555", fontFamily: "var(--font-montserrat), sans-serif", margin: "0 0 0.15rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>{m.label}</p>
              <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1rem", color: m.primary ? gold : cream, margin: 0, lineHeight: 1 }}>
                {m.value}<span style={{ fontSize: "0.55rem", color: "#555" }}>{m.unit}</span>
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Meal rows */}
      <div style={{ padding: "0 1rem" }}>
        <MealRow type="Breakfast" recipe={plan.breakfast} scaleFactor={scaleFactor} />
        <MealRow type="Lunch" recipe={plan.lunch} scaleFactor={scaleFactor} />
        <MealRow type="Dinner" recipe={plan.dinner} scaleFactor={scaleFactor} />
        <MealRow type="Snack" recipe={plan.snack} scaleFactor={scaleFactor} />
      </div>
    </div>
  )
}

export type { DayPlan }
