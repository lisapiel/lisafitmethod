import type { NutritionLogRecord } from "@/lib/authTokens"
import type { Macros } from "./types"

export function kcal(n: number): string {
  return Math.round(n).toLocaleString("en-US")
}

export function keyToDate(key: string): Date {
  const [y, m, d] = key.slice(0, 10).split("-").map(Number)
  return new Date(y, m - 1, d)
}

export function weekday(key: string): string {
  return keyToDate(key).toLocaleDateString("en-US", { weekday: "short" })
}

export function shortDate(key: string): string {
  return keyToDate(key).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
}

export function dateTime(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export function weighInDay(at: string): string {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(at) ? keyToDate(at) : new Date(at)
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`
}

export function isRecovered(l: NutritionLogRecord): boolean {
  return l.source === "message-estimate"
}

export function entryLabel(l: NutritionLogRecord): string {
  if (l.isDaySummary) return "Daily summary"
  if (l.mealType) return l.mealType.charAt(0).toUpperCase() + l.mealType.slice(1)
  return "Entry"
}

export function macroLine(m: { protein?: number; carbs?: number; fat?: number }): string {
  const parts: string[] = []
  if (typeof m.protein === "number") parts.push(`P ${Math.round(m.protein)} g`)
  if (typeof m.carbs === "number") parts.push(`C ${Math.round(m.carbs)} g`)
  if (typeof m.fat === "number") parts.push(`F ${Math.round(m.fat)} g`)
  return parts.length ? parts.join(" · ") : "macros not logged"
}

export function targetLine(m: Macros): string {
  return `${kcal(m.calories)} kcal · P ${m.protein} · C ${m.carbs} · F ${m.fat}`
}
