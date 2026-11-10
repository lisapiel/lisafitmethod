import { activityLabel, GOAL_META } from "@/lib/nutrition"
import type { ProfileValues } from "@/lib/profileRequests"

export function goalText(v: ProfileValues["nutritionGoal"]): string {
  return v ? GOAL_META[v]?.label ?? v : "Not set"
}

export function activityText(v: number | undefined | null): string {
  return v == null ? "Not set" : activityLabel(v) ?? String(v)
}

export function requestedSummary(r: ProfileValues): string {
  const parts: string[] = []
  if (r.nutritionGoal) parts.push(`goal to ${goalText(r.nutritionGoal)}`)
  if (r.activityLevel != null) parts.push(`activity to ${activityText(r.activityLevel)}`)
  return parts.join(" and ")
}
