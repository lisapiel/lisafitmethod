import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "References & Resources: Nutrition Foundations | Lisa Fit Method",
}

const RESEARCH = [
  {
    module: "Module 1",
    citations: [
      {
        authors: "Mifflin MD, St Jeor ST, Hill LA, Scott BJ, Daugherty SA, Koh YO.",
        title: "A new predictive equation for resting energy expenditure in healthy individuals.",
        journal: "Am J Clin Nutr.",
        year: "1990",
        detail: "51(2):241–7.",
        note: "The Mifflin-St Jeor equation used in the Module 1 TDEE calculator.",
      },
      {
        authors: "Henry CJK.",
        title: "Basal metabolic rate studies in humans: measurement and development of new equations.",
        journal: "Public Health Nutr.",
        year: "2005",
        detail: "8(7A):1133–52.",
        note: "Supporting evidence for BMR variation across populations (±10% individual variation).",
      },
    ],
  },
  {
    module: "Module 2",
    citations: [
      {
        authors: "Morton RW, Murphy KT, McKellar SR, et al.",
        title: "A systematic review, meta-analysis and meta-regression of the effect of protein supplementation on resistance training-induced gains in muscle mass and strength in healthy adults.",
        journal: "Br J Sports Med.",
        year: "2018",
        detail: "52(6):376–384.",
        note: "Evidence for protein targets and distribution across meals for muscle synthesis.",
      },
      {
        authors: "Phillips SM, Van Loon LJC.",
        title: "Dietary protein for athletes: from requirements to optimum adaptation.",
        journal: "J Sports Sci.",
        year: "2011",
        detail: "29 Suppl 1:S29–38.",
        note: "Protein distribution and timing recommendations for training populations.",
      },
      {
        authors: "Burke LM, Hawley JA, Wong SH, Jeukendrup AE.",
        title: "Carbohydrates for training and competition.",
        journal: "J Sports Sci.",
        year: "2011",
        detail: "29 Suppl 1:S17–27.",
        note: "Basis for carbohydrate timing recommendations around training in Module 2.",
      },
      {
        authors: "Smith GI, Atherton P, Reeds DN, et al.",
        title: "Omega-3 polyunsaturated fatty acids augment the muscle protein anabolic response to hyperinsulinaemia-hyperaminoacidaemia in healthy young and middle-aged men and women.",
        journal: "Clin Sci (Lond).",
        year: "2011",
        detail: "121(6):267–78.",
        note: "Evidence for omega-3 fatty acids (salmon, fish oil) and muscle protein synthesis.",
      },
    ],
  },
  {
    module: "Module 4",
    citations: [
      {
        authors: "Lanhers C, Pereira B, Naughton G, Trousselard M, Lesage FX, Dutheil F.",
        title: "Creatine supplementation and upper limb strength performance: a systematic review and meta-analysis.",
        journal: "Sports Med.",
        year: "2017",
        detail: "47(1):163–173.",
        note: "Basis for creatine supplementation recommendation (3–5g/day) in Module 4.",
      },
    ],
  },
]

const RECIPE_SOURCES = [
  { name: "Cottage Cheese Scrambled Eggs", source: "Oh Snap Macros", url: "https://ohsnapmacros.com/cottage-cheese-and-scrambled-eggs/" },
  { name: "Greek Yogurt Overnight Oats", source: "The Plant Based School", url: "https://theplantbasedschool.com/greek-yogurt-overnight-oats/" },
  { name: "High-Protein Chicken Salad", source: "Coconuts & Kettlebells", url: "https://coconutsandkettlebells.com/high-protein-chicken-salad/" },
  { name: "Mediterranean Chicken Quinoa Bowl", source: "Nourish Move Love", url: "https://www.nourishmovelove.com/high-protein-lunch/" },
  { name: "No-Mayo Tuna Salad", source: "Fit Healthy Macros", url: "https://fithealthymacros.com/recipes/classic-tuna-salad/" },
  { name: "Ground Beef & Broccoli Stir-Fry", source: "Oh Snap Macros", url: "https://ohsnapmacros.com/ground-beef-and-broccoli/" },
  { name: "Honey-Glazed Salmon with Asparagus", source: "Real Food Dietitians", url: "https://therealfooddietitians.com/salmon-recipes/" },
  { name: "Baked Turkey Meatballs", source: "Taste and See", url: "https://tasteandsee.com/healthy-meal-prep-baked-turkey-meatballs/" },
  { name: "Whipped Cottage Cheese Bowl", source: "Oh Snap Macros", url: "https://ohsnapmacros.com/cottage-cheese/" },
]

export default function ResourcesPage() {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 32px 80px" }}>
      <style>{`
        @media (max-width: 640px) {
          .resources-page { padding: 32px 20px 60px !important; }
        }
      `}</style>

      <div style={{ marginBottom: 48 }}>
        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.25em", textTransform: "uppercase", color: "#c9a96e", marginBottom: 12 }}>
          Nutrition Foundations
        </p>
        <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(32px, 4vw, 44px)", fontWeight: 700, color: "#f0e6d3", lineHeight: 1.15, marginBottom: 16 }}>
          References & Resources
        </h1>
        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: 14, color: "#888888", lineHeight: 1.6 }}>
          All research cited throughout this course, plus the original sources for every recipe in the meal plan.
        </p>
      </div>

      {/* Research Citations */}
      <section style={{ marginBottom: 64 }}>
        <h2 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: 28, fontWeight: 700, color: "#f0e6d3", marginBottom: 32, paddingBottom: 16, borderBottom: "1px solid #2a2a2a" }}>
          Research Citations
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
          {RESEARCH.map((section) => (
            <div key={section.module}>
              <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#c9a96e", marginBottom: 20 }}>
                {section.module}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {section.citations.map((cite, i) => (
                  <div key={i} style={{ background: "#161616", border: "1px solid #2a2a2a", padding: "20px 24px" }}>
                    <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: 13, lineHeight: 1.6, color: "#f0e6d3", marginBottom: 8 }}>
                      {cite.authors} {cite.title} <em style={{ color: "#888888" }}>{cite.journal}</em> {cite.year};{cite.detail}
                    </p>
                    <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: 12, color: "#888888", lineHeight: 1.5 }}>
                      <span style={{ color: "#c9a96e" }}>↳</span> {cite.note}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recipe Sources */}
      <section style={{ marginBottom: 64 }}>
        <h2 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: 28, fontWeight: 700, color: "#f0e6d3", marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid #2a2a2a" }}>
          Recipe Sources
        </h2>
        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: 13, color: "#888888", lineHeight: 1.6, marginBottom: 28 }}>
          All recipes in the meal plan are sourced from established food and nutrition creators. Macros have been calculated from the original ingredients. Click any link to view the full recipe.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {RECIPE_SOURCES.map((r) => (
            <div key={r.name} style={{ background: "#161616", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div>
                <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: 13, fontWeight: 500, color: "#f0e6d3", marginBottom: 2 }}>{r.name}</p>
                <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: 11, color: "#888888" }}>{r.source}</p>
              </div>
              <Link
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#c9a96e", textDecoration: "none", flexShrink: 0 }}
              >
                View Recipe →
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Disclaimer */}
      <section style={{ background: "#161616", border: "1px solid #2a2a2a", padding: "24px 28px", marginBottom: 48 }}>
        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: 12, color: "#888888", lineHeight: 1.7 }}>
          <strong style={{ color: "#f0e6d3" }}>A note on macro data:</strong> Nutritional values for recipes are calculated from original ingredient weights and may vary slightly from the source website due to brand variation, portion size, and ingredient substitutions. Values are provided as educational estimates. For precise tracking, enter ingredients directly into a tracking app using your exact brands and measurements.
        </p>
      </section>

      {/* Navigation */}
      <div style={{ display: "flex", justifyContent: "flex-start", paddingTop: 16, borderTop: "1px solid #2a2a2a" }}>
        <Link
          href="/nutrition-foundations/module4"
          style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: 12, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "#888888", textDecoration: "none" }}
        >
          ← Module 4: Making It Stick
        </Link>
      </div>
    </div>
  )
}
