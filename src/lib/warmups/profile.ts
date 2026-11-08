import { DEFAULT_OPTIONS, type WarmupOptions } from "./engine"

export interface IntakeAnswers {
  trainingExperience?: string
  currentFitnessLevel?: string
  equipment?: string
  equipmentDetails?: string
  injuries?: string
}

export interface WarmupProfile {
  beginner?: boolean
  bands?: boolean
  backSafe?: boolean
  foamRoller?: boolean
  updatedAt?: string
}

export interface ProfileSuggestion {
  options: WarmupOptions
  reasons: Partial<Record<keyof WarmupOptions, string>>
  flags: string[]
}

const BEGINNER_EXPERIENCE = /new to structured|less than 6|moins de 6|6\s*(?:[–-]|to)\s*12|beginner|d[ée]butant/i
const EXPERIENCED = /\b([1-9]\d?)\s*\+?\s*(?:[–-]\s*\d+\s*)?(?:years?|yrs?|ans)\b|intermediate|advanced|interm[ée]diaire/i
const BACK_WORDS = /\b(back|spine|spinal|disc|disk|lumbar|sciatic|sciatica|herniat|si joint)\b/i
const NONE_WORDS = /^\s*(none|no|n\/a|nothing|nope|-)\s*\.?\s*$/i

// Conservative starting point only. Experience does not prove movement
// ability or injury safety; the coach confirms or changes every value.
export function suggestFromIntake(intake: IntakeAnswers | null): ProfileSuggestion {
  const options: WarmupOptions = { ...DEFAULT_OPTIONS, beginner: true }
  const reasons: ProfileSuggestion["reasons"] = {}
  const flags: string[] = []

  const exp = (intake?.trainingExperience || intake?.currentFitnessLevel || "").trim()
  const quoted = exp.length > 60 ? `${exp.slice(0, 57)}…` : exp
  if (exp && BEGINNER_EXPERIENCE.test(exp)) {
    reasons.beginner = `Intake: "${quoted}"`
  } else if (exp && EXPERIENCED.test(exp)) {
    options.beginner = false
    reasons.beginner = `Intake: "${quoted}"`
  } else if (exp) {
    reasons.beginner = `Intake answer "${quoted}" is unclear, so the beginner option is on to be safe`
    flags.push(`Unclear experience answer ("${quoted}"): beginner substitutions are on until you confirm.`)
  } else {
    reasons.beginner = "No training-experience answer, so the beginner option is on to be safe"
    flags.push("No training experience on file: beginner substitutions are on until you confirm.")
  }

  const equipmentText = `${intake?.equipment ?? ""} ${intake?.equipmentDetails ?? ""}`
  if (/\bbands?\b|resistance band/i.test(equipmentText)) {
    options.bands = true
    reasons.bands = "Intake mentions bands"
  } else {
    reasons.bands = "Bands not mentioned at intake, so the bodyweight sequence is used"
  }
  if (/foam roller/i.test(equipmentText)) {
    options.foamRoller = true
    reasons.foamRoller = "Intake mentions a foam roller"
  }

  const injuries = intake?.injuries ?? ""
  if (injuries && !NONE_WORDS.test(injuries) && BACK_WORDS.test(injuries)) {
    options.backSafe = false
    reasons.backSafe = "Intake mentions the back, so Figure 4 replaces Pigeon until you confirm"
    flags.push("Intake mentions a back issue: please confirm whether Pigeon Pose is appropriate.")
  } else if (injuries && !NONE_WORDS.test(injuries)) {
    flags.push("Intake lists an injury or limitation: review the sequence for this client.")
  }
  return { options, reasons, flags }
}

export function effectiveOptions(profile: WarmupProfile | null, suggestion: ProfileSuggestion): WarmupOptions {
  const o = { ...suggestion.options }
  if (!profile) return o
  for (const k of ["beginner", "bands", "backSafe", "foamRoller"] as const) {
    if (typeof profile[k] === "boolean") o[k] = profile[k] as boolean
  }
  return o
}
