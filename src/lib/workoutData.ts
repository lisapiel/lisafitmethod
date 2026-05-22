export interface ExerciseDef {
  id: string
  name: string
  defaultSets: number
  defaultReps: number | null // null = distance/time-based
  bodyweight: boolean
  note?: string // e.g. "per side", "20–30 m"
}

export interface DayDef {
  label: string
  exercises: ExerciseDef[]
}

export const WORKOUT_DAYS: Record<"a" | "b" | "c", DayDef> = {
  a: {
    label: "Day A — Lower Body",
    exercises: [
      { id: "goblet_squat",    name: "Goblet Squat",          defaultSets: 3, defaultReps: 10, bodyweight: false },
      { id: "rdl",             name: "Romanian Deadlift",     defaultSets: 3, defaultReps: 10, bodyweight: false },
      { id: "hip_thrust",      name: "Hip Thrust",            defaultSets: 3, defaultReps: 12, bodyweight: false },
      { id: "band_abduction",  name: "Seated Band Abduction", defaultSets: 3, defaultReps: 15, bodyweight: true,  note: "band resistance" },
      { id: "dead_bug_a",      name: "Dead Bug",              defaultSets: 3, defaultReps: 8,  bodyweight: true,  note: "per side" },
      { id: "farmers_carry",   name: "Farmer's Carry",        defaultSets: 3, defaultReps: null, bodyweight: false, note: "20–30 m" },
    ],
  },
  b: {
    label: "Day B — Upper Body",
    exercises: [
      { id: "db_bench",        name: "DB Bench Press",        defaultSets: 3, defaultReps: 10, bodyweight: false },
      { id: "overhead_press",  name: "Overhead Press",        defaultSets: 3, defaultReps: 10, bodyweight: false },
      { id: "chest_row",       name: "Chest Supported Row",   defaultSets: 3, defaultReps: 12, bodyweight: false },
      { id: "band_pullup",     name: "Band-Assisted Pull-Up", defaultSets: 3, defaultReps: 8,  bodyweight: false, note: "assisted" },
      { id: "bicep_curl",      name: "Bicep Curl",            defaultSets: 3, defaultReps: 12, bodyweight: false, note: "superset" },
      { id: "tricep_ext",      name: "Tricep Extension",      defaultSets: 3, defaultReps: 12, bodyweight: false, note: "superset" },
      { id: "bird_dog_b",      name: "Bird Dog",              defaultSets: 3, defaultReps: 10, bodyweight: true,  note: "per side" },
      { id: "pallof_press",    name: "Pallof Press",          defaultSets: 3, defaultReps: 10, bodyweight: false, note: "per side" },
    ],
  },
  c: {
    label: "Day C — Integration",
    exercises: [
      { id: "sl_glute_bridge", name: "Single-Leg Glute Bridge", defaultSets: 3, defaultReps: 10, bodyweight: true,  note: "per side" },
      { id: "reverse_lunge",   name: "Reverse Lunge",           defaultSets: 3, defaultReps: 10, bodyweight: false, note: "per side" },
      { id: "monster_walk",    name: "Monster Walk",            defaultSets: 3, defaultReps: null, bodyweight: true, note: "circuit ×3" },
      { id: "lateral_band",    name: "Lateral Band Walk",       defaultSets: 3, defaultReps: null, bodyweight: true, note: "circuit ×3" },
      { id: "hip_abduction_c", name: "Hip Abduction",           defaultSets: 3, defaultReps: 15, bodyweight: true,  note: "circuit ×3" },
      { id: "pushup_c",        name: "Push-Up",                 defaultSets: 3, defaultReps: 10, bodyweight: true,  note: "superset" },
      { id: "inverted_row",    name: "Inverted Row",            defaultSets: 3, defaultReps: 10, bodyweight: true,  note: "superset" },
      { id: "dead_bug_c",      name: "Dead Bug",                defaultSets: 3, defaultReps: 8,  bodyweight: true,  note: "superset / per side" },
      { id: "copenhagen",      name: "Copenhagen Plank",        defaultSets: 3, defaultReps: null, bodyweight: true, note: "superset / hold" },
      { id: "stir_the_pot",    name: "Stir the Pot",            defaultSets: 3, defaultReps: 8,  bodyweight: true,  note: "each direction" },
    ],
  },
}
