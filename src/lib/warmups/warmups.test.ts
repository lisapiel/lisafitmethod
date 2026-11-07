import { test, describe } from "node:test"
import assert from "node:assert/strict"
import {
  indexLibrary, planDay, sequenceState, fillEmptySequences, normaliseName, DEFAULT_OPTIONS,
  type LibraryExercise, type DayLike, type Sequence,
} from "./engine"
import { WARMUPS, COOLDOWNS } from "./sequences"
import { reviewProgram, applyReview, prepareForClient } from "./review"
import { suggestFromIntake, effectiveOptions } from "./profile"

// Library spelled the way the real one is: "Thoratic", "90_90", trailing space.
const drillNames = [
  "Hip Switches", "World's Greatest Stretch", "Leg Swings Front to Back", "Leg Swings Side to Side ", "Cossack Squat",
  "Lateral Lunge", "Cobra to Child's Pose", "Arm Circles", "Thoratic Rotation", "Scapular Push Up", "Inchworm to Push Up",
  "Band Shoulder External Rotation", "Y T W Raise", "Scapular Pull Up", "Band Scapular Retraction", "Jumping Jacks",
  "Cat Cow", "Bird Dog", "Dead Bug", "90_90 Switch", "Cobra Hold", "Low Lunge Stretch", "90_90 Hamstring Stretch",
  "Pigeon Pose", "Figure 4 Stretch", "Kneeling Quad Stretch", "Frog Stretch", "Wall Calf Stretch", "Foam Roller Glutes Stretch",
  "Puppy Pose", "Thread The Needle Stretch", "Open Book Stretch", "Lying Spinal Twist", "Triceps Stretch", "Band Lat Stretch",
]
const main: LibraryExercise[] = [
  { id: "squat", name: "Goblet Squat", primaryMuscle: "Quads, Glutes" },
  { id: "rdl", name: "Romanian Deadlift", primaryMuscle: "Hamstrings, Glutes" },
  { id: "thrust", name: "Hip Thrust", primaryMuscle: "Glutes" },
  { id: "bench", name: "DB Bench Press", primaryMuscle: "Chest, Triceps" },
  { id: "ohp", name: "Overhead Press", primaryMuscle: "Shoulders" },
  { id: "pushdown", name: "Triceps Pushdown", primaryMuscle: "Triceps" },
  { id: "row", name: "Cable Row", primaryMuscle: "Upper Back" },
  { id: "pulldown", name: "Lat Pulldown", primaryMuscle: "Lats" },
  { id: "curl", name: "Curl", primaryMuscle: "Biceps" },
  { id: "plank", name: "Plank", primaryMuscle: "Abs" },
  { id: "legraise", name: "Leg Raise", primaryMuscle: "Abs, Hip Flexors" },
  { id: "twist", name: "Russian Twist", primaryMuscle: "Obliques" },
  { id: "thruster", name: "Thruster", primaryMuscle: "Quads, Glutes, Shoulders" },
  { id: "untagged", name: "Mystery Move" },
  { id: "butterfly", name: "Butterfly Stretch", primaryMuscle: "Adductors", category: "stretch, mobility", movementPattern: "mobility" },
  { id: "hipcircle", name: "Hip Circles", primaryMuscle: "Hip Flexors", category: "mobility, warm up" },
  { id: "latlunge", name: "Lateral Lunge (main)", primaryMuscle: "Quads, Glutes", category: "leg, glute, mobility, bodyweight" },
]
const library: LibraryExercise[] = [
  ...drillNames.map((name, i) => ({ id: `d${i}`, name, videoS3Key: `v/${i}.mp4` })),
  ...main,
]
const index = indexLibrary(library)
const day = (dayLabel: string, ids: string[], extra: Partial<DayLike> = {}): DayLike =>
  ({ dayLabel, exercises: ids.map((id) => ({ exerciseId: id, name: id })), ...extra })
const names = (s: { exercises: Array<{ name: string }> }) => s.exercises.map((e) => normaliseName(e.name))

describe("session type", () => {
  test("exercises decide when the day name is generic", () => {
    assert.equal(planDay(day("Day 1", ["squat", "rdl", "thrust", "plank"]), index, DEFAULT_OPTIONS)?.typeLabel, "Leg Day")
    assert.equal(planDay(day("Day 2", ["bench", "ohp", "pushdown"]), index, DEFAULT_OPTIONS)?.typeLabel, "Upper Push")
    assert.equal(planDay(day("Day 3", ["row", "pulldown", "curl"]), index, DEFAULT_OPTIONS)?.typeLabel, "Upper Pull")
    assert.equal(planDay(day("Day 4", ["bench", "row", "ohp", "pulldown"]), index, DEFAULT_OPTIONS)?.typeLabel, "Upper Body")
    assert.equal(planDay(day("Day 5", ["squat", "rdl", "bench", "row"]), index, DEFAULT_OPTIONS)?.typeLabel, "Full Body")
  })
  test("abs or obliques as the main focus make a core day; a core finisher does not", () => {
    assert.equal(planDay(day("Day 1", ["plank", "legraise", "twist", "squat"]), index, DEFAULT_OPTIONS)?.typeLabel, "Core / Conditioning")
    assert.equal(planDay(day("Day 1", ["squat", "rdl", "thrust", "plank"]), index, DEFAULT_OPTIONS)?.typeLabel, "Leg Day")
  })
  test("an explicit day name decides, and a conflict is flagged", () => {
    const p = planDay(day("Upper Body Push focus", ["bench", "row", "pulldown", "curl"]), index, DEFAULT_OPTIONS)
    assert.equal(p?.typeLabel, "Upper Push")
    assert.equal(p?.decidedBy, "day name")
    const odd = planDay(day("Lower Body", ["bench", "ohp", "pushdown"]), index, DEFAULT_OPTIONS)
    assert.equal(odd?.typeLabel, "Leg Day")
    assert.match(odd!.flags.join(" "), /look like Upper Push/)
  })
  test("'+ Core' and body-part names narrow but do not override", () => {
    assert.equal(planDay(day("Lower Strength + Core", ["squat", "rdl", "plank"]), index, DEFAULT_OPTIONS)?.typeLabel, "Leg Day")
    assert.equal(planDay(day("Back + Chest + Biceps", ["row", "pulldown", "curl", "row", "bench"]), index, DEFAULT_OPTIONS)?.typeLabel, "Upper Pull")
    assert.equal(planDay(day("Upper A", ["bench", "row", "ohp", "pulldown"]), index, DEFAULT_OPTIONS)?.typeLabel, "Upper Body")
  })
  test("untagged exercises are flagged; a day with no exercises gets no plan", () => {
    assert.match(planDay(day("Day 1", ["untagged", "untagged", "squat"]), index, DEFAULT_OPTIONS)!.flags.join(" "), /no muscle tags/)
    assert.equal(planDay(day("Day 1", []), index, DEFAULT_OPTIONS), null)
  })
})

describe("sequences follow the spreadsheet", () => {
  test("Upper Push with bands is exactly the five listed exercises", () => {
    const p = planDay(day("Push", ["bench", "ohp"]), index, { ...DEFAULT_OPTIONS, bands: true })!
    assert.deepEqual(names(p.warmup), ["arm circles", "thoracic rotation", "scapular push up", "inchworm to push up", "band shoulder external rotation"])
    assert.ok(!WARMUPS.upperPush.some((d) => /band shoulder warm up/i.test(d.name)))
  })
  test("without bands, upper days use the bodyweight sequence", () => {
    assert.equal(planDay(day("Pull", ["row"]), index, DEFAULT_OPTIONS)!.warmup.exercises.length, 4)
    assert.equal(planDay(day("Pull", ["row"]), index, { ...DEFAULT_OPTIONS, bands: true })!.warmup.exercises.length, 6)
  })
  test("Thoracic Rotation links to the library's 'Thoratic Rotation' and its video, shown with the correct spelling", () => {
    const ex = planDay(day("Push", ["bench"]), index, DEFAULT_OPTIONS)!.warmup.exercises[1]
    assert.equal(ex.name, "Thoracic Rotation")
    assert.equal(ex.exerciseId, index.byName.get("thoratic rotation")?.id)
    assert.ok(ex.videoS3Key)
  })
  test("beginner swaps Cossack Squat for Lateral Lunge", () => {
    const std = names(planDay(day("Legs", ["squat"]), index, DEFAULT_OPTIONS)!.warmup)
    const beg = planDay(day("Legs", ["squat"]), index, { ...DEFAULT_OPTIONS, beginner: true })!
    assert.ok(std.includes("cossack squat"))
    assert.ok(names(beg.warmup).includes("lateral lunge") && !names(beg.warmup).includes("cossack squat"))
    assert.deepEqual(beg.warmup.adjustments, ["Beginner: Cossack Squat → Lateral Lunge"])
  })
  test("back caution swaps Pigeon for Figure 4 on leg and full-body days", () => {
    for (const label of ["Legs", "Full Body"]) {
      const cd = names(planDay(day(label, ["squat", "row"]), index, { ...DEFAULT_OPTIONS, backSafe: false })!.cooldown)
      assert.ok(cd.includes("figure 4 stretch") && !cd.includes("pigeon pose"), label)
    }
  })
  test("triceps and lats stretches appear only when trained", () => {
    const push = names(planDay(day("Push", ["bench"]), index, DEFAULT_OPTIONS)!.cooldown)
    const pushNoTri = names(planDay(day("Push", ["ohp"]), index, DEFAULT_OPTIONS)!.cooldown)
    assert.ok(push.includes("triceps stretch") && !pushNoTri.includes("triceps stretch"))
    const ub = names(planDay(day("Upper Body", ["ohp", "row"]), index, DEFAULT_OPTIONS)!.cooldown)
    assert.ok(!ub.includes("band lat stretch"))
    assert.ok(names(planDay(day("Upper Body", ["ohp", "pulldown"]), index, DEFAULT_OPTIONS)!.cooldown).includes("band lat stretch"))
  })
  test("foam roller stretch only when a foam roller is available", () => {
    assert.equal(planDay(day("Legs", ["squat"]), index, DEFAULT_OPTIONS)!.cooldown.exercises.length, 7)
    assert.equal(planDay(day("Legs", ["squat"]), index, { ...DEFAULT_OPTIONS, foamRoller: true })!.cooldown.exercises.length, 8)
  })
  test("Jumping Jacks open full-body warm-ups only", () => {
    assert.equal(planDay(day("Full Body", ["squat", "row"]), index, DEFAULT_OPTIONS)!.warmup.exercises[0].name, "Jumping Jacks")
    for (const t of ["leg", "upperPush", "upperPull", "upperBody", "core"] as const) assert.ok(!WARMUPS[t].some((d) => d.name === "Jumping Jacks"))
  })
  test("Puppy Pose and Cobra Hold on every upper, full and core cool-down", () => {
    for (const t of ["upperPush", "upperPull", "upperBody", "fullBody", "core"] as const) {
      const n = COOLDOWNS[t].map((d) => d.name)
      assert.ok(n.includes("Puppy Pose") && n.includes("Cobra Hold"), t)
    }
  })
  test("doses: warm-ups 10 reps (each side noted), cool-downs 30–45s holds", () => {
    const p = planDay(day("Legs", ["squat"]), index, DEFAULT_OPTIONS)!
    assert.deepEqual([p.warmup.exercises[0].metric, p.warmup.exercises[0].reps], ["reps", "10"])
    assert.equal(p.warmup.exercises[1].coachNotes, "Each side")
    assert.deepEqual([p.cooldown.exercises[0].metric, p.cooldown.exercises[0].reps], ["time", "30–45s"])
  })
  test("a sequence exercise missing from the library is left out and flagged", () => {
    const small = indexLibrary(library.filter((e) => e.name !== "Frog Stretch"))
    const p = planDay(day("Legs", ["squat"]), small, DEFAULT_OPTIONS)!
    assert.ok(p.flags.some((f) => f.includes("Frog Stretch")))
  })
})

describe("never overwrite what the coach built", () => {
  const plan = (d: DayLike) => planDay(d, index, DEFAULT_OPTIONS)
  const handBuilt: Sequence = { notes: "My own warm-up", exercises: [{ exerciseId: "d0", name: "Hip Switches", videoS3Key: "", sets: "", reps: "20", weight: "", rpe: "", rest: "", tempo: "", coachNotes: "", metric: "reps" }] }
  test("states: empty, automatic, outdated, and legacy content counted as manual", () => {
    const d = day("Legs", ["squat"])
    assert.equal(sequenceState(d, "warmup", plan(d)).status, "empty")
    const filled = fillEmptySequences(d, plan(d)).day
    assert.equal(sequenceState(filled, "warmup", plan(filled)).status, "auto-current")
    const changed = { ...filled, dayLabel: "Push", exercises: [{ exerciseId: "bench", name: "bench" }] }
    assert.equal(sequenceState(changed, "warmup", plan(changed)).status, "auto-outdated")
    const legacy = { ...d, warmup: handBuilt }
    assert.equal(sequenceState(legacy, "warmup", plan(legacy)).status, "manual")
  })
  test("fill leaves hand-built sequences alone", () => {
    const d = day("Legs", ["squat"], { warmup: handBuilt })
    const { day: out, filled } = fillEmptySequences(d, plan(d))
    assert.deepEqual(filled, ["cooldown"])
    assert.equal(out.warmup, handBuilt)
  })
})

describe("review and apply for existing programs", () => {
  const weeks = JSON.stringify([
    { weekNumber: 1, label: "Week 1", days: [day("Legs", ["squat", "rdl"], { warmup: { notes: "Keep me", exercises: [] } }), day("Push", ["bench"])] },
    { weekNumber: 2, label: "Week 2", days: [day("Legs", ["squat", "rdl"]), day("Rest", [])] },
  ])
  test("lists only empty sequences on days with exercises", () => {
    const items = reviewProgram(weeks, index, DEFAULT_OPTIONS)
    assert.deepEqual(items.map((i) => `${i.week}.${i.dayIndex}.${i.kind}`), ["1.0.cooldown", "1.1.warmup", "1.1.cooldown", "2.0.warmup", "2.0.cooldown"])
  })
  test("apply fills only the selection, skips anything no longer empty, and leaves everything else byte-identical", () => {
    const res = applyReview(weeks, index, DEFAULT_OPTIONS, [
      { week: 2, dayIndex: 0, kind: "warmup" }, { week: 1, dayIndex: 0, kind: "warmup" },
    ])
    assert.deepEqual([res.applied, res.skipped], [1, 1])
    const before = JSON.parse(weeks), after = JSON.parse(res.weeks)
    assert.equal(after[1].days[0].warmup.source, "auto")
    assert.equal(after[0].days[0].warmup.notes, "Keep me")
    after[1].days[0].warmup = undefined; before[1].days[0].warmup = undefined
    assert.deepEqual(after, before)
  })
  test("assigning to a client fills empties, re-chooses automatic ones, keeps manual ones", () => {
    const tmpl = JSON.parse(weeks)
    tmpl[0].days[1] = fillEmptySequences(tmpl[0].days[1], planDay(tmpl[0].days[1], index, DEFAULT_OPTIONS)).day
    const res = prepareForClient(JSON.stringify(tmpl), index, { ...DEFAULT_OPTIONS, bands: true })
    const out = JSON.parse(res.weeks)
    assert.equal(out[0].days[0].warmup.notes, "Keep me")
    assert.equal(out[0].days[1].warmup.exercises.length, 5, "re-chosen with bands")
    assert.ok(res.filled >= 3 && res.updated >= 1)
  })
})

describe("client options from intake", () => {
  test("form answers", () => {
    assert.equal(suggestFromIntake({ trainingExperience: "Less than 6 months" }).options.beginner, true)
    assert.equal(suggestFromIntake({ trainingExperience: "3–5 years" }).options.beginner, false)
    assert.equal(suggestFromIntake({ trainingExperience: "3–5 years" }).flags.length, 0)
  })
  test("older and free-text answers are read but flagged", () => {
    assert.equal(suggestFromIntake({ trainingExperience: "Moins de 6 mois" }).options.beginner, true)
    const g = suggestFromIntake({ currentFitnessLevel: "Crossfit 10+ years but inconsistent recently" })
    assert.equal(g.options.beginner, false)
    assert.match(g.flags.join(" "), /free-text/)
  })
  test("missing or unclear experience defaults to beginner, with a flag", () => {
    for (const s of [suggestFromIntake(null), suggestFromIntake({ trainingExperience: "it depends" })]) {
      assert.equal(s.options.beginner, true); assert.equal(s.flags.length, 1)
    }
  })
  test("back mentions switch to Figure 4 and flag it; 'None' does not", () => {
    const b = suggestFromIntake({ trainingExperience: "5+ years", injuries: "Lower back disc issue in 2022" })
    assert.equal(b.options.backSafe, false)
    assert.equal(suggestFromIntake({ trainingExperience: "5+ years", injuries: "None" }).options.backSafe, true)
    assert.equal(suggestFromIntake({ trainingExperience: "5+ years", injuries: "None" }).flags.length, 0)
  })
  test("bands from intake; the coach's saved choice always wins", () => {
    const s = suggestFromIntake({ trainingExperience: "5+ years", equipment: "Dumbbells only", equipmentDetails: "plus resistance bands" })
    assert.equal(s.options.bands, true)
    assert.equal(effectiveOptions({ bands: false, beginner: true }, s).bands, false)
    assert.equal(effectiveOptions({ bands: false, beginner: true }, s).beginner, true)
  })
})

describe("a sequence the coach emptied on purpose", () => {
  test("is not refilled, suggested or applied", () => {
    const d = day("Legs", ["squat"], { warmup: { notes: "", exercises: [], source: "manual" } })
    const plan = planDay(d, index, DEFAULT_OPTIONS)
    assert.equal(sequenceState(d, "warmup", plan).status, "manual")
    assert.deepEqual(fillEmptySequences(d, plan).filled, ["cooldown"])
    const weeks = JSON.stringify([{ weekNumber: 1, days: [d] }])
    assert.ok(!reviewProgram(weeks, index, DEFAULT_OPTIONS).some((i) => i.kind === "warmup"))
    assert.equal(applyReview(weeks, index, DEFAULT_OPTIONS, [{ week: 1, dayIndex: 0, kind: "warmup" }]).applied, 0)
  })
})

describe("mobility sessions", () => {
  test("a day that is mostly mobility or stretching gets no automatic sequences", () => {
    const d = day("Day 2", ["butterfly", "hipcircle", "latlunge", "squat"])
    assert.equal(planDay(d, index, DEFAULT_OPTIONS), null)
    assert.equal(reviewProgram(JSON.stringify([{ weekNumber: 1, days: [d] }]), index, DEFAULT_OPTIONS).length, 0)
  })
  test("one mobility-tagged exercise on a leg day changes nothing", () => {
    assert.equal(planDay(day("Day 1", ["latlunge", "squat", "rdl", "thrust"]), index, DEFAULT_OPTIONS)?.typeLabel, "Leg Day")
  })
})
