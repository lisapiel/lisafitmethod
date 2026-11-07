import {
  COOLDOWNS, COOLDOWN_HOLD, LIBRARY_ALIASES, SESSION_LABEL, WARMUPS, warmupDose,
  type SequenceDrill, type SessionType,
} from "./sequences"

export interface WarmupOptions {
  bands: boolean
  beginner: boolean
  backSafe: boolean
  foamRoller: boolean
}

export const DEFAULT_OPTIONS: WarmupOptions = { bands: false, beginner: false, backSafe: true, foamRoller: false }

export interface LibraryExercise {
  id: string
  name: string
  videoS3Key?: string | null
  primaryMuscle?: string | null
  category?: string | null
  movementPattern?: string | null
  status?: string
}

export interface DrillExercise {
  exerciseId: string
  name: string
  videoS3Key: string
  sets: string
  reps: string
  weight: string
  rpe: string
  rest: string
  tempo: string
  coachNotes: string
  metric?: "reps" | "time"
}

export type SequenceSource = "auto" | "manual"

export interface Sequence {
  notes: string
  exercises: DrillExercise[]
  source?: SequenceSource
  rule?: string
}

export interface DayLike {
  dayLabel: string
  exercises: Array<{ exerciseId: string; name: string }>
  warmup?: Sequence
  cooldown?: Sequence
}

export type SequenceKind = "warmup" | "cooldown"

export interface SequencePlan {
  kind: SequenceKind
  rule: string
  adjustments: string[]
  exercises: DrillExercise[]
  missingFromLibrary: string[]
}

export interface DayPlan {
  type: SessionType
  typeLabel: string
  decidedBy: "day name" | "exercises"
  flags: string[]
  warmup: SequencePlan
  cooldown: SequencePlan
}

// ── Library lookup ──────────────────────────────────────────────────────────

export function normaliseName(name: string): string {
  return name.toLowerCase().replace(/[’']/g, "").replace(/[_/]/g, " ").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim()
}

export function indexLibrary(library: LibraryExercise[]) {
  const byId = new Map<string, LibraryExercise>()
  const byName = new Map<string, LibraryExercise>()
  for (const ex of library) {
    byId.set(ex.id, ex)
    if (ex.status === "INACTIVE") continue
    const key = normaliseName(ex.name)
    if (!byName.has(key)) byName.set(key, ex)
  }
  return { byId, byName }
}
export type LibraryIndex = ReturnType<typeof indexLibrary>

function findDrill(index: LibraryIndex, name: string): LibraryExercise | undefined {
  const key = normaliseName(name)
  return index.byName.get(key) ?? index.byName.get(LIBRARY_ALIASES[key] ?? "")
}

// ── Session type ────────────────────────────────────────────────────────────

type Region = "leg" | "push" | "pull" | "core" | "full"

const MUSCLE_REGION: Array<[RegExp, Region]> = [
  [/quad|glute|hamstring|adductor|abductor|calf|calves|hip flexor|lower back/, "leg"],
  [/chest|tricep|shoulder|delt/, "push"],
  [/upper back|lat|bicep|trap|forearm|rhomboid/, "pull"],
  [/\babs?\b|oblique|core/, "core"],
  [/cardio|full body/, "full"],
]

const TEXT_REGION: Array<[RegExp, Region]> = [
  [/\bleg\b|glute|lower body|posterior chain|squat|lunge|hinge|hip_|knee|ankle|calves/, "leg"],
  [/\bpush\b|press|elbow_extension/, "push"],
  [/\bpull\b|row|elbow_flexion/, "pull"],
  [/\bcore\b|\babs\b|oblique/, "core"],
  [/full_body|cardio|locomotion/, "full"],
]

function regionsOf(ex: LibraryExercise | undefined): Region[] {
  if (!ex) return []
  const out: Region[] = []
  const muscles = (ex.primaryMuscle ?? "").toLowerCase().split(",").map((s) => s.trim()).filter(Boolean)
  for (const m of muscles) {
    const hit = MUSCLE_REGION.find(([re]) => re.test(m))
    if (hit && !out.includes(hit[1])) out.push(hit[1])
  }
  if (out.length > 0) return out
  const text = `${ex.category ?? ""} ${ex.movementPattern ?? ""}`.toLowerCase()
  const hit = TEXT_REGION.find(([re]) => re.test(text))
  return hit ? [hit[1]] : []
}

// The first-listed muscle leads ("Abs, Hip Flexors" is a core exercise);
// lower + upper together is a full-body movement such as a thruster.
function exerciseRegion(ex: LibraryExercise | undefined): Region | null {
  const r = regionsOf(ex)
  if (r.length === 0) return null
  if (r[0] === "core") return "core"
  const lower = r.includes("leg")
  const upper = r.includes("push") || r.includes("pull")
  if (r.includes("full") || (lower && upper)) return "full"
  if (lower) return "leg"
  return r.find((x) => x === "push" || x === "pull") ?? "core"
}

// Explicit session words decide. Body-part words only narrow the family;
// "+ Core" on a lower or upper day is an add-on, not the session type.
export function nameHint(label: string): { type: SessionType | null; family: "lower" | "upper" | "core" | null } {
  const l = label.toLowerCase()
  if (/full[\s-]*body/.test(l)) return { type: "fullBody", family: null }
  if (/\bpush\b/.test(l) && !/\bpull\b/.test(l)) return { type: "upperPush", family: "upper" }
  if (/\bpull\b/.test(l) && !/\bpush\b/.test(l)) return { type: "upperPull", family: "upper" }
  if (/upper[\s-]*body/.test(l)) return { type: "upperBody", family: "upper" }
  const lower = /\blower\b|\blegs?\b|glute|quad|hamstring/.test(l)
  const upper = /\bupper\b|shoulder|\barms?\b|chest|\bback\b|bicep|tricep/.test(l)
  const core = /\bcore\b|\babs\b|conditioning|cardio/.test(l)
  if (lower && !upper) return { type: "leg", family: "lower" }
  if (upper && !lower) return { type: null, family: "upper" }
  if (core && !lower && !upper) return { type: "core", family: "core" }
  return { type: null, family: null }
}

export function typeFromDayName(label: string): SessionType | null {
  return nameHint(label).type
}

const FAMILY: Record<SessionType, "lower" | "upper" | "full" | "core"> = {
  leg: "lower", upperPush: "upper", upperPull: "upper", upperBody: "upper", fullBody: "full", core: "core",
}

export function typeFromExercises(day: DayLike, index: LibraryIndex): { type: SessionType | null; unknown: number; total: number } {
  const counts: Record<Region, number> = { leg: 0, push: 0, pull: 0, core: 0, full: 0 }
  let unknown = 0
  for (const ex of day.exercises) {
    const region = exerciseRegion(index.byId.get(ex.exerciseId))
    if (region) counts[region] += 1
    else unknown += 1
  }
  const total = day.exercises.length
  const known = total - unknown
  if (known === 0) return { type: null, unknown, total }
  if (counts.core / known >= 0.5) return { type: "core", unknown, total }
  const upper = counts.push + counts.pull
  const body = counts.leg + upper + counts.full
  if (counts.full / known >= 0.5) return { type: "fullBody", unknown, total }
  if (counts.leg > 0 && upper > 0 && counts.leg / body >= 0.25 && upper / body >= 0.25) return { type: "fullBody", unknown, total }
  if (counts.leg + counts.full >= upper && counts.leg > 0) return { type: "leg", unknown, total }
  if (upper === 0) return { type: "fullBody", unknown, total }
  if (counts.push / upper >= 0.25 && counts.pull / upper >= 0.25) return { type: "upperBody", unknown, total }
  return { type: counts.push >= counts.pull ? "upperPush" : "upperPull", unknown, total }
}

// ── Planning ────────────────────────────────────────────────────────────────

function trains(day: DayLike, index: LibraryIndex, muscle: RegExp): boolean {
  return day.exercises.some((ex) => muscle.test((index.byId.get(ex.exerciseId)?.primaryMuscle ?? "").toLowerCase()))
}

function toDrill(lib: LibraryExercise, kind: SequenceKind, src: SequenceDrill): DrillExercise {
  const dose = kind === "warmup" ? warmupDose(src) : { metric: "time" as const, reps: COOLDOWN_HOLD }
  return {
    // The spreadsheet's spelling is shown to clients; the id and video come
    // from the library entry ("Thoratic Rotation", "90_90 …").
    exerciseId: lib.id, name: src.name, videoS3Key: lib.videoS3Key ?? "",
    sets: "", reps: dose.reps, weight: "", rpe: "", rest: "", tempo: "",
    coachNotes: src.perSide ? "Each side" : "", metric: dose.metric,
  }
}

function planSequence(kind: SequenceKind, type: SessionType, day: DayLike, index: LibraryIndex, opts: WarmupOptions): SequencePlan {
  const source = kind === "warmup" ? WARMUPS[type] : COOLDOWNS[type]
  const adjustments: string[] = []
  const missingFromLibrary: string[] = []
  const exercises: DrillExercise[] = []
  const tricepsTrained = trains(day, index, /tricep/)
  const latsTrained = trains(day, index, /\blats?\b/)
  for (const drill of source) {
    if (drill.when === "bands" && !opts.bands) continue
    if (drill.when === "foamRoller" && !opts.foamRoller) continue
    if (drill.when === "triceps" && !tricepsTrained) continue
    if (drill.when === "lats" && !latsTrained) continue
    if (drill.when === "bands") adjustments.push(`Bands: + ${drill.name}`)
    if (drill.when === "foamRoller") adjustments.push(`Foam roller: + ${drill.name}`)
    if (drill.when === "triceps") adjustments.push(`Triceps trained: + ${drill.name}`)
    if (drill.when === "lats") adjustments.push(`Lats trained: + ${drill.name}`)
    let name = drill.name
    if (drill.swap?.when === "beginner" && opts.beginner) {
      adjustments.push(`Beginner: ${drill.name} → ${drill.swap.to}`); name = drill.swap.to
    }
    if (drill.swap?.when === "backUnsafe" && !opts.backSafe) {
      adjustments.push(`Back caution: ${drill.name} → ${drill.swap.to}`); name = drill.swap.to
    }
    const lib = findDrill(index, name)
    if (!lib) { missingFromLibrary.push(name); continue }
    exercises.push(toDrill(lib, kind, { ...drill, name }))
  }
  const rule = `${SESSION_LABEL[type]} ${kind === "warmup" ? "warm-up" : "cool-down"}`
  return { kind, rule, adjustments, exercises, missingFromLibrary }
}

export function planDay(day: DayLike, index: LibraryIndex, opts: WarmupOptions): DayPlan | null {
  if (day.exercises.length === 0) return null
  const hint = nameHint(day.dayLabel)
  const byExercises = typeFromExercises(day, index)
  const flags: string[] = []
  let byName = hint.type
  if (!byName && hint.family === "upper") {
    byName = byExercises.type && FAMILY[byExercises.type] === "upper" ? byExercises.type : "upperBody"
  }
  const type = byName ?? byExercises.type
  if (!type) return null
  if (byName && byExercises.type && FAMILY[byName] !== FAMILY[byExercises.type] && FAMILY[byName] !== "full") {
    flags.push(`Named "${day.dayLabel}" but the exercises look like ${SESSION_LABEL[byExercises.type]}. Used the day name.`)
  }
  if (!byName && byExercises.unknown / byExercises.total > 0.3) {
    flags.push(`${byExercises.unknown} of ${byExercises.total} exercises have no muscle tags; session type is a best guess.`)
  }
  const warmup = planSequence("warmup", type, day, index, opts)
  const cooldown = planSequence("cooldown", type, day, index, opts)
  for (const name of [...warmup.missingFromLibrary, ...cooldown.missingFromLibrary]) flags.push(`"${name}" is not in the exercise library and was left out.`)
  return { type, typeLabel: SESSION_LABEL[type], decidedBy: byName ? "day name" : "exercises", flags, warmup, cooldown }
}

// ── Applying plans to days ──────────────────────────────────────────────────

export function isEmptySequence(seq: Sequence | undefined): boolean {
  return !seq || (seq.exercises.length === 0 && !seq.notes?.trim())
}

// Sequences with content but no source predate this system; they were built
// by hand, so they count as manual.
export function isManual(seq: Sequence | undefined): boolean {
  return !!seq && !isEmptySequence(seq) && seq.source !== "auto"
}

export function sequenceFromPlan(plan: SequencePlan): Sequence {
  return { notes: "", exercises: plan.exercises, source: "auto", rule: [plan.rule, ...plan.adjustments].join(" · ") }
}

export function sameDrills(a: Sequence | undefined, b: Sequence): boolean {
  const ids = (s: Sequence | undefined) => (s?.exercises ?? []).map((e) => e.exerciseId).join("|")
  return ids(a) === ids(b)
}

export type SequenceState =
  | { status: "empty"; proposal: Sequence }
  | { status: "auto-current" }
  | { status: "auto-outdated"; proposal: Sequence }
  | { status: "manual"; proposal: Sequence; differs: boolean }
  | { status: "no-plan" }

export function sequenceState(day: DayLike, kind: SequenceKind, plan: DayPlan | null): SequenceState {
  if (!plan) return { status: "no-plan" }
  const current = day[kind]
  const proposal = sequenceFromPlan(plan[kind])
  if (proposal.exercises.length === 0) return { status: "no-plan" }
  // A sequence the coach emptied on purpose stays empty.
  if (current?.source === "manual") return { status: "manual", proposal, differs: !sameDrills(current, proposal) }
  if (isEmptySequence(current)) return { status: "empty", proposal }
  if (current?.source === "auto") return sameDrills(current, proposal) ? { status: "auto-current" } : { status: "auto-outdated", proposal }
  return { status: "manual", proposal, differs: !sameDrills(current, proposal) }
}

// Fills only empty sequences. Never touches main exercises, notes, or any
// sequence that already has content.
export function fillEmptySequences<D extends DayLike>(day: D, plan: DayPlan | null): { day: D; filled: SequenceKind[] } {
  if (!plan) return { day, filled: [] }
  const filled: SequenceKind[] = []
  let next = day
  for (const kind of ["warmup", "cooldown"] as const) {
    const st = sequenceState(next, kind, plan)
    if (st.status === "empty") {
      next = { ...next, [kind]: st.proposal }
      filled.push(kind)
    }
  }
  return { day: next, filled }
}
