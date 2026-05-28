import { type Recipe } from "./RecipeCard"

const gold = "#c9a96e"
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

function MacroBadge({ calories, protein }: { calories: number; protein: number }) {
  return (
    <span style={{ fontSize: "0.58rem", color: "#666", fontFamily: "var(--font-montserrat), sans-serif" }}>
      {calories} kcal · {protein}g P
    </span>
  )
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
        <MacroBadge calories={scale(recipe.calories)} protein={scale(recipe.proteinG)} />
      </div>
    </div>
  )
}

export default function MealPlanDay({ plan, scaleFactor = 1 }: { plan: DayPlan; scaleFactor?: number }) {
  const scale = (v: number) => Math.round(v * scaleFactor)
  const totalCals = scale(plan.breakfast.calories + plan.lunch.calories + plan.dinner.calories + plan.snack.calories)
  const totalProtein = scale(plan.breakfast.proteinG + plan.lunch.proteinG + plan.dinner.proteinG + plan.snack.proteinG)
  const totalCarbs = scale(plan.breakfast.carbsG + plan.lunch.carbsG + plan.dinner.carbsG + plan.snack.carbsG)
  const totalFat = scale(plan.breakfast.fatG + plan.lunch.fatG + plan.dinner.fatG + plan.snack.fatG)

  return (
    <div style={{ background: dark, border: `1px solid ${border}` }}>
      <div style={{ padding: "0.75rem 1rem", borderBottom: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1rem", fontWeight: 600, color: gold, margin: 0 }}>
          {plan.day}
        </p>
        <p style={{ fontSize: "0.58rem", color: "#555", fontFamily: "var(--font-montserrat), sans-serif", margin: 0 }}>
          {totalCals} kcal · {totalProtein}g P · {totalCarbs}g C · {totalFat}g F
        </p>
      </div>
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
