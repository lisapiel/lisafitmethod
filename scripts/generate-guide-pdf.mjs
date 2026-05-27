// Run once with: node scripts/generate-guide-pdf.mjs
// Outputs public/downloads/lisa-fit-method-5-foundations.pdf

import { Document, Page, View, Text, StyleSheet, pdf } from "@react-pdf/renderer"
import { createElement } from "react"
import { writeFileSync, mkdirSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))

const GOLD = "#c8a97e"
const INK = "#0a0a0a"
const CREAM = "#faf8f5"
const MUTED = "#6b6560"
const BORDER = "#ddd8d0"

const styles = StyleSheet.create({
  page: { backgroundColor: CREAM, padding: "48 52 52 52", fontFamily: "Helvetica" },
  header: { borderBottomWidth: 1, borderBottomColor: GOLD, paddingBottom: 14, marginBottom: 28 },
  brandLabel: { fontSize: 7, letterSpacing: 3, color: GOLD, textTransform: "uppercase", marginBottom: 6 },
  title: { fontSize: 22, fontFamily: "Helvetica-Bold", color: INK, letterSpacing: 0.5, marginBottom: 4 },
  subtitle: { fontSize: 9, color: MUTED, letterSpacing: 0.5 },
  intro: { fontSize: 9.5, color: MUTED, lineHeight: 1.65, marginBottom: 24 },
  movementBlock: { marginBottom: 20, borderLeftWidth: 2, borderLeftColor: GOLD, paddingLeft: 12 },
  movementHeader: { flexDirection: "row", alignItems: "baseline", marginBottom: 5 },
  movementNumber: { fontSize: 7, color: GOLD, fontFamily: "Helvetica-Bold", letterSpacing: 2, marginRight: 8, textTransform: "uppercase" },
  movementName: { fontSize: 12.5, fontFamily: "Helvetica-Bold", color: INK, letterSpacing: 0.3 },
  patternTag: { fontSize: 6.5, color: GOLD, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 },
  movementDesc: { fontSize: 8.5, color: MUTED, lineHeight: 1.6, marginBottom: 7 },
  cuesLabel: { fontSize: 6.5, fontFamily: "Helvetica-Bold", color: INK, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 5 },
  cueRow: { flexDirection: "row", marginBottom: 3, alignItems: "flex-start" },
  cueDot: { fontSize: 7, color: GOLD, marginRight: 6, marginTop: 1 },
  cueText: { fontSize: 8.5, color: INK, lineHeight: 1.5, flex: 1 },
  divider: { borderBottomWidth: 0.5, borderBottomColor: BORDER, marginBottom: 20 },
  footer: { position: "absolute", bottom: 32, left: 52, right: 52, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 0.5, borderTopColor: BORDER, paddingTop: 10 },
  footerText: { fontSize: 7, color: MUTED, letterSpacing: 0.5 },
  footerBrand: { fontSize: 7, color: GOLD, letterSpacing: 1 },
})

const movements = [
  {
    number: "01", name: "Goblet Squat", pattern: "Knee Dominant",
    desc: "The entry point for lower-body strength. Holding the weight in front forces an upright torso and teaches the hips to load correctly before you ever touch a barbell.",
    cues: [
      "Feet shoulder-width, toes turned out 10-15 degrees",
      "Brace your core before you descend — ribcage down, not flared",
      "Drive your knees out over your toes throughout the movement",
      "Push the floor away, squeeze glutes fully at the top",
    ],
  },
  {
    number: "02", name: "Romanian Deadlift", pattern: "Hip Hinge",
    desc: "Teaches you to load the posterior chain — hamstrings and glutes — through a proper hip hinge. One of the highest-value patterns for both aesthetics and injury prevention.",
    cues: [
      "Soft bend in the knees; this is not a squat",
      "Push your hips back as the weight lowers — feel the stretch in your hamstrings",
      "Keep the bar or dumbbells dragging close to your legs",
      "Drive hips forward to stand — squeeze glutes at lockout",
    ],
  },
  {
    number: "03", name: "Dumbbell Row", pattern: "Horizontal Pull",
    desc: "Builds the upper back and rear delts that balance pressing work and fix the forward-shoulder posture most of us develop from daily life.",
    cues: [
      "Brace your core and keep a neutral spine — no rotation",
      "Initiate by pulling your elbow back, not shrugging your shoulder",
      "Drive the elbow past your torso; pause at the top",
      "Lower under control — the eccentric builds as much muscle as the pull",
    ],
  },
  {
    number: "04", name: "Push-Up / Dumbbell Press", pattern: "Horizontal Push",
    desc: "The fundamental pressing pattern. When loaded correctly, it builds chest, shoulders, and triceps while demanding core stability the entire time.",
    cues: [
      "Body in one rigid line from head to heels — no sagging hips",
      "Hands just outside shoulder-width; elbows track at 45 degrees, not 90",
      "Chest to the floor (push-up) or elbows below the bench (press)",
      "Press until elbows are fully extended; don't lose the shoulder pack",
    ],
  },
  {
    number: "05", name: "Pallof Press", pattern: "Core / Anti-Rotation",
    desc: "Real core training isn't crunches — it's resisting unwanted motion. The Pallof Press teaches your trunk to stay locked while your arms move, which is exactly what the spine needs.",
    cues: [
      "Stand perpendicular to the cable or band anchor",
      "Press the handle straight out from your sternum — slow and controlled",
      "Resist the pull; your torso should not rotate at all",
      "Hold 1-2 seconds extended, return to chest with the same control",
    ],
  },
]

function GuidePDF() {
  return createElement(
    Document,
    { title: "5 Foundation Movements — Lisa Fit Method" },
    createElement(
      Page,
      { size: "A4", style: styles.page },
      createElement(
        View, { style: styles.header },
        createElement(Text, { style: styles.brandLabel }, "Lisa Fit Method"),
        createElement(Text, { style: styles.title }, "5 Foundation Movements"),
        createElement(Text, { style: styles.subtitle }, "Coaching cues for each pattern  |  Lisa McPherson, CPT")
      ),
      createElement(Text, { style: styles.intro },
        "These five patterns are the backbone of the 4-Week Training Foundations program. Master the cues below and every exercise in the course will feel like a natural extension of what you already know."
      ),
      ...movements.flatMap((m, i) => {
        const block = createElement(
          View, { style: styles.movementBlock, key: m.number },
          createElement(View, { style: styles.movementHeader },
            createElement(Text, { style: styles.movementNumber }, m.number),
            createElement(Text, { style: styles.movementName }, m.name)
          ),
          createElement(Text, { style: styles.patternTag }, m.pattern),
          createElement(Text, { style: styles.movementDesc }, m.desc),
          createElement(Text, { style: styles.cuesLabel }, "Key Cues"),
          ...m.cues.map((cue, ci) =>
            createElement(View, { style: styles.cueRow, key: ci },
              createElement(Text, { style: styles.cueDot }, ">"),
              createElement(Text, { style: styles.cueText }, cue)
            )
          )
        )
        const divider = i < movements.length - 1
          ? createElement(View, { style: styles.divider, key: `div-${i}` })
          : null
        return divider ? [block, divider] : [block]
      }),
      createElement(
        View, { style: styles.footer, fixed: true },
        createElement(Text, { style: styles.footerText }, "Lisa McPherson, CPT  |  Training Foundations"),
        createElement(Text, { style: styles.footerBrand }, "lisafitmethod.com")
      )
    )
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
