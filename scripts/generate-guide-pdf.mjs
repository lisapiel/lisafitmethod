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
const DARK_MUTED = "#6a6058"

const s = StyleSheet.create({
  page: { backgroundColor: CREAM, padding: "44 50 50 50", fontFamily: "Helvetica" },
  pageDark: { backgroundColor: DARK, padding: "44 50 50 50", fontFamily: "Helvetica" },

  // Header
  header: { borderBottomWidth: 1.5, borderBottomColor: GOLD, paddingBottom: 12, marginBottom: 22 },
  brandLabel: { fontSize: 6.5, letterSpacing: 2.5, color: GOLD, textTransform: "uppercase", marginBottom: 5 },
  title: { fontSize: 20, fontFamily: "Helvetica-Bold", color: INK, letterSpacing: 0.3, marginBottom: 3 },
  subtitle: { fontSize: 8, color: MUTED, letterSpacing: 0.4 },
  intro: { fontSize: 9, color: MUTED, lineHeight: 1.6, marginBottom: 20 },

  // Section labels
  sectionLabel: { fontSize: 6, letterSpacing: 2.5, color: GOLD, textTransform: "uppercase", marginBottom: 8, fontFamily: "Helvetica-Bold" },
  sectionLabelLight: { fontSize: 6, letterSpacing: 2.5, color: GOLD, textTransform: "uppercase", marginBottom: 8, fontFamily: "Helvetica-Bold" },

  // Movement blocks
  movementBlock: { marginBottom: 16, borderLeftWidth: 2, borderLeftColor: GOLD, paddingLeft: 10 },
  movementHeader: { flexDirection: "row", alignItems: "baseline", marginBottom: 3 },
  movementNumber: { fontSize: 6, color: GOLD, fontFamily: "Helvetica-Bold", letterSpacing: 1.5, marginRight: 7, textTransform: "uppercase" },
  movementName: { fontSize: 11, fontFamily: "Helvetica-Bold", color: INK, letterSpacing: 0.2 },
  patternTag: { fontSize: 6, color: GOLD_DEEP, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 3 },
  movementDesc: { fontSize: 7.5, color: MUTED, lineHeight: 1.55, marginBottom: 6 },
  cuesLabel: { fontSize: 6, fontFamily: "Helvetica-Bold", color: INK, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 4 },
  cueRow: { flexDirection: "row", marginBottom: 2.5, alignItems: "flex-start" },
  cueDot: { fontSize: 7, color: GOLD, marginRight: 5, marginTop: 0.5 },
  cueText: { fontSize: 7.5, color: INK, lineHeight: 1.45, flex: 1 },
  watchText: { fontSize: 7.5, color: MUTED, lineHeight: 1.45, fontStyle: "italic", marginTop: 3 },
  watchBold: { fontFamily: "Helvetica-Bold", color: GOLD_DEEP },

  divider: { borderBottomWidth: 0.5, borderBottomColor: BORDER, marginBottom: 16, marginTop: 2 },
  dividerGold: { borderBottomWidth: 0.5, borderBottomColor: "#3a3228", marginBottom: 10 },

  // Day A section headers
  dayHeader: { backgroundColor: PANEL, padding: "8 10", marginBottom: 0, borderBottomWidth: 1, borderBottomColor: BORDER },
  dayLabel: { fontSize: 6, letterSpacing: 2, color: GOLD_DEEP, textTransform: "uppercase", fontFamily: "Helvetica-Bold", marginBottom: 1 },
  dayTitle: { fontSize: 13, fontFamily: "Helvetica-Bold", color: INK },
  dayMeta: { fontSize: 7, color: MUTED, marginTop: 2 },

  // Warmup/Cooldown rows
  warmupBlock: { backgroundColor: "#ffffff", borderWidth: 0.5, borderColor: BORDER, marginBottom: 1 },
  warmupHeader: { backgroundColor: PANEL, padding: "5 10 5 10", borderBottomWidth: 0.5, borderBottomColor: BORDER, flexDirection: "row", justifyContent: "space-between" },
  warmupHeaderLabel: { fontSize: 6, letterSpacing: 1.5, color: GOLD_DEEP, textTransform: "uppercase", fontFamily: "Helvetica-Bold" },
  warmupHeaderTime: { fontSize: 6, color: MUTED },
  warmupRow: { padding: "5 10 5 10", borderBottomWidth: 0.5, borderBottomColor: BORDER },
  warmupName: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: INK, marginBottom: 1 },
  warmupProtocol: { fontSize: 7, color: GOLD_DEEP, marginBottom: 2 },
  warmupWhy: { fontSize: 7, color: MUTED, lineHeight: 1.45, marginBottom: 2 },
  warmupCue: { fontSize: 7, color: MUTED, fontStyle: "italic", lineHeight: 1.4, paddingLeft: 8, borderLeftWidth: 1.5, borderLeftColor: BORDER },

  // Main workout (dark)
  workoutBlock: { backgroundColor: DARK, borderWidth: 0.5, borderColor: "#2a2722", padding: "12 14", marginBottom: 1 },
  workoutHeader: { marginBottom: 10 },
  workoutTitle: { fontSize: 13, fontFamily: "Helvetica-Bold", color: "#f0e6d3", marginBottom: 2 },
  workoutMeta: { fontSize: 7, color: GOLD, letterSpacing: 0.5 },
  workoutNote: { fontSize: 7, color: "#5a5048", lineHeight: 1.4, backgroundColor: "#1a1a1a", padding: "5 8", marginBottom: 10 },
  workoutRow: { borderBottomWidth: 0.5, borderBottomColor: "#2a2722", paddingBottom: 7, marginBottom: 7 },
  workoutExName: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#f0e6d3", marginBottom: 1 },
  workoutExSets: { fontSize: 8, color: GOLD, marginBottom: 2 },
  workoutExNote: { fontSize: 7, color: DARK_MUTED, lineHeight: 1.4, marginBottom: 1.5 },
  workoutExTip: { fontSize: 7, color: "#4a4440", lineHeight: 1.4, fontStyle: "italic" },
  workoutTipArrow: { color: GOLD, fontStyle: "normal" },

  // Program overview
  programRow: { borderBottomWidth: 0.5, borderBottomColor: BORDER, paddingBottom: 6, marginBottom: 6 },
  programDayTag: { fontSize: 6, letterSpacing: 1.8, color: GOLD_DEEP, textTransform: "uppercase", fontFamily: "Helvetica-Bold", marginBottom: 2 },
  programDayName: { fontSize: 9, fontFamily: "Helvetica-Bold", color: INK, marginBottom: 1.5 },
  programExLine: { fontSize: 7, color: MUTED, lineHeight: 1.45 },
  progressBox: { backgroundColor: PANEL, padding: "8 10", borderLeftWidth: 2, borderLeftColor: GOLD, marginTop: 8 },
  progressTitle: { fontSize: 6.5, letterSpacing: 1.5, color: GOLD_DEEP, textTransform: "uppercase", fontFamily: "Helvetica-Bold", marginBottom: 4 },
  progressText: { fontSize: 7.5, color: MUTED, lineHeight: 1.55 },

  // Footer
  footer: { position: "absolute", bottom: 28, left: 50, right: 50, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 0.5, borderTopColor: BORDER, paddingTop: 8 },
  footerText: { fontSize: 6.5, color: MUTED, letterSpacing: 0.3 },
  footerBrand: { fontSize: 6.5, color: GOLD, letterSpacing: 0.8 },
})

const movements = [
  {
    number: "01", name: "The Hip Hinge", pattern: "Hip-Dominant",
    desc: "The single most important movement you will learn, and the one most responsible for back injuries when done wrong. Power comes from your hips, not your lower back.",
    cues: [
      "Push the wall behind you with your hips — forces the hinge without overthinking.",
      "Soft bend in the knees, not a squat. Knees unlock but do not drive forward.",
      "Pack your shoulders. Blades slightly down and back before you move.",
      "Keep the weight close — drag it up your legs, do not let it float away.",
    ],
    watch: "Watch for: if your lower back rounds at the bottom, the weight is too heavy.",
  },
  {
    number: "02", name: "The Squat", pattern: "Knee-Dominant",
    desc: "Start with the goblet squat — the safest way to learn the pattern before any barbell. The counterbalance keeps the torso upright and teaches you what proper position feels like.",
    cues: [
      "Knees track over your second toe — follow the feet, don't collapse inward.",
      "Chest up, proud posture — keeps torso upright through the movement.",
      "Sit between your heels, not behind them — weight across your whole foot.",
      "Spread the floor with your feet — keeps knees stable, glutes switched on.",
    ],
  },
  {
    number: "03", name: "The Push", pattern: "Horizontal Press",
    desc: "Pressing builds chest, shoulders, and triceps. Poor mechanics build up quietly until they become a real shoulder problem. Get it right early.",
    cues: [
      "Elbows at 45 degrees — not tucked all the way in, not flared straight out.",
      "Shoulder blades together and down before you lower — not after.",
      "Drive feet into the floor — full body tension makes the press stronger.",
      "Control the descent — 2 to 3 seconds down, then press with intent.",
    ],
  },
  {
    number: "04", name: "The Pull", pattern: "Upper-Body Row",
    desc: "Most people press far more than they pull. Over time that builds a real imbalance. A strong back directly protects your spine. Match every push with a pull.",
    cues: [
      "Pull elbows to your back pockets — activates the lats, stops the shrug.",
      "Shoulders down before you pull — set the position first, then go.",
      "Squeeze at the end — fully contract the back at the top of every rep.",
      "Control the return — lower slowly, do not let it drop.",
    ],
  },
  {
    number: "05", name: "The Brace & Carry", pattern: "Core Stability",
    desc: "Your core's real job is to resist movement, not create it. Crunches miss the point. Every squat, hinge, and press needs your core bracing to protect your spine.",
    cues: [
      "360-degree brace — breathe into your belly, create pressure all around.",
      "Ribs down — stops your lower back from overarching.",
      "Tall spine — string pulling the crown of your head toward the ceiling.",
      "Brace before you move — not halfway through the rep.",
    ],
  },
]

const warmupA = [
  { name: "90/90 Hip Mobility Stretch", protocol: "8–10 reps per side", why: "Opens hip rotation before loading. Tight hips mean your lower back compensates.", cue: "Move slowly between sides. Breathe into the stretch. Don't force the range." },
  { name: "Cat-Cow", protocol: "10 reps", why: "Wakes up spinal mobility and gets the lower back ready.", cue: "Inhale to extend, exhale to round. Slow and deliberate." },
  { name: "World's Greatest Stretch", protocol: "5 reps per side", why: "Opens hips, thoracic spine, and hamstrings in one movement.", cue: "Move through every position with control. Your range doesn't need to match a video." },
  { name: "Glute Bridge (Activation)", protocol: "1 set × 15 reps", why: "Gets the glutes firing before the hip thrust session.", cue: "Squeeze hard at the top, hold 1 sec. Drive through heels. Ribs down." },
  { name: "Lateral Band Walk", protocol: "1 set × 15 steps each way", why: "Activates the glute medius — keeps knees tracking correctly under load.", cue: "Light band. Slight squat the whole time. Feet parallel. Control every step." },
  { name: "Leg Swing Front to Back", protocol: "10 reps per side", why: "Dynamic hip flexor and hamstring mobility through the range you're about to use.", cue: "Hold a wall. Start small, gradually increase range. Controlled swing." },
  { name: "Lateral Lunge", protocol: "8 reps per side", why: "Opens hips in the frontal plane — a direction most warmups miss completely.", cue: "Hips back as you lower. Knee over toes. Only as deep as you can control." },
]

const workoutA = [
  { name: "Hip Thrust", sets: "3 × 10–12", rest: "2 min", note: "Start with a dumbbell. Squeeze glutes hard at the top — hold 1 second.", tip: "Drive through heels. Ribs down. Chin tucked. No lower back arch." },
  { name: "Romanian Deadlift", sets: "3 × 10", rest: "2 min", note: "Push hips back, not hands down. Stop before your lower back rounds.", tip: "Keep the dumbbells dragging close to your legs. Pause and feel the stretch at the bottom." },
  { name: "Reverse Lunge", sets: "3 × 10 per side", rest: "90 sec", note: "Step back, not forward. Front knee over toes. Back knee hovers above the floor.", tip: "Weight in the front leg. Drive through the front heel to stand." },
  { name: "Goblet Squat", sets: "3 × 10", rest: "2 min", note: "Dumbbell at chest. The counterbalance teaches upright torso position.", tip: "Knees out gently as you lower. Only as deep as you can keep your chest lifted." },
  { name: "Dead Bug", sets: "3 × 8 per side", rest: "60 sec", note: "Lower back flat to the floor before you start. The moment it lifts, you've gone too far.", tip: "Exhale fully as you extend. Reduce range if you can't keep your back flat." },
  { name: "Farmer's Carry", sets: "2 × 20–30 m", rest: "90 sec", note: "Heavy dumbbells, tall spine, walk with intention. Harder than it looks.", tip: "Shoulders back and down. Brace your core the whole time. If posture falls apart, lighter weight." },
]

const cooldownA = [
  { name: "Kneeling Hip Flexor Stretch", protocol: "30 sec per side", why: "Tight after any lower body session. Skip this and your lower back pays for it.", cue: "Tuck pelvis slightly to deepen. Stay tall, no lower back arch. Breathe slowly." },
  { name: "90/90 Hamstring Stretch", protocol: "30 sec per side", why: "Closes the loop on all the hip hinge and RDL work.", cue: "Hold behind your thigh, not the knee. Soft bend in the leg. Stretch, not pain." },
  { name: "Figure 4 Stretch", protocol: "30 sec per side", why: "Targets deep glute and piriformis — places a foam roller misses.", cue: "Flex the crossed foot to protect your knee. Gently pull the opposite leg toward you." },
  { name: "Child's Pose", protocol: "30 sec", why: "Every session ends here. Decompresses the spine, slows breathing, closes the session.", cue: "Reach arms forward, chest sinks, breathe into your lower back. Nowhere to be." },
]

const programDays = [
  {
    tag: "Day A", name: "Lower Body Strength",
    meta: "Glutes · Legs · Stability · Core",
    note: "Full warmup and cooldown shown above.",
    exercises: ["Hip Thrust — 3 × 10–12", "Romanian Deadlift — 3 × 10", "Reverse Lunge — 3 × 10 per side", "Goblet Squat — 3 × 10", "Dead Bug — 3 × 8 per side", "Farmer's Carry — 2 × 20–30 m"],
  },
  {
    tag: "Day B", name: "Upper Body Strength",
    meta: "Pressing · Pulling · Posture · Shoulder stability",
    note: "Includes warmup (Cat-Cow, Thoracic Rotation, World's Greatest, Arm Circles, Band Pull-Apart, YTW Raise) and cooldown (Open Book, Band Lat Stretch, Thread the Needle, Triceps Stretch).",
    exercises: ["DB Bench Press or Push-Up — 3 × 10", "Band-Assisted Pull-Up or Lat Pulldown — 3 × 8", "Overhead Press — 3 × 10", "Chest Supported Row — 3 × 12", "Dumbbell Curl + Tricep Extension (superset) — 3 rounds", "Pallof Press — 3 × 10 per side"],
  },
  {
    tag: "Day C", name: "Integration & Core",
    meta: "Movement quality · Single-leg stability · Core control",
    note: "Lighter loading. Reinforce patterns and build stability. Includes own warmup and cooldown.",
    exercises: ["Single-Leg Glute Bridge — 3 × 10 per side", "Reverse Lunge — 3 × 10 per side", "Push-Up + Inverted Row (superset) — 3 rounds", "Monster Walk + Hip Abduction (superset) — 3 rounds", "Dead Bug + Copenhagen Plank (superset) — 2 rounds", "Stir-the-Pot — 2 × 8 each direction"],
  },
]

// ── Builders ───────────────────────────────────────────────────────────────────

function Footer() {
  return createElement(View, { style: s.footer, fixed: true },
    createElement(Text, { style: s.footerText }, "Lisa McPherson, CPT  |  Training Foundations"),
    createElement(Text, { style: s.footerBrand }, "lisafitmethod.com")
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
      "These five patterns are the backbone of the 4-Week Training Foundations program. Master the cues below and every exercise in the course will feel like a natural extension of what you already know. The full Day A workout — warmup through cooldown — is on the next pages."
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
  return createElement(Page, { size: "A4", style: s.page },
    createElement(View, { style: s.header },
      createElement(Text, { style: s.brandLabel }, "Lisa Fit Method — Day A"),
      createElement(Text, { style: s.title }, "Lower Body Strength"),
      createElement(Text, { style: s.subtitle }, "Complete session: warmup · main workout · cooldown  |  ~50–60 minutes total")
    ),

    // Warmup
    createElement(View, { style: s.warmupBlock },
      createElement(View, { style: s.warmupHeader },
        createElement(Text, { style: s.warmupHeaderLabel }, "Warm-Up"),
        createElement(Text, { style: s.warmupHeaderTime }, "~10 min")
      ),
      ...warmupA.map((item, i) =>
        createElement(View, { style: { ...s.warmupRow, borderBottomWidth: i < warmupA.length - 1 ? 0.5 : 0, borderBottomColor: BORDER }, key: i },
          createElement(View, { style: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 } },
            createElement(Text, { style: s.warmupName }, item.name),
            createElement(Text, { style: s.warmupProtocol }, item.protocol)
          ),
          createElement(Text, { style: s.warmupWhy }, item.why),
          createElement(Text, { style: s.warmupCue }, `Cue: ${item.cue}`)
        )
      )
    ),

    createElement(View, { style: { height: 6 } }),

    // Main workout
    createElement(View, { style: s.workoutBlock },
      createElement(View, { style: s.workoutHeader },
        createElement(Text, { style: s.sectionLabelLight }, "Main Workout  |  ~35–40 min"),
        createElement(Text, { style: s.workoutNote }, "Sets x Reps. Rest 90–120 sec between sets on compound movements. Last few reps should feel hard. Log your weights so you can push heavier next time.")
      ),
      ...workoutA.map((ex, i) =>
        createElement(View, { style: { ...s.workoutRow, borderBottomWidth: i < workoutA.length - 1 ? 0.5 : 0, borderBottomColor: "#2a2722" }, key: i },
          createElement(View, { style: { flexDirection: "row", justifyContent: "space-between", marginBottom: 1 } },
            createElement(Text, { style: s.workoutExName }, ex.name),
            createElement(View, { style: { alignItems: "flex-end" } },
              createElement(Text, { style: s.workoutExSets }, ex.sets),
              createElement(Text, { style: { fontSize: 6, color: "#5a5048" } }, ex.rest)
            )
          ),
          createElement(Text, { style: s.workoutExNote }, ex.note),
          createElement(Text, { style: s.workoutExTip }, `> ${ex.tip}`)
        )
      )
    ),

    createElement(View, { style: { height: 6 } }),

    // Cooldown
    createElement(View, { style: s.warmupBlock },
      createElement(View, { style: s.warmupHeader },
        createElement(Text, { style: s.warmupHeaderLabel }, "Cool-Down"),
        createElement(Text, { style: s.warmupHeaderTime }, "~5 min")
      ),
      ...cooldownA.map((item, i) =>
        createElement(View, { style: { ...s.warmupRow, borderBottomWidth: i < cooldownA.length - 1 ? 0.5 : 0, borderBottomColor: BORDER }, key: i },
          createElement(View, { style: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 } },
            createElement(Text, { style: s.warmupName }, item.name),
            createElement(Text, { style: s.warmupProtocol }, item.protocol)
          ),
          createElement(Text, { style: s.warmupWhy }, item.why),
          createElement(Text, { style: s.warmupCue }, `Cue: ${item.cue}`)
        )
      )
    ),

    Footer()
  )
}

function Page3() {
  return createElement(Page, { size: "A4", style: s.page },
    createElement(View, { style: s.header },
      createElement(Text, { style: s.brandLabel }, "Lisa Fit Method — Program Overview"),
      createElement(Text, { style: s.title }, "The Full 4-Week Program"),
      createElement(Text, { style: s.subtitle }, "3 days per week  |  45–60 min per session  |  Warmup and cooldown included in every day")
    ),

    createElement(Text, { style: { fontSize: 8.5, color: MUTED, lineHeight: 1.6, marginBottom: 14 } },
      "The program runs three days per week with at least one rest day between sessions. Each day has its own warmup and cooldown built in — those are part of the program, not optional add-ons. Below is the complete structure for all three days."
    ),

    ...programDays.flatMap((day, i) => [
      createElement(View, { style: { ...s.programRow, borderBottomWidth: i < programDays.length - 1 ? 0.5 : 0 }, key: day.tag },
        createElement(View, { style: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 3 } },
          createElement(View, {},
            createElement(Text, { style: s.programDayTag }, day.tag),
            createElement(Text, { style: s.programDayName }, day.name)
          ),
          createElement(Text, { style: { fontSize: 7, color: GOLD_DEEP } }, day.meta)
        ),
        createElement(Text, { style: { fontSize: 7, color: "#b0a898", fontStyle: "italic", marginBottom: 5 } }, day.note),
        ...day.exercises.map((ex, j) =>
          createElement(View, { style: { flexDirection: "row", marginBottom: 2 }, key: j },
            createElement(Text, { style: { fontSize: 7, color: GOLD, marginRight: 5 } }, ">"),
            createElement(Text, { style: s.programExLine }, ex)
          )
        )
      ),
    ]),

    createElement(View, { style: s.progressBox },
      createElement(Text, { style: s.progressTitle }, "Weeks 3 & 4 — Progressive Overload"),
      createElement(Text, { style: s.progressText },
        "The program structure stays the same across all 4 weeks. What changes is the demand. On every exercise where you completed all sets and reps with clean form in Weeks 1 and 2, add a small amount of weight — usually one dumbbell size up. For bodyweight exercises like the dead bug and push-up, add 2–3 reps per set instead.\n\nIf your form broke down anywhere, stay at the same weight in Weeks 3 and 4. Movement quality always comes before load. The weight will come."
      )
    ),

    createElement(View, { style: { marginTop: 14, backgroundColor: INK, padding: "10 14" } },
      createElement(Text, { style: { fontSize: 7, color: "#5a5048", lineHeight: 1.5, marginBottom: 4 } },
        "This guide is a real piece of the course. In the full 4-Week Training Foundations program, every exercise above has a coaching video, you log your weights directly into a built-in tracker, and progressive overload is structured in so you always know your next step."
      ),
      createElement(Text, { style: { fontSize: 7.5, color: GOLD } }, "lisafitmethod.com/courses")
    ),

    Footer()
  )
}

function GuidePDF() {
  return createElement(Document, { title: "Training Foundations Guide — Lisa Fit Method" },
    Page1(),
    Page2(),
    Page3()
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
