import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Module 4 — Nutrition Foundations | Lisa Fit Method",
}

const gold = "#c9a96e"
const cream = "#f0e6d3"
const muted = "#b0a090"
const dim = "#888"
const border = "#2a2a2a"
const card = "#161616"
const calloutBg = "rgba(201,169,110,0.06)"
const calloutBorder = "rgba(201,169,110,0.25)"

// ── Icon system ───────────────────────────────────────────────────────────────

type IconType = "zap" | "drop" | "check" | "x-circle" | "repeat" | "target" | "layers" | "sun" | "flame" | "trend" | "leaf" | "coffee" | "grain" | "check-plain" | "minus"

function GoldIcon({ type, size = 18 }: { type: IconType; size?: number }) {
  const p = {
    width: size, height: size, viewBox: "0 0 24 24",
    fill: "none", stroke: gold, strokeWidth: "1.5",
    strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
    style: { flexShrink: 0 },
  }
  switch (type) {
    case "zap":        return <svg {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
    case "drop":       return <svg {...p}><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" /></svg>
    case "check":      return <svg {...p}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
    case "x-circle":   return <svg {...p}><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
    case "repeat":     return <svg {...p}><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>
    case "target":     return <svg {...p}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>
    case "layers":     return <svg {...p}><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>
    case "sun":        return <svg {...p}><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
    case "flame":      return <svg {...p}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z" /></svg>
    case "trend":      return <svg {...p}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>
    case "leaf":       return <svg {...p}><path d="M17 8C8 10 5.9 16.17 3.82 22" /><path d="M2 22c3-6 9-14 15-14" /></svg>
    case "coffee":     return <svg {...p}><path d="M18 8h1a4 4 0 0 1 0 8h-1" /><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" /><line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" /></svg>
    case "grain":      return <svg {...p}><line x1="12" y1="2" x2="12" y2="22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
    case "check-plain":return <svg {...p}><polyline points="20 6 9 17 4 12" /></svg>
    case "minus":      return <svg {...p}><line x1="5" y1="12" x2="19" y2="12" /></svg>
    default:           return <svg {...p}><circle cx="12" cy="12" r="10" /></svg>
  }
}

// ── Shared layout components ──────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: "0.65rem", fontWeight: 500, letterSpacing: "0.3em", textTransform: "uppercase", color: gold, marginBottom: "0.75rem", fontFamily: "var(--font-montserrat), sans-serif" }}>
      {children}
    </div>
  )
}

function SectionHeading({ id, num, title }: { id: string; num: string; title: string }) {
  return (
    <div id={id} style={{ scrollMarginTop: "80px", marginBottom: "1.75rem", paddingBottom: "1rem", borderBottom: `1px solid ${border}` }}>
      <div style={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.25em", textTransform: "uppercase", color: gold, marginBottom: "0.4rem", fontFamily: "var(--font-montserrat), sans-serif" }}>
        {num}
      </div>
      <h3 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 400, color: cream, lineHeight: 1.2, margin: 0 }}>
        {title}
      </h3>
    </div>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: "0.88rem", color: muted, lineHeight: 1.65, marginBottom: "1rem" }}>{children}</p>
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: calloutBg, border: `1px solid ${calloutBorder}`, borderLeft: `3px solid ${gold}`, padding: "1rem 1.5rem", marginBottom: "1.5rem" }}>
      <p style={{ fontSize: "0.9rem", color: cream, lineHeight: 1.55, margin: 0, fontStyle: "italic" }}>{children}</p>
    </div>
  )
}

function SectionDivider() {
  return <div style={{ height: 1, background: border, margin: "3rem 0" }} />
}

// ── Section 1: Protein ────────────────────────────────────────────────────────

const proteinSources = [
  { icon: "flame" as IconType, name: "Chicken Breast",          portion: "150g cooked",                      grams: "~45g protein" },
  { icon: "flame" as IconType, name: "White Fish",              portion: "225g cooked",                      grams: "~45g protein" },
  { icon: "flame" as IconType, name: "Shrimp",                  portion: "225g cooked",                      grams: "~45g protein" },
  { icon: "flame" as IconType, name: "Lean Ground Beef",        portion: "200g cooked",                      grams: "~45g protein" },
  { icon: "flame" as IconType, name: "Eggs + Greek Yogurt",     portion: "300g egg whites + 200g Greek yogurt", grams: "~40–45g protein" },
]

function ProteinCard({ name, portion, grams }: { name: string; portion: string; grams: string }) {
  return (
    <div style={{ background: card, border: `1px solid ${border}`, padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.25rem" }}>
        <div style={{ width: 28, height: 28, background: "rgba(201,169,110,0.1)", border: `1px solid ${calloutBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <GoldIcon type="target" size={14} />
        </div>
        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: cream, fontFamily: "var(--font-montserrat), sans-serif", letterSpacing: "0.04em" }}>{name}</span>
      </div>
      <div style={{ fontSize: "0.7rem", color: dim, fontFamily: "var(--font-montserrat), sans-serif", lineHeight: 1.4 }}>{portion}</div>
      <div style={{ fontSize: "0.8rem", fontWeight: 700, color: gold, fontFamily: "var(--font-montserrat), sans-serif", letterSpacing: "0.05em" }}>{grams}</div>
    </div>
  )
}

// ── Section 2: Fuel ───────────────────────────────────────────────────────────

const carbSources = [
  "Rice", "Oats", "Potatoes", "Fruit", "Sourdough", "Rice Cakes", "Pasta",
]

const preMeals = [
  "Chicken, jasmine rice, and fruit",
  "Oats with whey protein and berries",
  "Eggs with sourdough toast and fruit",
]

const postMeals = [
  "Lean ground beef, rice, and vegetables",
  "Salmon, potatoes, and greens",
  "Chicken pasta with parmesan and vegetables",
  "Greek yogurt with whey protein, berries, granola, and nut butter",
]

// ── Section 3: Consistency ────────────────────────────────────────────────────

const mattersItems = [
  { icon: "target" as IconType, label: "Enough Protein" },
  { icon: "leaf" as IconType,   label: "Whole Foods Mostly" },
  { icon: "zap" as IconType,    label: "Fueling Workouts" },
  { icon: "repeat" as IconType, label: "Sustainable Habits" },
  { icon: "trend" as IconType,  label: "Consistency Over Time" },
]

// ── Section 4: Hydration ──────────────────────────────────────────────────────

const dehydrationSigns = [
  { icon: "zap" as IconType,    label: "Fatigue" },
  { icon: "minus" as IconType,  label: "Poor Performance" },
  { icon: "coffee" as IconType, label: "Brain Fog" },
  { icon: "drop" as IconType,   label: "Headaches" },
  { icon: "sun" as IconType,    label: "Dizziness" },
  { icon: "trend" as IconType,  label: "Poor Recovery" },
]

const waterTargets = [
  { weight: "120 lb", liters: "~1.8 L / day" },
  { weight: "160 lb", liters: "~2.4 L / day" },
  { weight: "200 lb", liters: "~3.0 L / day" },
]

// ── Section 5: Basics ─────────────────────────────────────────────────────────

const foundationItems = [
  { icon: "target" as IconType, label: "Enough Protein" },
  { icon: "zap" as IconType,    label: "Proper Fueling" },
  { icon: "drop" as IconType,   label: "Hydration" },
  { icon: "repeat" as IconType, label: "Consistency" },
  { icon: "leaf" as IconType,   label: "Whole Foods" },
  { icon: "trend" as IconType,  label: "Training" },
]

const skipItems = ["Detoxes", "Fat Burners", "Extreme Diets", "Endless Supplements", "Complicated Tracking"]
const doItems   = ["Protein", "Proper Fueling", "Hydration", "Consistency", "Long-Term Habits"]

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Module4Page() {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "3rem 2.5rem 6rem" }} className="course-body">
      <style>{`
        @media (max-width: 768px) { .course-body { padding: 2rem 1rem 6rem !important; } }
        .protein-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        .carb-grid    { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .icon-grid    { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .two-col      { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .water-grid   { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        @media (min-width: 560px) { .protein-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 480px) {
          .carb-grid  { grid-template-columns: repeat(2, 1fr); }
          .icon-grid  { grid-template-columns: repeat(2, 1fr); }
          .two-col    { grid-template-columns: 1fr; }
          .water-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* ── Page header ── */}
      <SectionLabel>Module 4</SectionLabel>
      <h2 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 300, color: cream, lineHeight: 1.2, marginBottom: "1rem" }}>
        Nutrition Foundations
      </h2>
      <div style={{ fontSize: "0.9rem", color: dim, lineHeight: 1.65, maxWidth: 700, marginBottom: "0.75rem" }}>
        This is not a meal plan, a restrictive diet, or a complicated calorie-tracking system. It is five foundational principles that support everything you do in the gym and help you build a strong, healthy body composition without obsessing over food.
      </div>
      <div style={{ fontSize: "0.9rem", color: dim, lineHeight: 1.65, maxWidth: 700, marginBottom: "0.75rem" }}>
        About a year ago, I started taking nutrition seriously for the first time. Not dieting. Not tracking every gram. Just genuinely understanding what my body needed to perform, recover, and build muscle. The difference it made was bigger than almost any training change I had ever made.
      </div>
      <div style={{ fontSize: "0.9rem", color: muted, lineHeight: 1.65, maxWidth: 700, marginBottom: "3rem", paddingBottom: "2rem", borderBottom: `1px solid ${border}`, fontStyle: "italic" }}>
        Food is not separate from fitness. It is part of the foundation.
      </div>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 1 — PROTEIN
      ═══════════════════════════════════════════════════════════ */}
      <SectionHeading id="protein" num="Principle 1" title="Protein Is Your Priority" />

      <P>Protein is what your muscles are built from. When you train, you create small amounts of damage in your muscle fibers. Your body repairs and rebuilds them stronger, but only if it has enough protein available to do that work. Without adequate protein, the effort you put in at the gym does not translate into the results you are after.</P>
      <P>Protein is made up of amino acids, and some of those amino acids are called essential, meaning your body cannot produce them on its own. You have to consume them through food. Those essential amino acids are what drive muscle repair, recovery, and growth. They also support immune function, hormones, enzyme production, and nearly every other system in your body.</P>

      <Callout>A simple daily target is 0.7 to 1 gram of protein per pound of bodyweight. At 150 lbs, that is 105 to 150 grams per day. Split across 3 meals, that means roughly 35 to 50 grams per meal.</Callout>

      <div style={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: dim, fontFamily: "var(--font-montserrat), sans-serif", marginBottom: "0.75rem" }}>
        Protein Sources — 45g Per Meal
      </div>
      <div className="protein-grid" style={{ marginBottom: "1.75rem" }}>
        {proteinSources.map((s) => (
          <ProteinCard key={s.name} name={s.name} portion={s.portion} grams={s.grams} />
        ))}
      </div>

      <P>Focus on getting most of your protein from whole food sources whenever possible. They give your body the nutrients it needs to recover, perform well, and build muscle effectively. Protein shakes can absolutely help you hit your daily target, but they should support your nutrition, not replace real meals.</P>

      <SectionDivider />

      {/* ═══════════════════════════════════════════════════════════
          SECTION 2 — FUEL
      ═══════════════════════════════════════════════════════════ */}
      <SectionHeading id="fuel" num="Principle 2" title="Eat Enough To Train" />

      <P>One of the biggest mistakes beginners make is trying to build strength while constantly under-eating. A lot of people start training and immediately try to eat as little as possible because they think lighter automatically means leaner. In reality, under-fueling your body often leads to poor recovery, low energy, stalled progress, increased cravings, poor performance, hormonal issues, and difficulty building muscle.</P>

      <Callout>Strength training requires fuel. Your body needs enough energy, protein, carbohydrates, fats, vitamins, and minerals to recover properly and adapt to the stress you place on it in the gym.</Callout>

      <P>Carbohydrates are especially important around training because they are your body&apos;s preferred energy source during intense exercise. Eating carbohydrates before your workout helps support performance, strength, focus, and energy levels. Eating them after training helps replenish glycogen stores and improve recovery. The harder the session, the more important fueling becomes.</P>

      {/* Fuel by session */}
      <div style={{ background: card, border: `1px solid ${border}`, padding: "1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: gold, fontFamily: "var(--font-montserrat), sans-serif", marginBottom: "1rem" }}>
          Fuel Depends On The Session
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {[
            { icon: "zap" as IconType, label: "Heavy lower body or glute day", level: "Higher fuel needs", barWidth: "90%" },
            { icon: "flame" as IconType, label: "Upper body or mixed session", level: "Moderate fuel needs", barWidth: "60%" },
            { icon: "leaf" as IconType, label: "Mobility or rest day", level: "Lower fuel needs", barWidth: "35%" },
          ].map((row) => (
            <div key={row.label} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ width: 28, height: 28, background: "rgba(201,169,110,0.08)", border: `1px solid ${calloutBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <GoldIcon type={row.icon} size={13} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "0.7rem", color: muted, fontFamily: "var(--font-montserrat), sans-serif", marginBottom: "0.25rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.label}</div>
                <div style={{ height: 3, background: border, borderRadius: 2 }}>
                  <div style={{ height: "100%", width: row.barWidth, background: gold, borderRadius: 2 }} />
                </div>
              </div>
              <div style={{ fontSize: "0.6rem", color: gold, fontFamily: "var(--font-montserrat), sans-serif", letterSpacing: "0.05em", flexShrink: 0 }}>{row.level}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Carb timing */}
      <div style={{ background: card, border: `1px solid ${border}`, padding: "1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: gold, fontFamily: "var(--font-montserrat), sans-serif", marginBottom: "1rem" }}>
          Carbs Around Training
        </div>
        <div className="two-col">
          {[
            { label: "Before Training", items: ["Supports energy + strength", "Improves focus and performance", "Helps you train harder"] },
            { label: "After Training",  items: ["Replenishes glycogen stores", "Supports recovery", "Reduces muscle breakdown"] },
          ].map((col) => (
            <div key={col.label} style={{ background: "rgba(201,169,110,0.04)", border: `1px solid ${border}`, padding: "1rem" }}>
              <div style={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: gold, fontFamily: "var(--font-montserrat), sans-serif", marginBottom: "0.75rem" }}>{col.label}</div>
              {col.items.map((item) => (
                <div key={item} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", marginBottom: "0.4rem" }}>
                  <GoldIcon type="check-plain" size={12} />
                  <span style={{ fontSize: "0.72rem", color: muted, fontFamily: "var(--font-montserrat), sans-serif", lineHeight: 1.4 }}>{item}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Carb sources */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: dim, fontFamily: "var(--font-montserrat), sans-serif", marginBottom: "0.75rem" }}>
          Simple Carbohydrate Sources
        </div>
        <div className="carb-grid">
          {carbSources.map((s) => (
            <div key={s} style={{ background: card, border: `1px solid ${border}`, padding: "0.65rem 0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <GoldIcon type="grain" size={13} />
              <span style={{ fontSize: "0.72rem", color: muted, fontFamily: "var(--font-montserrat), sans-serif" }}>{s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Meal examples */}
      <div style={{ background: card, border: `1px solid ${border}`, padding: "1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: gold, fontFamily: "var(--font-montserrat), sans-serif", marginBottom: "1rem" }}>
          Balanced Meal Examples
        </div>
        <div className="two-col">
          {[
            { label: "Pre-Workout", meals: preMeals },
            { label: "Post-Workout", meals: postMeals },
          ].map((col) => (
            <div key={col.label}>
              <div style={{ fontSize: "0.58rem", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: dim, fontFamily: "var(--font-montserrat), sans-serif", marginBottom: "0.6rem" }}>{col.label}</div>
              {col.meals.map((m) => (
                <div key={m} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", marginBottom: "0.6rem" }}>
                  <div style={{ marginTop: "0.2rem", flexShrink: 0 }}><GoldIcon type="check-plain" size={11} /></div>
                  <span style={{ fontSize: "0.72rem", color: muted, fontFamily: "var(--font-montserrat), sans-serif", lineHeight: 1.45 }}>{m}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <P>If your goal is fat loss, you do not necessarily need to remove carbohydrates completely. In many cases it makes more sense to reduce unnecessary carbohydrates later in the evening while still properly fueling around your workouts. If you are constantly tired, sore for days, struggling to recover between sessions, not progressing in strength, or losing motivation, there is a good chance you are simply not eating enough.</P>

      <SectionDivider />

      {/* ═══════════════════════════════════════════════════════════
          SECTION 3 — CONSISTENCY
      ═══════════════════════════════════════════════════════════ */}
      <SectionHeading id="consistency" num="Principle 3" title="Consistency Beats Perfection" />

      <P>One bad meal does not ruin your progress. One perfect meal does not build your body either. Your results come from the pattern you repeat consistently over weeks, months, and years.</P>
      <P>One of the biggest mistakes people make with nutrition is treating it like an all or nothing process. They eat perfectly for a few days, slip once, then convince themselves they failed and restart over and over again.</P>

      <Callout>Real progress does not come from perfection. It comes from consistency.</Callout>

      {/* What actually matters */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: dim, fontFamily: "var(--font-montserrat), sans-serif", marginBottom: "0.75rem" }}>
          What Actually Matters
        </div>
        <div className="icon-grid">
          {mattersItems.map((item) => (
            <div key={item.label} style={{ background: card, border: `1px solid ${border}`, padding: "1rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", textAlign: "center" }}>
              <div style={{ width: 32, height: 32, background: "rgba(201,169,110,0.08)", border: `1px solid ${calloutBorder}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <GoldIcon type={item.icon} size={15} />
              </div>
              <span style={{ fontSize: "0.65rem", color: muted, fontFamily: "var(--font-montserrat), sans-serif", letterSpacing: "0.05em", lineHeight: 1.3 }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* All or nothing trap */}
      <div style={{ background: card, border: `1px solid ${border}`, padding: "1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: dim, fontFamily: "var(--font-montserrat), sans-serif", marginBottom: "1rem" }}>
          The All-Or-Nothing Trap
        </div>
        <div className="two-col">
          <div style={{ border: `1px solid ${border}`, padding: "1rem" }}>
            <div style={{ fontSize: "0.58rem", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "#666", fontFamily: "var(--font-montserrat), sans-serif", marginBottom: "0.75rem" }}>Perfection Mindset</div>
            {["Restriction", "Guilt after slip-ups", "Constantly restarting", "Unsustainable"].map((t) => (
              <div key={t} style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.4rem" }}>
                <GoldIcon type="x-circle" size={12} />
                <span style={{ fontSize: "0.7rem", color: "#666", fontFamily: "var(--font-montserrat), sans-serif" }}>{t}</span>
              </div>
            ))}
          </div>
          <div style={{ border: `1px solid ${calloutBorder}`, background: "rgba(201,169,110,0.04)", padding: "1rem" }}>
            <div style={{ fontSize: "0.58rem", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: gold, fontFamily: "var(--font-montserrat), sans-serif", marginBottom: "0.75rem" }}>Consistency Mindset</div>
            {["Flexibility", "Balance", "Long-term habits", "Sustainable"].map((t) => (
              <div key={t} style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.4rem" }}>
                <GoldIcon type="check" size={12} />
                <span style={{ fontSize: "0.7rem", color: muted, fontFamily: "var(--font-montserrat), sans-serif" }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Real life strip */}
      <div style={{ background: card, border: `1px solid ${border}`, padding: "1.25rem 1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: dim, fontFamily: "var(--font-montserrat), sans-serif", marginBottom: "0.75rem" }}>
          Real Life Still Exists
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {["Vacations", "Dinners out", "Birthdays", "Weekends", "Desserts"].map((t) => (
            <div key={t} style={{ background: "rgba(201,169,110,0.06)", border: `1px solid ${calloutBorder}`, padding: "0.35rem 0.85rem" }}>
              <span style={{ fontSize: "0.65rem", color: gold, fontFamily: "var(--font-montserrat), sans-serif", letterSpacing: "0.06em" }}>{t}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: "0.75rem", fontSize: "0.78rem", color: dim, fontFamily: "var(--font-montserrat), sans-serif", lineHeight: 1.5 }}>
          None of these erase your progress. What matters is what you consistently return to afterward.
        </div>
      </div>

      <Callout>Fitness should support your life, not control it.</Callout>

      <SectionDivider />

      {/* ═══════════════════════════════════════════════════════════
          SECTION 4 — HYDRATION
      ═══════════════════════════════════════════════════════════ */}
      <SectionHeading id="hydration" num="Principle 4" title="Hydration Affects Everything" />

      <P>Hydration affects far more than just thirst. Even mild dehydration can negatively impact performance, strength, recovery, focus, digestion, energy levels, and joint health. A lot of people underestimate how much water intake affects how they feel and perform in the gym.</P>

      <Callout>Even mild dehydration can negatively impact performance. Low energy, headaches, dizziness, poor pumps, brain fog, and excessive fatigue are sometimes simply signs of inadequate hydration.</Callout>

      {/* Signs of under-hydration */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: dim, fontFamily: "var(--font-montserrat), sans-serif", marginBottom: "0.75rem" }}>
          Signs of Under-Hydration
        </div>
        <div className="icon-grid">
          {dehydrationSigns.map((s) => (
            <div key={s.label} style={{ background: card, border: `1px solid ${border}`, padding: "0.85rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <GoldIcon type={s.icon} size={14} />
              <span style={{ fontSize: "0.68rem", color: muted, fontFamily: "var(--font-montserrat), sans-serif" }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Water targets */}
      <div style={{ background: card, border: `1px solid ${border}`, padding: "1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: gold, fontFamily: "var(--font-montserrat), sans-serif", marginBottom: "0.5rem" }}>
          Daily Water Target
        </div>
        <div style={{ fontSize: "0.75rem", color: dim, fontFamily: "var(--font-montserrat), sans-serif", marginBottom: "1rem", lineHeight: 1.4 }}>
          ~half your bodyweight in ounces per day
        </div>
        <div className="water-grid">
          {waterTargets.map((t) => (
            <div key={t.weight} style={{ background: "rgba(201,169,110,0.04)", border: `1px solid ${calloutBorder}`, padding: "1rem", textAlign: "center" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: cream, fontFamily: "var(--font-montserrat), sans-serif", marginBottom: "0.3rem" }}>{t.weight}</div>
              <div style={{ width: "40%", height: 2, background: gold, margin: "0.4rem auto" }} />
              <div style={{ fontSize: "0.75rem", color: gold, fontFamily: "var(--font-montserrat), sans-serif", fontWeight: 600 }}>{t.liters}</div>
            </div>
          ))}
        </div>
      </div>

      {/* When needs increase */}
      <div style={{ background: card, border: `1px solid ${border}`, padding: "1.25rem 1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: dim, fontFamily: "var(--font-montserrat), sans-serif", marginBottom: "0.75rem" }}>
          Hydration Needs Increase When
        </div>
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          {["Intense Training", "Hot Climate", "High Sweat Output", "High Caffeine Intake", "Long Workouts"].map((t) => (
            <div key={t} style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "rgba(201,169,110,0.06)", border: `1px solid ${calloutBorder}`, padding: "0.35rem 0.75rem" }}>
              <GoldIcon type="drop" size={11} />
              <span style={{ fontSize: "0.65rem", color: muted, fontFamily: "var(--font-montserrat), sans-serif" }}>{t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Electrolytes */}
      <div style={{ background: calloutBg, border: `1px solid ${calloutBorder}`, borderLeft: `3px solid ${gold}`, padding: "1.25rem 1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: gold, fontFamily: "var(--font-montserrat), sans-serif", marginBottom: "0.5rem" }}>
          Electrolytes Matter Too
        </div>
        <div style={{ fontSize: "0.78rem", color: muted, lineHeight: 1.55 }}>
          Sodium, potassium, and magnesium all play important roles in muscle contractions, hydration balance, recovery, and performance. Especially relevant if you sweat heavily or train at high volume.
        </div>
      </div>

      <Callout>Hydration is one of the simplest things you can improve, yet it directly affects nearly every part of your training and recovery.</Callout>

      <SectionDivider />

      {/* ═══════════════════════════════════════════════════════════
          SECTION 5 — DON'T COMPLICATE IT
      ═══════════════════════════════════════════════════════════ */}
      <SectionHeading id="basics" num="Principle 5" title="Don't Complicate It Until You've Mastered The Basics" />

      <P>One of the biggest mistakes beginners make is focusing on optimization before they have even mastered the fundamentals. Meal timing, detailed macro tracking, supplements, intermittent fasting, fat burners, detoxes, carb cycling — none of those things matter much if the basics are not already in place.</P>

      <Callout>Most people do not need more complexity. They need more consistency.</Callout>

      {/* Foundation first */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: dim, fontFamily: "var(--font-montserrat), sans-serif", marginBottom: "0.75rem" }}>
          What Actually Matters Most
        </div>
        <div className="icon-grid">
          {foundationItems.map((item) => (
            <div key={item.label} style={{ background: card, border: `1px solid ${border}`, padding: "1rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", textAlign: "center" }}>
              <div style={{ width: 32, height: 32, background: "rgba(201,169,110,0.08)", border: `1px solid ${calloutBorder}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <GoldIcon type={item.icon} size={15} />
              </div>
              <span style={{ fontSize: "0.65rem", color: muted, fontFamily: "var(--font-montserrat), sans-serif", letterSpacing: "0.04em", lineHeight: 1.3 }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stop chasing shortcuts */}
      <div style={{ background: card, border: `1px solid ${border}`, padding: "1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: dim, fontFamily: "var(--font-montserrat), sans-serif", marginBottom: "1rem" }}>
          Stop Chasing Shortcuts
        </div>
        <div className="two-col">
          <div style={{ border: `1px solid ${border}`, padding: "1rem" }}>
            <div style={{ fontSize: "0.58rem", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "#666", fontFamily: "var(--font-montserrat), sans-serif", marginBottom: "0.75rem" }}>Skip These</div>
            {skipItems.map((t) => (
              <div key={t} style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.4rem" }}>
                <GoldIcon type="x-circle" size={12} />
                <span style={{ fontSize: "0.7rem", color: "#666", fontFamily: "var(--font-montserrat), sans-serif" }}>{t}</span>
              </div>
            ))}
          </div>
          <div style={{ border: `1px solid ${calloutBorder}`, background: "rgba(201,169,110,0.04)", padding: "1rem" }}>
            <div style={{ fontSize: "0.58rem", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: gold, fontFamily: "var(--font-montserrat), sans-serif", marginBottom: "0.75rem" }}>Focus On These</div>
            {doItems.map((t) => (
              <div key={t} style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.4rem" }}>
                <GoldIcon type="check" size={12} />
                <span style={{ fontSize: "0.7rem", color: muted, fontFamily: "var(--font-montserrat), sans-serif" }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pyramid */}
      <div style={{ background: card, border: `1px solid ${border}`, padding: "1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: gold, fontFamily: "var(--font-montserrat), sans-serif", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <GoldIcon type="layers" size={14} />
          Foundation First
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div style={{ background: border, padding: "0.6rem 1rem" }}>
            <div style={{ fontSize: "0.6rem", color: dim, fontFamily: "var(--font-montserrat), sans-serif", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.3rem" }}>Advanced — later</div>
            <div style={{ fontSize: "0.72rem", color: "#555", fontFamily: "var(--font-montserrat), sans-serif" }}>Supplements · Meal timing · Macro tracking · Advanced optimization</div>
          </div>
          <div style={{ background: "rgba(201,169,110,0.08)", border: `1px solid ${calloutBorder}`, padding: "0.75rem 1rem" }}>
            <div style={{ fontSize: "0.6rem", color: gold, fontFamily: "var(--font-montserrat), sans-serif", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.3rem" }}>Foundation — master this first</div>
            <div style={{ fontSize: "0.72rem", color: muted, fontFamily: "var(--font-montserrat), sans-serif" }}>Protein · Hydration · Recovery · Consistency · Whole foods · Training</div>
          </div>
        </div>
      </div>

      <P>A lot of fitness marketing makes people believe they are one supplement, one hack, or one perfect diet away from transforming their body. In reality, long-term results almost always come from mastering basic habits and repeating them consistently. Advanced strategies can help later, but they are never a substitute for a strong foundation.</P>

      <Callout>Master the basics before adding complexity. The same principle that applies to your training applies here too.</Callout>

      {/* ═══════════════════════════════════════════════════════════
          WHAT'S NEXT
      ═══════════════════════════════════════════════════════════ */}
      <div id="next" style={{ textAlign: "center", padding: "4rem 0", borderTop: `1px solid ${border}`, maxWidth: 600, margin: "3rem auto 0" }}>
        <h2 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 300, color: cream, marginBottom: "1.5rem", lineHeight: 1.2 }}>
          You finished.<br />
          <em>That&apos;s already more<br />than most people do.</em>
        </h2>
        <p style={{ fontSize: "0.9rem", color: dim, lineHeight: 1.6, marginBottom: "1rem" }}>
          A lot of people buy guides and never open them. You not only opened this one, you worked through it. You now understand how to move well, why your glutes and core matter more than most people realize, how to structure your training, and how to fuel it. That foundation took most coaches years to learn. You built it in four weeks.
        </p>
        <p style={{ fontSize: "0.9rem", color: dim, lineHeight: 1.6, marginBottom: "1rem" }}>
          Everything you do from here will be better because of it.
        </p>
        <div style={{ marginTop: "1rem", padding: "2rem", background: card, border: `1px solid ${border}`, textAlign: "left" }}>
          <SectionLabel>Follow along on Instagram and TikTok</SectionLabel>
          <p style={{ fontSize: "0.88rem", color: dim, marginBottom: "0.75rem" }}>
            Weekly form breakdowns, training tips, and honest content built on the same principles in this guide. That is also where you will hear about everything coming next first, including the program that picks up exactly where this one leaves off.
          </p>
          <div style={{ fontSize: "0.8rem", fontWeight: 500, letterSpacing: "0.2em", color: gold }}>@lisafitmethod</div>
        </div>
        <div style={{ marginTop: "1rem", padding: "2rem", background: card, border: `1px solid ${border}`, textAlign: "left" }}>
          <SectionLabel>Questions or want more structure?</SectionLabel>
          <p style={{ fontSize: "0.88rem", color: dim }}>
            DM me at @lisafitmethod on Instagram or TikTok. I read everything.
          </p>
        </div>
        <p style={{ marginTop: "2rem", fontSize: "0.88rem", color: dim }}>
          Thank you for trusting me with your training. Now go do the work.
        </p>
        <div style={{ fontFamily: "var(--font-cormorant), serif", fontStyle: "italic", fontSize: "1.5rem", color: cream, marginTop: "2.5rem" }}>
          Lisa McPherson
        </div>
      </div>

      <div style={{ display: "flex", gap: "1rem", marginTop: "3rem", paddingTop: "2rem", borderTop: `1px solid ${border}` }}>
        <Link href="/training-foundations/module3" style={{ display: "inline-block", background: "none", color: gold, border: `1px solid ${gold}`, padding: "0.85rem 2rem", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", textDecoration: "none", fontFamily: "var(--font-montserrat), sans-serif" }}>
          Module 3
        </Link>
      </div>
    </div>
  )
}
