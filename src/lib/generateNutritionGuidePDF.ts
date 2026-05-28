import { Document, Page, View, Text, StyleSheet, pdf } from "@react-pdf/renderer"
import { createElement } from "react"

const GOLD = "#c8a97e"
const GOLD_DEEP = "#a8895e"
const INK = "#0a0a0a"
const CREAM = "#faf8f5"
const PANEL = "#f0ebe2"
const MUTED = "#6b6560"
const BORDER = "#ddd8d0"
const BLACK = "#0a0a0a"

const styles = StyleSheet.create({
  page: {
    backgroundColor: CREAM,
    padding: "48 52 64 52",
    fontFamily: "Helvetica",
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: GOLD,
    paddingBottom: 14,
    marginBottom: 24,
  },
  brandLabel: {
    fontSize: 7,
    letterSpacing: 3,
    color: GOLD,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  title: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: INK,
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 9,
    color: MUTED,
    letterSpacing: 0.3,
  },
  intro: {
    fontSize: 9.5,
    color: MUTED,
    lineHeight: 1.65,
    marginBottom: 6,
  },
  introStrong: {
    fontSize: 9.5,
    color: INK,
    lineHeight: 1.65,
    marginBottom: 20,
    fontFamily: "Helvetica-Bold",
  },
  storyBox: {
    borderLeftWidth: 2,
    borderLeftColor: GOLD,
    backgroundColor: PANEL,
    padding: "10 14 10 14",
    marginBottom: 20,
  },
  storyText: {
    fontSize: 9,
    color: MUTED,
    lineHeight: 1.7,
    marginBottom: 5,
  },
  storySig: {
    fontSize: 9.5,
    color: GOLD_DEEP,
  },
  sectionLabel: {
    fontSize: 7,
    letterSpacing: 2.5,
    color: GOLD_DEEP,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    color: INK,
    marginBottom: 6,
  },
  sectionIntro: {
    fontSize: 9,
    color: MUTED,
    lineHeight: 1.65,
    marginBottom: 16,
  },
  principleBlock: {
    marginBottom: 16,
  },
  principleHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 8,
  },
  principleNum: {
    fontSize: 7,
    color: GOLD_DEEP,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
    borderWidth: 1,
    borderColor: GOLD,
    borderRadius: 12,
    width: 20,
    height: 20,
    textAlign: "center",
    paddingTop: 5,
  },
  principleCategory: {
    fontSize: 6.5,
    color: MUTED,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  principleName: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: INK,
    marginBottom: 2,
  },
  principleTagline: {
    fontSize: 10,
    color: GOLD_DEEP,
    marginBottom: 5,
  },
  principleBody: {
    fontSize: 8.5,
    color: MUTED,
    lineHeight: 1.65,
    marginBottom: 4,
  },
  principleRef: {
    fontSize: 7.5,
    color: MUTED,
    lineHeight: 1.5,
    marginBottom: 4,
    fontStyle: "italic",
  },
  practicalRow: {
    flexDirection: "row",
    gap: 6,
  },
  practicalArrow: {
    fontSize: 8.5,
    color: GOLD_DEEP,
    fontFamily: "Helvetica-Bold",
  },
  practicalText: {
    fontSize: 8.5,
    color: INK,
    lineHeight: 1.55,
    flex: 1,
  },
  courseHookBox: {
    backgroundColor: BLACK,
    padding: "8 12",
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  courseHookArrow: {
    fontSize: 8,
    color: GOLD,
    fontFamily: "Helvetica-Bold",
  },
  courseHookText: {
    fontSize: 8,
    color: "#c9bfb0",
    lineHeight: 1.55,
    flex: 1,
  },
  divider: {
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
    marginBottom: 16,
    marginTop: 2,
  },
  equationBox: {
    backgroundColor: BLACK,
    padding: "14 16",
    marginBottom: 20,
  },
  equationRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 6,
    paddingBottom: 6,
    gap: 10,
  },
  equationLabel: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#fff",
    flex: 1,
  },
  equationSub: {
    fontSize: 6.5,
    color: "#5a544b",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  equationPlus: {
    fontSize: 12,
    color: GOLD,
    fontFamily: "Helvetica-Bold",
  },
  equationResult: {
    fontSize: 7,
    color: GOLD_DEEP,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  equationRowDivider: {
    borderBottomWidth: 0.5,
    borderBottomColor: "#2a2722",
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

const PRINCIPLES_PDF = [
  {
    num: "01",
    category: "Energy Balance",
    name: "Calorie Deficit",
    tagline: "The only mechanism for fat loss",
    body: "Fat loss has one mechanism: consuming less energy than you burn. Not a specific food, not a specific timing, not a targeted exercise. Everything that works does so because it creates a deficit. Your body pulls energy from stored fat when it needs more than you give it, and it does this everywhere at once. You cannot direct where it comes from.",
    ref: "Hall et al. 2012 (Am J Clin Nutr): fat loss was equivalent across all diet types when total calories were matched.",
    practical: "A 300-500 kcal/day deficit is the sweet spot. Enough to lose fat, moderate enough to hold onto muscle.",
    courseHook: false,
  },
  {
    num: "02",
    category: "Macronutrient Strategy",
    name: "Protein",
    tagline: "The lever that controls body composition",
    body: "In a deficit, your body pulls from fat and muscle. Protein is what tells it to protect the muscle. It also has a 20-35% thermic effect, meaning your body burns roughly a quarter of its own calories just digesting it (compared to 5-10% for carbs, almost nothing for fat). Getting enough protein is one of the few things that works in multiple directions at once.",
    ref: "Morton et al. 2018 (Br J Sports Med): meta-analysis of 49 studies found 1.6-2.2 g/kg (0.7-1 g/lb) optimizes muscle retention and growth.",
    practical: "Target 0.7-1 g per lb of bodyweight (1.6-2.2 g/kg). A 140 lb (65 kg) person needs 98-140 g/day.",
    courseHook: false,
  },
  {
    num: "03",
    category: "Muscle and Metabolism",
    name: "Build Muscle",
    tagline: "The closest thing to a real shortcut",
    body: "1 lb of muscle burns roughly 6 kcal/day at rest. 1 lb of fat burns about 2. Every pound of muscle you build raises your resting metabolism permanently. It compounds over time, and it doesn't switch off. More muscle means more calories burned all day, every day, without doing anything extra. This is the long game most people skip.",
    ref: "Srikanthan and Karlamangla (Am J Med, 2014): higher muscle mass was inversely linked to all-cause mortality over 10-16 years. Muscle is the organ of longevity.",
    practical: "",
    courseHook: true,
  },
  {
    num: "04",
    category: "Daily Energy Output",
    name: "Daily Movement",
    tagline: "The hidden calorie variable nobody talks about",
    body: "NEAT (Non-Exercise Activity Thermogenesis) is everything you burn outside the gym: walking, standing, taking stairs. It varies by up to 2,000 kcal/day between people of similar size and similar workout habits. One full gym session can be cancelled out by sitting the rest of the day. Your steps matter more than most people realize.",
    ref: "Levine et al. 2005 (Science, Mayo Clinic): NEAT accounts for 15-50% of total daily energy expenditure and varies by up to 2,000 kcal/day between individuals.",
    practical: "8,000-10,000 steps/day is a solid daily target. Walk after meals. Take the stairs.",
    courseHook: false,
  },
  {
    num: "05",
    category: "Hormonal Health",
    name: "Sleep",
    tagline: "The hormone controller you are probably ignoring",
    body: "Sleeping 4 hours raises ghrelin (the hunger hormone) by 28% and drops leptin (the fullness hormone) by 18%. That's a 24% spike in next-day hunger you can't willpower your way through. Poor sleep doesn't just make you tired. It changes your hormones and stacks the deck against every good choice you try to make the next day.",
    ref: "Spiegel et al. 2004 (Ann Intern Med, University of Chicago): sleep restriction significantly increases hunger and appetite for calorie-dense food.",
    practical: "7-9 hours. Not a wellness trend. A hormonal requirement.",
    courseHook: false,
  },
]

const EQUATION_ROWS = [
  { label: "Calorie Deficit", sub: "The mechanism" },
  { label: "Adequate Protein", sub: "The lever" },
  { label: "Resistance Training", sub: "The multiplier" },
  { label: "Daily Movement", sub: "The constant" },
  { label: "Quality Sleep", sub: "The regulator" },
]

function NutritionGuidePDF() {
  return createElement(
    Document,
    { title: "Nutrition Guide - Lisa Fit Method" },
    createElement(
      Page,
      { size: "A4", style: styles.page },

      // Header
      createElement(
        View,
        { style: styles.header },
        createElement(Text, { style: styles.brandLabel }, "Lisa Fit Method"),
        createElement(Text, { style: styles.title }, "Stop searching for shortcuts."),
        createElement(Text, { style: styles.subtitle }, "5 science-backed nutrition principles - Lisa McPherson, CPT")
      ),

      // Intro
      createElement(Text, { style: styles.intro }, "Five principles. Real references. No supplements to buy, no protocol to follow."),
      createElement(Text, { style: styles.introStrong }, "This is the actual science behind every approach that works."),

      // Story box
      createElement(
        View,
        { style: styles.storyBox },
        createElement(Text, { style: styles.storyText }, "Every week, people search for how to lose belly fat fast. Fat burners. Detox teas. The targeted ab workout. None of it works because fat loss doesn't work that way. You can't pull fat from just one place. Your body accesses stored energy from everywhere when it needs more than you give it."),
        createElement(Text, { style: styles.storyText }, "I'm an engineer. I needed the mechanism, not the marketing. So I went to the research. What I found is simpler than the industry wants it to seem, and more powerful than any shortcut they're selling."),
        createElement(Text, { style: styles.storySig }, "Lisa McPherson, CPT")
      ),

      // Section header
      createElement(Text, { style: styles.sectionLabel }, "The 5 Principles"),
      createElement(Text, { style: styles.sectionTitle }, "The full equation. Nothing left out."),
      createElement(Text, { style: styles.sectionIntro }, "Every diet that works, works because it satisfies some or all of these. Understanding them means you stop following plans blindly and start understanding why things work."),

      // Principles
      ...PRINCIPLES_PDF.flatMap((p, i) => {
        const block = createElement(
          View,
          { style: styles.principleBlock, key: p.num },
          createElement(
            View,
            { style: styles.principleHeader },
            createElement(Text, { style: styles.principleNum }, p.num),
            createElement(Text, { style: styles.principleCategory }, p.category)
          ),
          createElement(Text, { style: styles.principleName }, p.name),
          createElement(Text, { style: styles.principleTagline }, p.tagline),
          createElement(Text, { style: styles.principleBody }, p.body),
          createElement(Text, { style: styles.principleRef }, p.ref),
          ...(p.practical
            ? [createElement(
                View,
                { style: styles.practicalRow },
                createElement(Text, { style: styles.practicalArrow }, "-> "),
                createElement(Text, { style: styles.practicalText }, p.practical)
              )]
            : []
          ),
          ...(p.courseHook
            ? [createElement(
                View,
                { style: styles.courseHookBox },
                createElement(Text, { style: styles.courseHookArrow }, "-> "),
                createElement(Text, { style: styles.courseHookText }, "This is what the 4-week program is built around. Structured resistance training that builds muscle progressively, session by session, week by week, with the nutrition module to back it up.")
              )]
            : []
          )
        )
        const divider = i < PRINCIPLES_PDF.length - 1
          ? createElement(View, { style: styles.divider, key: `div-${i}` })
          : null
        return divider ? [block, divider] : [block]
      }),

      // Equation section
      createElement(View, { style: styles.divider }),
      createElement(Text, { style: styles.sectionLabel }, "Putting it together"),
      createElement(Text, { style: { fontSize: 13, fontFamily: "Helvetica-Bold", color: INK, marginBottom: 4 } }, "There is no sixth thing."),
      createElement(Text, { style: { fontSize: 8.5, color: MUTED, lineHeight: 1.65, marginBottom: 10 } }, "Every sustainable body transformation runs on these five variables. You don't need all five to be perfect. But you do need all five in the frame."),

      createElement(
        View,
        { style: styles.equationBox },
        ...EQUATION_ROWS.map((row, i) =>
          createElement(
            View,
            { key: i },
            createElement(
              View,
              { style: styles.equationRow },
              createElement(
                View,
                { style: { flex: 1 } },
                createElement(Text, { style: styles.equationLabel }, row.label),
                createElement(Text, { style: styles.equationSub }, row.sub)
              ),
              i < 4
                ? createElement(Text, { style: styles.equationPlus }, "+")
                : createElement(Text, { style: styles.equationResult }, "= Results")
            ),
            i < 4 ? createElement(View, { style: styles.equationRowDivider }) : null
          )
        )
      ),

      // Footer
      createElement(
        View,
        { style: styles.footer, fixed: true },
        createElement(Text, { style: styles.footerText }, "Lisa McPherson, CPT - Nutrition Guide"),
        createElement(Text, { style: styles.footerBrand }, "lisafitmethod.com")
      )
    )
  )
}

export async function generateNutritionGuidePDF(): Promise<Buffer> {
  const stream = await pdf(createElement(NutritionGuidePDF)).toBuffer()
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = []
    stream.on("data", (chunk: Buffer) => chunks.push(chunk))
    stream.on("end", () => resolve(Buffer.concat(chunks)))
    stream.on("error", reject)
  })
}
