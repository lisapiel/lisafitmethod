import { Document, Page, View, Text, StyleSheet, pdf } from "@react-pdf/renderer"
import { createElement } from "react"

const GOLD = "#c8a97e"
const INK = "#0a0a0a"
const DARK = "#0d0b08"
const CREAM = "#faf8f5"
const MUTED = "#6b6560"
const BORDER = "#ddd8d0"
const FOUNDING_DATE = "December 1, 2026"

const styles = StyleSheet.create({
  page: {
    backgroundColor: CREAM,
    padding: "48 52 52 52",
    fontFamily: "Helvetica",
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: GOLD,
    paddingBottom: 14,
    marginBottom: 28,
  },
  brandLabel: {
    fontSize: 7,
    letterSpacing: 3,
    color: GOLD,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: INK,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 9,
    color: MUTED,
    letterSpacing: 0.5,
  },
  intro: {
    fontSize: 9.5,
    color: MUTED,
    lineHeight: 1.65,
    marginBottom: 24,
  },
  movementBlock: {
    marginBottom: 20,
    borderLeftWidth: 2,
    borderLeftColor: GOLD,
    paddingLeft: 12,
  },
  movementHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 5,
  },
  movementNumber: {
    fontSize: 7,
    color: GOLD,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 2,
    marginRight: 8,
    textTransform: "uppercase",
  },
  movementName: {
    fontSize: 12.5,
    fontFamily: "Helvetica-Bold",
    color: INK,
    letterSpacing: 0.3,
  },
  patternTag: {
    fontSize: 6.5,
    color: GOLD,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  movementDesc: {
    fontSize: 8.5,
    color: MUTED,
    lineHeight: 1.6,
    marginBottom: 7,
  },
  cuesLabel: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    color: INK,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 5,
  },
  cueRow: {
    flexDirection: "row",
    marginBottom: 3,
    alignItems: "flex-start",
  },
  cueDot: {
    fontSize: 7,
    color: GOLD,
    marginRight: 6,
    marginTop: 1,
  },
  cueText: {
    fontSize: 8.5,
    color: INK,
    lineHeight: 1.5,
    flex: 1,
  },
  divider: {
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
    marginBottom: 20,
  },
  footer: {
    position: "absolute",
    bottom: 32,
    left: 52,
    right: 52,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 0.5,
    borderTopColor: BORDER,
    paddingTop: 10,
  },
  footerText: {
    fontSize: 7,
    color: MUTED,
    letterSpacing: 0.5,
  },
  footerBrand: {
    fontSize: 7,
    color: GOLD,
    letterSpacing: 1,
  },
})

const movements = [
  {
    number: "01",
    name: "Goblet Squat",
    pattern: "Knee Dominant",
    desc: "The entry point for lower-body strength. Holding the weight in front forces an upright torso and teaches the hips to load correctly before you ever touch a barbell.",
    cues: [
      "Feet shoulder-width, toes turned out 10–15°",
      "Brace your core before you descend — ribcage down, not flared",
      "Drive your knees out over your toes throughout the movement",
      "Push the floor away, squeeze glutes fully at the top",
    ],
  },
  {
    number: "02",
    name: "Romanian Deadlift",
    pattern: "Hip Hinge",
    desc: "Teaches you to load the posterior chain — hamstrings and glutes — through a proper hip hinge. One of the highest-value patterns for both aesthetics and injury prevention.",
    cues: [
      "Soft bend in the knees; this is not a squat",
      "Push your hips back as the weight lowers — feel the stretch in your hamstrings",
      "Keep the bar or dumbbells dragging close to your legs",
      "Drive hips forward to stand — squeeze glutes at lockout",
    ],
  },
  {
    number: "03",
    name: "Dumbbell Row",
    pattern: "Horizontal Pull",
    desc: "Builds the upper back and rear delts that balance pressing work and fix the forward-shoulder posture most of us develop from daily life.",
    cues: [
      "Brace your core and keep a neutral spine — no rotation",
      "Initiate by pulling your elbow back, not shrugging your shoulder",
      "Drive the elbow past your torso; pause at the top",
      "Lower under control — the eccentric builds as much muscle as the pull",
    ],
  },
  {
    number: "04",
    name: "Push-Up / Dumbbell Press",
    pattern: "Horizontal Push",
    desc: "The fundamental pressing pattern. When loaded correctly, it builds chest, shoulders, and triceps while demanding core stability the entire time.",
    cues: [
      "Body in one rigid line from head to heels — no sagging hips",
      "Hands just outside shoulder-width; elbows track at 45°, not 90°",
      "Chest to the floor (push-up) or elbows below the bench (press)",
      "Press until elbows are fully extended; don't lose the shoulder pack",
    ],
  },
  {
    number: "05",
    name: "Pallof Press",
    pattern: "Core / Anti-Rotation",
    desc: "Real core training isn't crunches — it's resisting unwanted motion. The Pallof Press teaches your trunk to stay locked while your arms move, which is exactly what the spine needs.",
    cues: [
      "Stand perpendicular to the cable or band anchor",
      "Press the handle straight out from your sternum — slow and controlled",
      "Resist the pull; your torso should not rotate at all",
      "Hold 1–2 seconds extended, return to chest with the same control",
    ],
  },
]

const upsellStyles = StyleSheet.create({
  upsellPage: {
    backgroundColor: DARK,
    padding: "52 52 64 52",
    fontFamily: "Helvetica",
  },
  upsellHeader: {
    borderBottomWidth: 1,
    borderBottomColor: GOLD,
    paddingBottom: 14,
    marginBottom: 28,
  },
  upsellBrand: {
    fontSize: 7,
    letterSpacing: 3,
    color: GOLD,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  upsellHeadline: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: "#f5f2ee",
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  upsellSub: {
    fontSize: 9,
    color: "rgba(200,169,126,0.6)",
    letterSpacing: 0.3,
  },
  productBlock: {
    padding: "18 20",
    marginBottom: 10,
    borderLeftWidth: 2,
    borderLeftColor: GOLD,
    backgroundColor: "#161616",
  },
  productTag: {
    fontSize: 7,
    letterSpacing: 2,
    color: GOLD,
    textTransform: "uppercase",
    marginBottom: 5,
  },
  productName: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#f5f2ee",
    marginBottom: 5,
  },
  productDesc: {
    fontSize: 8.5,
    color: "rgba(245,242,238,0.45)",
    lineHeight: 1.6,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginBottom: 4,
  },
  strikePrice: {
    fontSize: 9,
    color: "rgba(245,242,238,0.25)",
    textDecoration: "line-through",
  },
  bigPrice: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: GOLD,
  },
  priceBadge: {
    fontSize: 6.5,
    color: INK,
    backgroundColor: GOLD,
    padding: "2 6",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  foundingNote: {
    fontSize: 7.5,
    color: "rgba(245,242,238,0.2)",
    marginBottom: 8,
  },
  urlText: {
    fontSize: 8.5,
    color: GOLD,
    textDecoration: "underline",
  },
  bundleBlock: {
    padding: "18 20",
    marginBottom: 10,
    backgroundColor: "#1a1208",
    borderTopWidth: 2,
    borderTopColor: GOLD,
  },
  bundleTag: {
    fontSize: 7,
    letterSpacing: 2,
    color: GOLD,
    textTransform: "uppercase",
    marginBottom: 5,
  },
  bundleName: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#f5f2ee",
    marginBottom: 5,
  },
  bundleDesc: {
    fontSize: 8.5,
    color: "rgba(245,242,238,0.45)",
    lineHeight: 1.6,
    marginBottom: 8,
  },
  upsellFooter: {
    position: "absolute",
    bottom: 32,
    left: 52,
    right: 52,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 0.5,
    borderTopColor: "#2a2a2a",
    paddingTop: 10,
  },
  upsellFooterText: {
    fontSize: 7,
    color: "rgba(245,242,238,0.2)",
    letterSpacing: 0.5,
  },
  upsellFooterBrand: {
    fontSize: 7,
    color: GOLD,
    letterSpacing: 1,
  },
})

function GuidePDF() {
  return createElement(
    Document,
    { title: "5 Foundation Movements — Lisa Fit Method" },
    // Page 1: cheat sheet
    createElement(
      Page,
      { size: "A4", style: styles.page },
      // Header
      createElement(
        View,
        { style: styles.header },
        createElement(Text, { style: styles.brandLabel }, "Lisa Fit Method"),
        createElement(Text, { style: styles.title }, "5 Foundation Movements"),
        createElement(Text, { style: styles.subtitle }, "Coaching cues for each pattern · Lisa McPherson, CPT")
      ),
      // Intro
      createElement(
        Text,
        { style: styles.intro },
        "These five patterns are the backbone of the 4-Week Training Foundations program. Master the cues below and every exercise in the course will feel like a natural extension of what you already know."
      ),
      // Movements
      ...movements.flatMap((m, i) => {
        const block = createElement(
          View,
          { style: styles.movementBlock, key: m.number },
          createElement(
            View,
            { style: styles.movementHeader },
            createElement(Text, { style: styles.movementNumber }, m.number),
            createElement(Text, { style: styles.movementName }, m.name)
          ),
          createElement(Text, { style: styles.patternTag }, m.pattern),
          createElement(Text, { style: styles.movementDesc }, m.desc),
          createElement(Text, { style: styles.cuesLabel }, "Key Cues"),
          ...m.cues.map((cue, ci) =>
            createElement(
              View,
              { style: styles.cueRow, key: ci },
              createElement(Text, { style: styles.cueDot }, "▸"),
              createElement(Text, { style: styles.cueText }, cue)
            )
          )
        )
        const divider = i < movements.length - 1
          ? createElement(View, { style: styles.divider, key: `div-${i}` })
          : null
        return divider ? [block, divider] : [block]
      }),
      // Footer
      createElement(
        View,
        { style: styles.footer, fixed: true },
        createElement(Text, { style: styles.footerText }, "Lisa McPherson, CPT · Training Foundations"),
        createElement(Text, { style: styles.footerBrand }, "lisafitmethod.com")
      )
    ),
    // Page 2: upsell
    createElement(
      Page,
      { size: "A4", style: upsellStyles.upsellPage },
      createElement(
        View,
        { style: upsellStyles.upsellHeader },
        createElement(Text, { style: upsellStyles.upsellBrand }, "Lisa Fit Method"),
        createElement(Text, { style: upsellStyles.upsellHeadline }, "Ready to go further?"),
        createElement(Text, { style: upsellStyles.upsellSub }, "Founding member pricing. Regular prices take effect " + FOUNDING_DATE + ".")
      ),
      // Training Foundations
      createElement(
        View,
        { style: upsellStyles.productBlock },
        createElement(Text, { style: upsellStyles.productTag }, "Training Foundations"),
        createElement(Text, { style: upsellStyles.productName }, "The 4-Week Strength Program"),
        createElement(Text, { style: upsellStyles.productDesc }, "Five foundational movements, 50+ exercise videos, built-in workout tracking, and progressive overload from week one. Three structured training days per week."),
        createElement(
          View,
          { style: upsellStyles.priceRow },
          createElement(Text, { style: upsellStyles.strikePrice }, "$147"),
          createElement(Text, { style: upsellStyles.bigPrice }, "$97"),
          createElement(Text, { style: upsellStyles.priceBadge }, "Founding Price")
        ),
        createElement(Text, { style: upsellStyles.foundingNote }, "Regular $147 from " + FOUNDING_DATE + ". One-time payment, lifetime access."),
        createElement(Text, { style: upsellStyles.urlText }, "lisafitmethod.com/courses")
      ),
      // Nutrition Foundations
      createElement(
        View,
        { style: upsellStyles.productBlock },
        createElement(Text, { style: upsellStyles.productTag }, "Nutrition Foundations"),
        createElement(Text, { style: upsellStyles.productName }, "The 4-Week Nutrition Course"),
        createElement(Text, { style: upsellStyles.productDesc }, "Personalized TDEE calculator, a meal plan that adapts to your calorie target, real verified recipes with source attribution, and science-backed content with research citations throughout."),
        createElement(
          View,
          { style: upsellStyles.priceRow },
          createElement(Text, { style: upsellStyles.strikePrice }, "$127"),
          createElement(Text, { style: upsellStyles.bigPrice }, "$77"),
          createElement(Text, { style: upsellStyles.priceBadge }, "Founding Price")
        ),
        createElement(Text, { style: upsellStyles.foundingNote }, "Regular $127 from " + FOUNDING_DATE + ". One-time payment, lifetime access."),
        createElement(Text, { style: upsellStyles.urlText }, "lisafitmethod.com/nutrition")
      ),
      // Bundle
      createElement(
        View,
        { style: upsellStyles.bundleBlock },
        createElement(Text, { style: upsellStyles.bundleTag }, "Foundations Bundle — Best Value"),
        createElement(Text, { style: upsellStyles.bundleName }, "Both Courses Together"),
        createElement(Text, { style: upsellStyles.bundleDesc }, "Training Foundations + Nutrition Foundations. $174 if bought separately."),
        createElement(
          View,
          { style: upsellStyles.priceRow },
          createElement(Text, { style: upsellStyles.strikePrice }, "$174"),
          createElement(Text, { style: upsellStyles.bigPrice }, "$137"),
          createElement(Text, { style: upsellStyles.priceBadge }, "Save $37")
        ),
        createElement(Text, { style: upsellStyles.foundingNote }, "One-time payment, lifetime access to both courses."),
        createElement(Text, { style: upsellStyles.urlText }, "lisafitmethod.com/checkout?product=bundle")
      ),
      // Footer
      createElement(
        View,
        { style: upsellStyles.upsellFooter, fixed: true },
        createElement(Text, { style: upsellStyles.upsellFooterText }, "Lisa McPherson, CPT · lisafitmethod.com"),
        createElement(Text, { style: upsellStyles.upsellFooterBrand }, "lisafitmethod.com")
      )
    )
  )
}

export async function generateGuidePDF(): Promise<Buffer> {
  const stream = await pdf(createElement(GuidePDF)).toBuffer()
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = []
    stream.on("data", (chunk: Buffer) => chunks.push(chunk))
    stream.on("end", () => resolve(Buffer.concat(chunks)))
    stream.on("error", reject)
  })
}
