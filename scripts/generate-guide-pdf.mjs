// Run once with: node scripts/generate-guide-pdf.mjs
// Outputs public/downloads/lisa-fit-method-5-foundations.pdf

import { Document, Page, View, Text, StyleSheet, pdf } from "@react-pdf/renderer"
import { createElement } from "react"
import { writeFileSync, mkdirSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))

const GOLD = "#c8a97e"
const GOLD_DEEP = "#a8895e"
const INK = "#0a0a0a"
const CREAM = "#faf8f5"
const PANEL = "#f0ebe2"
const MUTED = "#6b6560"
const BORDER = "#ddd8d0"
const DARK = "#111111"
const DARK_CARD = "#161616"

const s = StyleSheet.create({
  page: { backgroundColor: CREAM, padding: "44 50 50 50", fontFamily: "Helvetica" },

  header: { borderBottomWidth: 1.5, borderBottomColor: GOLD, paddingBottom: 12, marginBottom: 22 },
  brandLabel: { fontSize: 6.5, letterSpacing: 2.5, color: GOLD, textTransform: "uppercase", marginBottom: 5 },
  title: { fontSize: 20, fontFamily: "Helvetica-Bold", color: INK, letterSpacing: 0.3, marginBottom: 3 },
  subtitle: { fontSize: 8, color: MUTED, letterSpacing: 0.4 },
  intro: { fontSize: 9, color: MUTED, lineHeight: 1.6, marginBottom: 20 },

  movementBlock: { marginBottom: 16, borderLeftWidth: 2, borderLeftColor: GOLD, paddingLeft: 10 },
  movementHeader: { flexDirection: "row", alignItems: "baseline", marginBottom: 3 },
  movementNumber: { fontSize: 6, color: GOLD, fontFamily: "Helvetica-Bold", letterSpacing: 1.5, marginRight: 7 },
  movementName: { fontSize: 11, fontFamily: "Helvetica-Bold", color: INK, letterSpacing: 0.2 },
  patternTag: { fontSize: 6, color: GOLD_DEEP, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 3 },
  movementDesc: { fontSize: 7.5, color: MUTED, lineHeight: 1.55, marginBottom: 6 },
  cuesLabel: { fontSize: 6, fontFamily: "Helvetica-Bold", color: INK, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 4 },
  cueRow: { flexDirection: "row", marginBottom: 2.5, alignItems: "flex-start" },
  cueDot: { fontSize: 7, color: GOLD, marginRight: 5, marginTop: 0.5 },
  cueText: { fontSize: 7.5, color: INK, lineHeight: 1.45, flex: 1 },
  watchText: { fontSize: 7, color: MUTED, fontStyle: "italic", marginTop: 3 },

  divider: { borderBottomWidth: 0.5, borderBottomColor: BORDER, marginBottom: 16, marginTop: 2 },

  // Day A page
  dayPage: { backgroundColor: DARK, padding: "44 50 50 50", fontFamily: "Helvetica" },
  dayHeader: { borderBottomWidth: 1.5, borderBottomColor: GOLD, paddingBottom: 12, marginBottom: 20 },
  dayBrand: { fontSize: 6.5, letterSpacing: 2.5, color: GOLD, textTransform: "uppercase", marginBottom: 5 },
  dayTitle: { fontSize: 20, fontFamily: "Helvetica-Bold", color: "#f0e6d3", letterSpacing: 0.3, marginBottom: 3 },
  dayMeta: { fontSize: 8, color: MUTED, letterSpacing: 0.4 },

  sectionLabel: { fontSize: 5.5, letterSpacing: 2, color: "#555", textTransform: "uppercase", fontFamily: "Helvetica-Bold", marginBottom: 6, marginTop: 14 },

  // Warmup/cooldown rows
  lightRow: { flexDirection: "row", justifyContent: "space-between", paddingBottom: 5, marginBottom: 5, borderBottomWidth: 0.5, borderBottomColor: "#1e1b17" },
  lightName: { fontSize: 8.5, color: "#cccccc" },
  lightProtocol: { fontSize: 7, color: "#5a544b" },

  // Workout rows
  workoutRow: { flexDirection: "row", justifyContent: "space-between", paddingBottom: 6, marginBottom: 6, borderBottomWidth: 0.5, borderBottomColor: "#1e1b17", alignItems: "flex-start" },
  workoutName: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#f0e6d3", marginBottom: 1.5 },
  workoutNote: { fontSize: 7, color: "#5a544b" },
  workoutSets: { fontSize: 8, color: GOLD, fontFamily: "Helvetica-Bold" },

  teaserRow: { flexDirection: "row", gap: 6, marginTop: 12 },
  teaserCard: { flex: 1, backgroundColor: DARK_CARD, borderWidth: 0.5, borderColor: "#2a2722", padding: "8 10" },
  teaserDay: { fontSize: 6, letterSpacing: 1.8, color: GOLD_DEEP, textTransform: "uppercase", fontFamily: "Helvetica-Bold", marginBottom: 3 },
  teaserName: { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: "#f0e6d3", marginBottom: 2 },
  teaserMeta: { fontSize: 7, color: "#5a544b" },
  teaserLock: { fontSize: 7, color: "#2a2722", marginTop: 8, fontStyle: "italic" },

  footer: { position: "absolute", bottom: 28, left: 50, right: 50, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 0.5, borderTopColor: BORDER, paddingTop: 8 },
  footerText: { fontSize: 6.5, color: MUTED },
  footerBrand: { fontSize: 6.5, color: GOLD },
  footerDark: { position: "absolute", bottom: 28, left: 50, right: 50, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 0.5, borderTopColor: "#2a2722", paddingTop: 8 },
  footerTextDark: { fontSize: 6.5, color: "#3a3530" },
  footerBrandDark: { fontSize: 6.5, color: GOLD },
})

const movements = [
  {
    number: "01", name: "The Hip Hinge", pattern: "Hip-Dominant",
    desc: "The single most important movement you will learn. Power comes from your hips, not your lower back.",
    cues: [
      "Push the wall behind you with your hips — forces the hinge naturally.",
      "Soft bend in the knees, not a squat.",
      "Pack your shoulders before you move.",
      "Keep the weight close — drag it up your legs.",
    ],
    watch: "Watch: if your lower back rounds at the bottom, the weight is too heavy.",
  },
  {
    number: "02", name: "The Squat", pattern: "Knee-Dominant",
    desc: "Start with the goblet squat. The counterbalance keeps the torso upright and teaches what proper position feels like.",
    cues: [
      "Knees track over your second toe — follow the feet, don't cave inward.",
      "Chest up, proud posture.",
      "Sit between your heels, not behind them.",
      "Spread the floor with your feet.",
    ],
  },
  {
    number: "03", name: "The Push", pattern: "Horizontal Press",
    desc: "Poor pressing mechanics build up quietly until they become a real shoulder problem. Get it right early.",
    cues: [
      "Elbows at 45 degrees — not tucked all in, not flared straight out.",
      "Shoulder blades together and down before you lower.",
      "Drive feet into the floor.",
      "Control the descent — 2 to 3 seconds down.",
    ],
  },
  {
    number: "04", name: "The Pull", pattern: "Upper-Body Row",
    desc: "Most people press far more than they pull. A strong back directly protects your spine.",
    cues: [
      "Pull elbows to your back pockets — activates lats, stops the shrug.",
      "Shoulders down before you pull.",
      "Squeeze fully at the top of every rep.",
      "Control the return — lower slowly.",
    ],
  },
  {
    number: "05", name: "The Brace & Carry", pattern: "Core Stability",
    desc: "Your core's real job is to resist movement, not create it. Crunches miss the point.",
    cues: [
      "360-degree brace — breathe in and create pressure all the way around.",
      "Ribs down — stops the lower back from overarching.",
      "Tall spine — string pulling the crown of your head up.",
      "Brace before you move, not halfway through.",
    ],
  },
]

const warmupA = [
  { name: "90/90 Hip Mobility Stretch",  protocol: "8–10 reps per side" },
  { name: "Cat-Cow",                      protocol: "10 reps" },
  { name: "World's Greatest Stretch",     protocol: "5 reps per side" },
  { name: "Glute Bridge (Activation)",    protocol: "1 × 15 reps" },
  { name: "Lateral Band Walk",            protocol: "15 steps each direction" },
  { name: "Leg Swing Front to Back",      protocol: "10 reps per side" },
  { name: "Lateral Lunge",                protocol: "8 reps per side" },
]

const workoutA = [
  { name: "Hip Thrust",         sets: "3 × 10–12", note: "drive through heels, squeeze at the top" },
  { name: "Romanian Deadlift",  sets: "3 × 10",    note: "hips back, keep the weight close" },
  { name: "Reverse Lunge",      sets: "3 × 10/side", note: "front knee over toes" },
  { name: "Goblet Squat",       sets: "3 × 10",    note: "chest up, sit between your heels" },
  { name: "Dead Bug",           sets: "3 × 8/side", note: "lower back flat to the floor" },
  { name: "Farmer's Carry",     sets: "2 × 20–30 m", note: "tall spine, braced core" },
]

const cooldownA = [
  { name: "Kneeling Hip Flexor Stretch", protocol: "30 sec per side" },
  { name: "90/90 Hamstring Stretch",     protocol: "30 sec per side" },
  { name: "Figure 4 Stretch",            protocol: "30 sec per side" },
  { name: "Child's Pose",                protocol: "30 sec" },
]

function Footer() {
  return createElement(View, { style: s.footer, fixed: true },
    createElement(Text, { style: s.footerText }, "Lisa McPherson, CPT  |  Training Foundations"),
    createElement(Text, { style: s.footerBrand }, "lisafitmethod.com")
  )
}

function FooterDark() {
  return createElement(View, { style: s.footerDark, fixed: true },
    createElement(Text, { style: s.footerTextDark }, "Lisa McPherson, CPT  |  Training Foundations"),
    createElement(Text, { style: s.footerBrandDark }, "lisafitmethod.com")
  )
}

function Page1() {
  return createElement(Page, { size: "A4", style: s.page },
    createElement(View, { style: s.header },
      createElement(Text, { style: s.brandLabel }, "Lisa Fit Method"),
      createElement(Text, { style: s.title }, "5 Foundation Movements"),
      createElement(Text, { style: s.subtitle }, "Coaching cues for each pattern  |  Lisa McPherson, CPT")
    ),
    createElement(Text, { style: s.intro },
      "These five patterns are the backbone of the 4-Week Training Foundations program. Master the cues below and every exercise in the course will feel like a natural extension of what you already know."
    ),
    ...movements.flatMap((m, i) => {
      const block = createElement(View, { style: s.movementBlock, key: m.number },
        createElement(View, { style: s.movementHeader },
          createElement(Text, { style: s.movementNumber }, m.number),
          createElement(Text, { style: s.movementName }, m.name)
        ),
        createElement(Text, { style: s.patternTag }, m.pattern),
        createElement(Text, { style: s.movementDesc }, m.desc),
        createElement(Text, { style: s.cuesLabel }, "Key Cues"),
        ...m.cues.map((cue, ci) =>
          createElement(View, { style: s.cueRow, key: ci },
            createElement(Text, { style: s.cueDot }, ">"),
            createElement(Text, { style: s.cueText }, cue)
          )
        ),
        ...(m.watch ? [createElement(Text, { style: s.watchText }, m.watch)] : [])
      )
      const divider = i < movements.length - 1 ? createElement(View, { style: s.divider, key: `d${i}` }) : null
      return divider ? [block, divider] : [block]
    }),
    Footer()
  )
}

function Page2() {
  return createElement(Page, { size: "A4", style: s.dayPage },
    createElement(View, { style: s.dayHeader },
      createElement(Text, { style: s.dayBrand }, "Lisa Fit Method — A Look Inside the Program"),
      createElement(Text, { style: s.dayTitle }, "Day A: Lower Body Strength"),
      createElement(Text, { style: s.dayMeta }, "Glutes · Legs · Core  |  45–60 min  |  3 days/week program")
    ),

    // Warmup
    createElement(Text, { style: s.sectionLabel }, "Warm-Up — 10 min"),
    ...warmupA.map((item, i) =>
      createElement(View, { style: { ...s.lightRow, borderBottomWidth: i < warmupA.length - 1 ? 0.5 : 0, borderBottomColor: "#1e1b17" }, key: i },
        createElement(Text, { style: s.lightName }, item.name),
        createElement(Text, { style: s.lightProtocol }, item.protocol)
      )
    ),

    // Main workout
    createElement(Text, { style: s.sectionLabel }, "Main Workout"),
    ...workoutA.map((ex, i) =>
      createElement(View, { style: { ...s.workoutRow, borderBottomWidth: i < workoutA.length - 1 ? 0.5 : 0, borderBottomColor: "#1e1b17" }, key: i },
        createElement(View, { style: { flex: 1 } },
          createElement(Text, { style: s.workoutName }, ex.name),
          createElement(Text, { style: s.workoutNote }, ex.note)
        ),
        createElement(Text, { style: s.workoutSets }, ex.sets)
      )
    ),

    // Cooldown
    createElement(Text, { style: s.sectionLabel }, "Cool-Down — 5 min"),
    ...cooldownA.map((item, i) =>
      createElement(View, { style: { ...s.lightRow, borderBottomWidth: i < cooldownA.length - 1 ? 0.5 : 0, borderBottomColor: "#1e1b17" }, key: i },
        createElement(Text, { style: s.lightName }, item.name),
        createElement(Text, { style: s.lightProtocol }, item.protocol)
      )
    ),

    // Days B and C teaser
    createElement(View, { style: s.teaserRow },
      ...[
        { day: "Day B", name: "Upper Body Strength", meta: "Pressing · Pulling · Posture" },
        { day: "Day C", name: "Integration & Core",  meta: "Stability · Movement Quality" },
      ].map((d) =>
        createElement(View, { style: s.teaserCard, key: d.day },
          createElement(Text, { style: s.teaserDay }, d.day),
          createElement(Text, { style: s.teaserName }, d.name),
          createElement(Text, { style: s.teaserMeta }, d.meta),
          createElement(Text, { style: s.teaserLock }, "Full course only")
        )
      )
    ),

    createElement(View, { style: { marginTop: 16, backgroundColor: "#0d0d0d", padding: "9 12" } },
      createElement(Text, { style: { fontSize: 7.5, color: GOLD } }, "Get the full program at lisafitmethod.com/courses"),
      createElement(Text, { style: { fontSize: 7, color: "#3a3530", marginTop: 3 } }, "50+ videos · 4-week program · built-in tracker · lifetime access")
    ),

    FooterDark()
  )
}

function GuidePDF() {
  return createElement(Document, { title: "Training Foundations Guide — Lisa Fit Method" },
    Page1(),
    Page2()
  )
}

const stream = await pdf(createElement(GuidePDF)).toBuffer()
const chunks = []
for await (const chunk of stream) chunks.push(chunk)
const buffer = Buffer.concat(chunks)

const outDir = resolve(__dirname, "../public/downloads")
mkdirSync(outDir, { recursive: true })
const outPath = resolve(outDir, "lisa-fit-method-5-foundations.pdf")
writeFileSync(outPath, buffer)
console.log("PDF written to", outPath, `(${buffer.length} bytes)`)
