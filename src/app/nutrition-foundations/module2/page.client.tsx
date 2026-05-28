"use client"

import Link from "next/link"
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

function CoachNote({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "rgba(201,169,110,0.07)", border: `1px solid rgba(201,169,110,0.25)`, borderLeft: `3px solid ${gold}`, padding: "1rem 1.25rem", marginTop: "1.25rem" }}>
      <p style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: goldDeep, marginBottom: "0.4rem", fontFamily: "var(--font-montserrat), sans-serif" }}>
        Coach Note
      </p>
      <p style={{ fontSize: "0.82rem", color: muted, margin: 0, lineHeight: 1.65, fontFamily: "var(--font-montserrat), sans-serif" }}>
        {children}
      </p>
    </div>
  )
}

function MythReality({ myth, reality }: { myth: string; reality: string }) {
  return (
    <div style={{ marginTop: "1.25rem", border: `1px solid ${border}`, overflow: "hidden" }}>
      <div style={{ background: "#0d0d0d", padding: "0.875rem 1.25rem", borderBottom: `1px solid ${border}` }}>
        <p style={{ fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "#555", marginBottom: "0.35rem", fontFamily: "var(--font-montserrat), sans-serif" }}>
          Myth
        </p>
        <p style={{ fontSize: "0.82rem", color: "#888", margin: 0, lineHeight: 1.55, fontFamily: "var(--font-montserrat), sans-serif", fontStyle: "italic" }}>
          &ldquo;{myth}&rdquo;
        </p>
      </div>
      <div style={{ background: dark, padding: "0.875rem 1.25rem", borderLeft: `3px solid ${gold}` }}>
        <p style={{ fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: goldDeep, marginBottom: "0.35rem", fontFamily: "var(--font-montserrat), sans-serif" }}>
          Reality
        </p>
        <p style={{ fontSize: "0.82rem", color: muted, margin: 0, lineHeight: 1.6, fontFamily: "var(--font-montserrat), sans-serif" }}>
          {reality}
        </p>
      </div>
    </div>
  )
}

function InPractice({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ marginTop: "0.875rem", display: "flex", gap: "0.6rem", alignItems: "flex-start" }}>
      <span style={{ color: goldDeep, fontSize: "0.85rem", flexShrink: 0, paddingTop: "0.05rem" }}>→</span>
      <p style={{ fontSize: "0.82rem", color: muted, margin: 0, lineHeight: 1.65, fontFamily: "var(--font-montserrat), sans-serif" }}>
        <strong style={{ color: cream }}>In practice: </strong>{children}
      </p>
    </div>
  )
}

const PROTEIN_SOURCES = [
  { food: "Chicken breast (cooked, 4oz)", protein: "34g", calories: "186 kcal", notes: "Versatile, leanest option" },
  { food: "Greek yogurt, plain (1 cup, 2% fat)", protein: "20g", calories: "150 kcal", notes: "Also provides calcium" },
  { food: "Cottage cheese (½ cup, low-fat)", protein: "14g", calories: "90 kcal", notes: "Slow-digesting casein" },
  { food: "Eggs (2 whole)", protein: "12g", calories: "143 kcal", notes: "Complete amino acid profile" },
  { food: "Tuna in water (1 can, 5oz)", protein: "34g", calories: "150 kcal", notes: "Budget-friendly, shelf-stable" },
  { food: "Ground turkey 93/7 (4oz cooked)", protein: "28g", calories: "170 kcal", notes: "Lean alternative to beef" },
  { food: "Salmon (4oz cooked)", protein: "28g", calories: "234 kcal", notes: "Omega-3 fatty acids" },
  { food: "Whey or casein protein powder (1 scoop)", protein: "22–25g", calories: "120 kcal", notes: "Use to fill gaps, not replace food" },
]

export default function Module2Client() {
  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: "3rem 2.5rem 6rem" }} className="mod-body">
      <style>{`
        @media (max-width: 768px) { .mod-body { padding: 2rem 1rem 6rem !important; } }
      `}</style>

      <Label>Module 2 · Macronutrients</Label>
      <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(1.8rem, 4.5vw, 2.6rem)", fontWeight: 300, color: cream, lineHeight: 1.15, marginBottom: "1.25rem", marginTop: 0 }}>
        Your Nutrition Blueprint<br />
        <em style={{ color: gold }}>Protein first. Then everything else.</em>
      </h1>
      <p style={{ fontSize: "0.88rem", color: muted, lineHeight: 1.72, marginBottom: "2rem", fontFamily: "var(--font-montserrat), sans-serif" }}>
        You calculated your calorie and macro targets in Module 1. This module explains what those numbers mean in practice: what to eat, why, and how to put it on a plate. Read this before you open Module 3.
      </p>

      <Divider />

      {/* PROTEIN */}
      <Label>Macronutrient 1</Label>
      <H2>Protein: your non-negotiable</H2>
      <p style={{ fontSize: "0.88rem", color: muted, lineHeight: 1.72, fontFamily: "var(--font-montserrat), sans-serif" }}>
        Calories tell your body whether to gain or lose weight. Protein tells your body what kind of weight to gain or lose. In a calorie deficit, your body will pull from fat <em>and</em> muscle unless protein intake is high enough to signal that the muscle should be preserved.
      </p>
      <p style={{ fontSize: "0.88rem", color: muted, lineHeight: 1.72, marginTop: "0.75rem", fontFamily: "var(--font-montserrat), sans-serif" }}>
        Protein also has a 20&ndash;35% thermic effect. Your body burns roughly a quarter of the calories from protein just digesting it, compared to 5&ndash;10% for carbs and 0&ndash;3% for fat. This is a real but moderate metabolic advantage.
      </p>

      <CoachNote>
        Most people under-eat protein dramatically. Without enough protein, weight loss often becomes &ldquo;smaller but softer,&rdquo; not leaner. That is why many people lose weight but don&apos;t like how they look afterward.
      </CoachNote>

      <MythReality
        myth="Too much protein is bad for your kidneys."
        reality="This concern applies to people with pre-existing kidney disease, not healthy individuals. Multiple large reviews in healthy adults show high protein intake up to 2.5g/kg/day has no adverse effect on kidney function. If you have a kidney condition, consult your doctor before changing protein intake."
      />

      <ScienceBox
        study="Morton et al. (2018) + Phillips & Van Loon (2011)"
        finding="A meta-analysis of 49 RCTs confirmed protein supplementation augments muscle mass and strength gains from resistance training. The effective threshold is approximately 1.62g/kg/day. A separate review found high-protein diets up to 2.5g/kg/day did not impair kidney function in healthy individuals."
        cite="Morton RW et al. Br J Sports Med. 2018. / Phillips SM & Van Loon LJC. J Sports Sci. 2011."
      />

      <InPractice>
        Build every meal around a protein source first, then add carbs and fats. Aim for 30&ndash;40g protein per meal over 3 meals, with 1&ndash;2 protein-containing snacks to hit your daily target. Spreading protein across meals supports muscle protein synthesis better than concentrating it in one or two.
      </InPractice>

      {/* Protein sources table */}
      <div style={{ marginTop: "1.5rem" }}>
        <p style={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#555", marginBottom: "0.75rem", fontFamily: "var(--font-montserrat), sans-serif" }}>
          High-protein foods: per serving
        </p>
        <div style={{ border: `1px solid ${border}`, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1.5fr", background: "#0d0d0d", padding: "0.5rem 1rem", borderBottom: `1px solid ${border}` }}>
            {["Food", "Protein", "Calories", "Notes"].map((h) => (
              <span key={h} style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#555", fontFamily: "var(--font-montserrat), sans-serif" }}>{h}</span>
            ))}
          </div>
          {PROTEIN_SOURCES.map((row, i) => (
            <div key={row.food} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1.5fr", padding: "0.6rem 1rem", borderBottom: i < PROTEIN_SOURCES.length - 1 ? `1px solid #1a1a1a` : "none", background: i % 2 === 0 ? "transparent" : "#0a0a0a" }}>
              <span style={{ fontSize: "0.75rem", color: cream, fontFamily: "var(--font-montserrat), sans-serif" }}>{row.food}</span>
              <span style={{ fontSize: "0.75rem", color: gold, fontFamily: "var(--font-montserrat), sans-serif", fontWeight: 600 }}>{row.protein}</span>
              <span style={{ fontSize: "0.75rem", color: muted, fontFamily: "var(--font-montserrat), sans-serif" }}>{row.calories}</span>
              <span style={{ fontSize: "0.68rem", color: "#555", fontFamily: "var(--font-montserrat), sans-serif", fontStyle: "italic" }}>{row.notes}</span>
            </div>
          ))}
        </div>
      </div>

      <Divider />

      {/* CARBS */}
      <Label>Macronutrient 2</Label>
      <H2>Carbohydrates: fuel, not the enemy</H2>
      <p style={{ fontSize: "0.88rem", color: muted, lineHeight: 1.72, fontFamily: "var(--font-montserrat), sans-serif" }}>
        Carbohydrates are the body&apos;s preferred fuel source for high-intensity exercise. Every gram of carbohydrate stores about 3&ndash;4 grams of water in the muscles alongside it. This is why low-carb diets cause rapid initial scale drops that are not fat. The water leaves, not the fat.
      </p>
      <p style={{ fontSize: "0.88rem", color: muted, lineHeight: 1.72, marginTop: "0.75rem", fontFamily: "var(--font-montserrat), sans-serif" }}>
        For body composition goals with resistance training, carbs matter. They fuel your sessions and support recovery. Research on low-carb diets shows equivalent fat loss results when calories and protein are equated. The diet you can maintain beats the diet that is theoretically optimal.
      </p>

      <CoachNote>
        Low-carb scale drops are mostly water at first. The rapid 3&ndash;5 lb drop in the first week is glycogen and fluid loss, not fat. This is why low-carb feels fast initially but often stalls once water weight normalizes.
      </CoachNote>

      <MythReality
        myth="Eating carbs at night causes fat gain."
        reality="Total daily calorie balance determines fat storage, not the time of day food is eaten. Insulin spikes from carbs do not cause fat gain when you are in a calorie deficit. This has been thoroughly refuted in controlled trials."
      />

      <ScienceBox
        study="Burke LM et al. (2011)"
        finding="Carbohydrates are the dominant fuel for moderate-to-high intensity exercise. Carbohydrate availability significantly affects training performance and recovery. Major sports nutrition bodies support carbohydrate intake around training sessions for performance and body composition goals."
        cite="Burke LM et al. Carbohydrates for training and competition. J Sports Sci. 2011;29(Suppl 1):S17–27."
      />

      <InPractice>
        Prioritise carbohydrates around training: before your session for fuel, after for recovery. Best sources: oats, rice, sweet potato, fruit, whole grain bread, quinoa. These digest cleanly, provide fibre, and keep energy stable compared to refined options.
      </InPractice>

      <Divider />

      {/* FATS */}
      <Label>Macronutrient 3</Label>
      <H2>Dietary fat: essential, not optional</H2>
      <p style={{ fontSize: "0.88rem", color: muted, lineHeight: 1.72, fontFamily: "var(--font-montserrat), sans-serif" }}>
        Fat is required for hormone production, absorption of fat-soluble vitamins (A, D, E, K), cellular membrane integrity, and brain function. Chronically low fat intake suppresses sex hormones in both men and women, affecting energy, mood, recovery, and long-term health.
      </p>
      <p style={{ fontSize: "0.88rem", color: muted, lineHeight: 1.72, marginTop: "0.75rem", fontFamily: "var(--font-montserrat), sans-serif" }}>
        Fat is not what makes you fat. Excess calories do. Fat happens to be the most calorie-dense macro at 9 kcal/gram versus 4 kcal/gram for protein and carbs, so portions matter more. But the macro itself is not the problem.
      </p>

      <ScienceBox
        study="Smith GI et al. (2011)"
        finding="Omega-3 polyunsaturated fatty acid supplementation augmented the rate of muscle protein synthesis in both basal and insulin-stimulated conditions. Omega-3s may support muscle building and recovery beyond their cardiovascular benefits."
        cite="Smith GI et al. Omega-3 polyunsaturated fatty acids augment the muscle protein anabolic response to hyperinsulinaemia-hyperaminoacidaemia in healthy young and middle-aged men and women. Clin Sci. 2011;121(6):267–278."
      />

      <InPractice>
        Best fat sources: salmon (omega-3s), olive oil, avocado, nuts, eggs (yolks included). Minimise trans fats found in processed foods and be mindful of saturated fat from red meat and dairy. These are not forbidden, just tracked. Your fat target from Module 1 will guide appropriate amounts.
      </InPractice>

      <Divider />

      {/* Building a plate */}
      <Label>Putting it together</Label>
      <H2>How to build a plate</H2>
      <p style={{ fontSize: "0.88rem", color: muted, lineHeight: 1.72, fontFamily: "var(--font-montserrat), sans-serif", marginBottom: "1.25rem" }}>
        You don&apos;t need to weigh and log every meal forever. But understanding the structure of a solid plate is the foundation of sustainable eating. Here&apos;s the model for a main meal:
      </p>

      <div style={{ background: dark, border: `1px solid ${border}`, padding: "1.5rem", marginBottom: "1.25rem" }}>
        {[
          { portion: "~½ plate", label: "Protein source", examples: "Chicken, fish, eggs, Greek yogurt, cottage cheese, turkey" },
          { portion: "~¼ plate", label: "Carbohydrate source", examples: "Rice, oats, sweet potato, quinoa, whole grain bread" },
          { portion: "~¼ plate", label: "Vegetables", examples: "Any non-starchy veg — fibre, volume, micronutrients" },
          { portion: "Thumb-sized", label: "Fat source", examples: "Olive oil for cooking, avocado, nuts as a topping" },
        ].map((item) => (
          <div key={item.label} style={{ display: "flex", gap: 16, padding: "0.75rem 0", borderBottom: `1px solid #1a1a1a` }}>
            <span style={{ fontSize: "0.65rem", color: gold, fontFamily: "var(--font-montserrat), sans-serif", fontWeight: 600, width: 90, flexShrink: 0 }}>{item.portion}</span>
            <div>
              <p style={{ fontSize: "0.78rem", fontWeight: 600, color: cream, margin: "0 0 0.2rem", fontFamily: "var(--font-montserrat), sans-serif" }}>{item.label}</p>
              <p style={{ fontSize: "0.72rem", color: "#666", margin: 0, fontFamily: "var(--font-montserrat), sans-serif" }}>{item.examples}</p>
            </div>
          </div>
        ))}
      </div>

      <Divider />

      {/* Hydration */}
      <Label>Often overlooked</Label>
      <H2>Hydration</H2>
      <p style={{ fontSize: "0.88rem", color: muted, lineHeight: 1.72, fontFamily: "var(--font-montserrat), sans-serif", marginBottom: "0.75rem" }}>
        Dehydration of even 2% of body weight measurably reduces strength output, cognitive function, and perceived exertion during training. Your sessions will feel harder than they are. Mild dehydration also activates the same hypothalamic signals as hunger, making you feel hungry when you are simply thirsty.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: "1rem" }}>
        {[
          { label: "Baseline", value: "0.5 oz per lb of bodyweight/day", note: "e.g. 150 lb person = 75 oz (~9 cups)" },
          { label: "During training", value: "+16 oz per hour of exercise", note: "More if sweating heavily or training outdoors" },
        ].map((item) => (
          <div key={item.label} style={{ background: dark, border: `1px solid ${border}`, padding: "1rem" }}>
            <p style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#555", marginBottom: "0.3rem", fontFamily: "var(--font-montserrat), sans-serif" }}>{item.label}</p>
            <p style={{ fontSize: "0.8rem", color: cream, fontFamily: "var(--font-montserrat), sans-serif", margin: "0 0 0.2rem", fontWeight: 600 }}>{item.value}</p>
            <p style={{ fontSize: "0.65rem", color: "#555", margin: 0, fontFamily: "var(--font-montserrat), sans-serif" }}>{item.note}</p>
          </div>
        ))}
      </div>
      <p style={{ fontSize: "0.82rem", color: muted, lineHeight: 1.65, fontFamily: "var(--font-montserrat), sans-serif" }}>
        Plain water is the best source. Coffee and tea count. Alcohol does not. It actively dehydrates. Urine colour is the simplest real-time indicator: pale yellow means good hydration.
      </p>

      <CoachNote>
        One of the most underrated performance variables. Many people training in a mild chronic dehydration state have no idea. Before blaming your program or your diet, make sure you are consistently hitting your water target.
      </CoachNote>

      <Divider />

      {/* What to track */}
      <Label>Tracking guidance</Label>
      <H2>What to track and when to stop</H2>
      <p style={{ fontSize: "0.88rem", color: muted, lineHeight: 1.72, fontFamily: "var(--font-montserrat), sans-serif", marginBottom: "1rem" }}>
        Tracking every macro indefinitely is not sustainable and for most people is not necessary after the initial learning period. Here is a tiered approach:
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {[
          { tier: "Track now", desc: "Use the meal plan in Module 3 for 4 weeks. The structure does the work for you — no app required. This period builds a working mental model of portion sizes and protein content." },
          { tier: "Track protein only", desc: "After 4 weeks, most people can maintain results by tracking just their protein target daily. When protein is consistently met, total calories tend to self-regulate with reasonable food choices." },
          { tier: "Stop tracking", desc: "When you have a solid sense of portions and regularly hit your protein target without thinking about it. Periodic check-ins of 1–2 weeks of tracking per quarter can keep you calibrated." },
        ].map((item, i) => (
          <div key={item.tier} style={{ display: "flex", gap: 12, padding: "0.875rem 1.25rem", background: dark, border: `1px solid ${border}` }}>
            <span style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.5rem", color: `rgba(201,169,110,${0.4 - i * 0.1})`, lineHeight: 1, flexShrink: 0, width: 20, textAlign: "center" }}>{i + 1}</span>
            <div>
              <p style={{ fontSize: "0.72rem", fontWeight: 700, color: gold, marginBottom: "0.3rem", fontFamily: "var(--font-montserrat), sans-serif", letterSpacing: "0.05em" }}>{item.tier}</p>
              <p style={{ fontSize: "0.78rem", color: muted, margin: 0, lineHeight: 1.6, fontFamily: "var(--font-montserrat), sans-serif" }}>{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <CoachNote>
        One restaurant meal with hidden oils and sauces can easily erase a weekly calorie deficit without you realizing it. This does not mean avoid eating out. It means be aware, not obsessive.
      </CoachNote>

      <Divider />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <Link
          href="/nutrition-foundations/module1"
          style={{ fontSize: "0.68rem", color: "#555", fontFamily: "var(--font-montserrat), sans-serif", textDecoration: "none", letterSpacing: "0.1em" }}
        >
          ← Module 1
        </Link>
        <Link
          href="/nutrition-foundations/module3"
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
          Module 3: Your Meal Plan →
        </Link>
      </div>
    </div>
  )
}
