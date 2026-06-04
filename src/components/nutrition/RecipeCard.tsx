const gold = "#c9a96e"
const goldDeep = "#a8895e"
const cream = "#f0e6d3"
const muted = "#888"
const dark = "#111"
const border = "#2a2a2a"

export interface RecipeIngredient {
  qty: number
  unit: string
  item: string
  isWhole?: boolean
}

export interface Recipe {
  name: string
  sourceLabel: string
  sourceUrl: string
  mealType: "Breakfast" | "Lunch" | "Dinner" | "Snack"
  prepMins: number
  storesDays: string
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  description: string
  servingNote?: string
  ingredients: RecipeIngredient[]
  batchServings?: number
}

function fmtQty(n: number): string {
  if (n <= 0) return "—"
  const SNAPS: [number, string][] = [
    [0.125, "⅛"], [0.25, "¼"], [1 / 3, "⅓"],
    [0.5, "½"], [2 / 3, "⅔"], [0.75, "¾"],
  ]
  const whole = Math.floor(n)
  const frac = n - whole
  if (frac < 0.1) return String(whole)
  if (frac > 0.88) return String(whole + 1)
  const best = SNAPS.reduce<[number, string]>(
    (b, c) => Math.abs(c[0] - frac) < Math.abs(b[0] - frac) ? c : b,
    SNAPS[0]
  )
  const [val, str] = best
  if (Math.abs(val - frac) > 0.12) {
    return n >= 10 ? String(Math.round(n)) : n.toFixed(1).replace(/\.0$/, "")
  }
  return whole === 0 ? str : `${whole}${str}`
}

export default function RecipeCard({ recipe, scaleFactor = 1 }: { recipe: Recipe; scaleFactor?: number }) {
  const scale = (v: number) => Math.round(v * scaleFactor)
  const isScaled = Math.abs(scaleFactor - 1) > 0.05
  const batchN = recipe.batchServings ?? 1

  return (
    <div style={{ background: dark, border: `1px solid ${border}`, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "1rem 1.25rem", borderBottom: `1px solid ${border}`, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: "0.3rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: gold, fontFamily: "var(--font-montserrat), sans-serif" }}>
              {recipe.mealType}
            </span>
            <span style={{ fontSize: "0.55rem", color: "#444", fontFamily: "var(--font-montserrat), sans-serif" }}>·</span>
            <span style={{ fontSize: "0.55rem", color: "#555", fontFamily: "var(--font-montserrat), sans-serif" }}>
              {recipe.prepMins} min · Stores {recipe.storesDays}
            </span>
          </div>
          <h3 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.1rem", fontWeight: 400, color: cream, margin: 0, lineHeight: 1.3 }}>
            {recipe.name}
          </h3>
        </div>
        <a
          href={recipe.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: "0.6rem", color: goldDeep, fontFamily: "var(--font-montserrat), sans-serif", textDecoration: "none", letterSpacing: "0.08em", whiteSpace: "nowrap", flexShrink: 0 }}
        >
          {recipe.sourceLabel} ↗
        </a>
      </div>

      {/* Description */}
      <div style={{ padding: "0.875rem 1.25rem", borderBottom: `1px solid ${border}` }}>
        <p style={{ fontSize: "0.78rem", color: muted, lineHeight: 1.6, margin: 0, fontFamily: "var(--font-montserrat), sans-serif" }}>
          {recipe.description}
        </p>
        {recipe.servingNote && (
          <p style={{ fontSize: "0.68rem", color: "#555", margin: "0.5rem 0 0", fontFamily: "var(--font-montserrat), sans-serif", fontStyle: "italic" }}>
            {recipe.servingNote}
          </p>
        )}
      </div>

      {/* Ingredients */}
      <div style={{ padding: "0.875rem 1.25rem", borderBottom: `1px solid ${border}` }}>
        <p style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: isScaled ? goldDeep : "#555", margin: "0 0 0.4rem", fontFamily: "var(--font-montserrat), sans-serif" }}>
          {isScaled ? `Your portions (×${scaleFactor.toFixed(1)})` : "Ingredients"}
        </p>
        {batchN > 1 && (
          <p style={{ fontSize: "0.6rem", color: "#555", margin: "0 0 0.5rem", fontStyle: "italic", fontFamily: "var(--font-montserrat), sans-serif" }}>
            Shown per 1 serving — full batch makes {batchN}
          </p>
        )}
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.18rem" }}>
          {recipe.ingredients.map((ing, i) => {
            const perServing = ing.qty / batchN
            const scaled = perServing * scaleFactor
            let qtyStr: string
            if (ing.unit === "to taste" || ing.qty === 0) {
              qtyStr = "to taste"
            } else if (ing.isWhole) {
              qtyStr = String(Math.max(1, Math.round(scaled)))
            } else {
              qtyStr = fmtQty(scaled)
            }
            const unitStr = (ing.unit && ing.unit !== "to taste") ? ` ${ing.unit}` : ""
            return (
              <li key={i} style={{ display: "flex", gap: "0.5rem", fontSize: "0.72rem", fontFamily: "var(--font-montserrat), sans-serif" }}>
                <span style={{ color: isScaled ? gold : "#666", flexShrink: 0, minWidth: "3.5rem" }}>
                  {qtyStr}{unitStr}
                </span>
                <span style={{ color: isScaled ? cream : muted }}>
                  {ing.item}
                </span>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Macros */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
        {[
          { label: "Calories", value: `${scale(recipe.calories)}`, unit: "kcal" },
          { label: "Protein", value: `${scale(recipe.proteinG)}`, unit: "g" },
          { label: "Carbs", value: `${scale(recipe.carbsG)}`, unit: "g" },
          { label: "Fat", value: `${scale(recipe.fatG)}`, unit: "g" },
        ].map((macro, i) => (
          <div
            key={macro.label}
            style={{
              padding: "0.75rem 0.875rem",
              borderRight: i < 3 ? `1px solid ${border}` : "none",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: "0.5rem", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "#555", marginBottom: "0.2rem", fontFamily: "var(--font-montserrat), sans-serif" }}>
              {macro.label}
            </p>
            <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.15rem", color: i === 0 ? gold : cream, margin: 0, lineHeight: 1 }}>
              {macro.value}<span style={{ fontSize: "0.6rem", color: "#555" }}>{macro.unit}</span>
            </p>
          </div>
        ))}
      </div>

      {isScaled && (
        <div style={{ padding: "0.5rem 1.25rem", background: "rgba(201,169,110,0.05)", borderTop: `1px solid ${border}` }}>
          <p style={{ fontSize: "0.6rem", color: goldDeep, margin: 0, fontFamily: "var(--font-montserrat), sans-serif" }}>
            ↑ Portions adjusted {scaleFactor > 1 ? "up" : "down"} for your calorie target ({Math.round(scaleFactor * 100)}% of base recipe)
          </p>
        </div>
      )}
    </div>
  )
}
