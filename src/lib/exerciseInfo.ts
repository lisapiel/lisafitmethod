import type { ExerciseRecord } from "./authTokens"

// The exercise fields a client may see (no admin-only notes).
export type ClientExerciseInfo = {
  name: string
  videoS3Key: string
  primaryMuscle: string | null
  secondaryMuscles: string[]
  equipment: string[]
  difficulty: string | null
  execution: string | null
  coachingCues: string[]
  commonMistakes: string[]
  category: string | null
  thumbnailS3Key: string | null
}

const parseArr = (s?: string): string[] => {
  if (!s) return []
  try { const p = JSON.parse(s); return Array.isArray(p) ? p : [] } catch { return [] }
}

export function toClientExerciseInfo(ex: ExerciseRecord): ClientExerciseInfo {
  return {
    name: ex.name,
    videoS3Key: ex.videoS3Key ?? "",
    primaryMuscle: ex.primaryMuscle ?? null,
    secondaryMuscles: parseArr(ex.secondaryMuscles),
    equipment: parseArr(ex.equipment),
    difficulty: ex.difficulty ?? null,
    execution: ex.execution ?? null,
    coachingCues: parseArr(ex.coachingCues),
    commonMistakes: parseArr(ex.commonMistakes),
    category: ex.category ?? null,
    thumbnailS3Key: ex.thumbnailS3Key ?? null,
  }
}
