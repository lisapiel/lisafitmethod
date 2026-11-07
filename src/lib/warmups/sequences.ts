// Transcribed from Lisa's "Ambrisa_WarmUp_CoolDown_Sequences" spreadsheet
// (Warm-Up Sequences, Cool-Down Sequences and Logic Flags tabs). Order is the
// spreadsheet order. "Band Shoulder Warm Up" from the Logic Flags tab is
// deliberately absent: it is not defined in the exercise list.

export type SessionType = "leg" | "upperPush" | "upperPull" | "upperBody" | "fullBody" | "core"

export const SESSION_LABEL: Record<SessionType, string> = {
  leg: "Leg Day",
  upperPush: "Upper Push",
  upperPull: "Upper Pull",
  upperBody: "Upper Body",
  fullBody: "Full Body",
  core: "Core / Conditioning",
}

export type DrillCondition = "bands" | "triceps" | "lats" | "foamRoller"
export type DrillSwap = { when: "beginner" | "backUnsafe"; to: string }

export interface SequenceDrill {
  name: string
  perSide?: boolean
  when?: DrillCondition
  swap?: DrillSwap
  metric?: "reps" | "time"
  dose?: string
}

const WARMUP_REPS = "10"
export const COOLDOWN_HOLD = "30–45s"

export const WARMUPS: Record<SessionType, SequenceDrill[]> = {
  leg: [
    { name: "Hip Switches" },
    { name: "World's Greatest Stretch", perSide: true },
    { name: "Leg Swings Front to Back", perSide: true },
    { name: "Leg Swings Side to Side", perSide: true },
    { name: "Cossack Squat", perSide: true, swap: { when: "beginner", to: "Lateral Lunge" } },
    { name: "Cobra to Child's Pose" },
  ],
  upperPush: [
    { name: "Arm Circles" },
    { name: "Thoracic Rotation", perSide: true },
    { name: "Scapular Push Up" },
    { name: "Inchworm to Push Up" },
    { name: "Band Shoulder External Rotation", perSide: true, when: "bands" },
  ],
  upperPull: [
    { name: "Arm Circles" },
    { name: "Thoracic Rotation", perSide: true },
    { name: "Y T W Raise" },
    { name: "Scapular Pull Up" },
    { name: "Band Scapular Retraction", when: "bands" },
    { name: "Band Shoulder External Rotation", perSide: true, when: "bands" },
  ],
  upperBody: [
    { name: "Arm Circles" },
    { name: "Y T W Raise" },
    { name: "Inchworm to Push Up" },
    { name: "Scapular Push Up" },
    { name: "Band Scapular Retraction", when: "bands" },
  ],
  fullBody: [
    { name: "Jumping Jacks", metric: "time", dose: "30s" },
    { name: "World's Greatest Stretch", perSide: true },
    { name: "Hip Switches" },
    { name: "Arm Circles" },
    { name: "Thoracic Rotation", perSide: true },
    { name: "Cobra to Child's Pose" },
  ],
  core: [
    { name: "Cat Cow" },
    { name: "Bird Dog", perSide: true },
    { name: "Dead Bug", perSide: true },
    { name: "90/90 Switch", perSide: true },
    { name: "Cobra to Child's Pose" },
  ],
}

const pigeon: SequenceDrill = { name: "Pigeon Pose", perSide: true, swap: { when: "backUnsafe", to: "Figure 4 Stretch" } }

export const COOLDOWNS: Record<SessionType, SequenceDrill[]> = {
  leg: [
    { name: "Cobra Hold" },
    { name: "Low Lunge Stretch", perSide: true },
    { name: "90/90 Hamstring Stretch", perSide: true },
    pigeon,
    { name: "Kneeling Quad Stretch", perSide: true },
    { name: "Frog Stretch" },
    { name: "Wall Calf Stretch", perSide: true },
    { name: "Foam Roller Glutes Stretch", perSide: true, when: "foamRoller" },
  ],
  upperPush: [
    { name: "Puppy Pose" },
    { name: "Cobra Hold" },
    { name: "Thread The Needle Stretch", perSide: true },
    { name: "Open Book Stretch", perSide: true },
    { name: "Lying Spinal Twist", perSide: true },
    { name: "Triceps Stretch", perSide: true, when: "triceps" },
  ],
  upperPull: [
    { name: "Puppy Pose" },
    { name: "Cobra Hold" },
    { name: "Thread The Needle Stretch", perSide: true },
    { name: "Open Book Stretch", perSide: true },
    { name: "Lying Spinal Twist", perSide: true },
    { name: "Band Lat Stretch", perSide: true },
  ],
  upperBody: [
    { name: "Puppy Pose" },
    { name: "Cobra Hold" },
    { name: "Thread The Needle Stretch", perSide: true },
    { name: "Open Book Stretch", perSide: true },
    { name: "Lying Spinal Twist", perSide: true },
    { name: "Triceps Stretch", perSide: true, when: "triceps" },
    { name: "Band Lat Stretch", perSide: true, when: "lats" },
  ],
  fullBody: [
    { name: "Puppy Pose" },
    { name: "Cobra Hold" },
    { name: "90/90 Hamstring Stretch", perSide: true },
    pigeon,
    { name: "Kneeling Quad Stretch", perSide: true },
    { name: "Thread The Needle Stretch", perSide: true },
    { name: "Lying Spinal Twist", perSide: true },
  ],
  core: [
    { name: "Puppy Pose" },
    { name: "Cobra Hold" },
    { name: "Lying Spinal Twist", perSide: true },
    { name: "Open Book Stretch", perSide: true },
    { name: "90/90 Hamstring Stretch", perSide: true },
  ],
}

export function warmupDose(d: SequenceDrill): { metric: "reps" | "time"; reps: string } {
  return d.metric === "time" ? { metric: "time", reps: d.dose ?? "30s" } : { metric: "reps", reps: d.dose ?? WARMUP_REPS }
}

// Library spellings that differ from the spreadsheet. Keyed by normalised
// spreadsheet name, value is the normalised library name.
export const LIBRARY_ALIASES: Record<string, string> = {
  "thoracic rotation": "thoratic rotation",
}
