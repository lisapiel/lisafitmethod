import { kcal, plural, shortDate } from "./format"
import type { DayInfo } from "./types"

export const MIN_DAYS_FOR_FACTS = 5

// Plain counts and sums only. Nothing here judges or suggests.
export function chartFacts(days: DayInfo[]): string[] {
  const logged = days.filter((d) => d.totals.logged)
  if (logged.length < MIN_DAYS_FOR_FACTS) return []
  const facts: string[] = []

  const top = logged.reduce((a, b) => (b.totals.calories > a.totals.calories ? b : a))
  const t = top.totals.target?.calories
  const diff = t ? top.totals.calories - t : null
  let line = `Highest day: ${shortDate(top.totals.date)}, ${kcal(top.totals.calories)} kcal`
  if (diff != null && diff > 0) line += `, ${kcal(diff)} above target`
  else if (diff != null && diff < 0) line += `, ${kcal(-diff)} below target`
  else if (diff === 0) line += ", on target"
  facts.push(`${line}.`)

  const total = logged.reduce((a, d) => a + d.totals.calories, 0)
  const snacks = logged.reduce((a, d) => a + d.snackCalories, 0)
  if (total > 0 && snacks > 0) {
    facts.push(`Entries labelled Snack were ${Math.round((snacks / total) * 100)}% of logged calories.`)
  }

  const withProtein = logged.filter((d) => d.totals.known.protein && d.totals.target && d.totals.target.protein > 0)
  if (withProtein.length > 0) {
    const under = withProtein.filter((d) => d.totals.protein < d.totals.target!.protein * 0.95).length
    facts.push(`Protein was under target on ${under} of ${plural(withProtein.length, "day")} with protein logged.`)
  }

  const recovered = logged.filter((d) => d.hasRecovered).length
  if (recovered > 0) facts.push(`${plural(recovered, "day")} ${recovered === 1 ? "includes" : "include"} an estimate recovered from Messages.`)

  return facts
}
