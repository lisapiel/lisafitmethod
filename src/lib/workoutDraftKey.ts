export function workoutDraftKey(programId: string, weekNumber: number, dayIndex: number): string {
  return `lfm-workout-draft-${programId}-${weekNumber}-${dayIndex}`
}

export function legacyWorkoutDraftKey(weekNumber: number, dayIndex: number): string {
  return `lfm-workout-draft-${weekNumber}-${dayIndex}`
}
