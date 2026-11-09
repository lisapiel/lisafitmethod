import { kcal, shortDate, weekday } from "./format"
import type { DayInfo, DayState } from "./types"

const STATE_TEXT: Record<DayState, string> = {
  logged: "logged",
  recovered: "includes an estimate from Messages",
  partial: "logged, some macros missing",
  empty: "nothing logged",
}

export function WeekStrip({ days, todayKey }: { days: DayInfo[]; todayKey: string }) {
  const logged = days.filter((d) => d.totals.logged).length
  const recovered = days.filter((d) => d.state === "recovered").length
  const partial = days.filter((d) => d.state === "partial").length
  const nothing = days.filter((d) => !d.totals.logged && d.totals.date !== todayKey).length
  const todayEmpty = days.some((d) => d.totals.date === todayKey && !d.totals.logged)

  const parts = [`${logged} logged`]
  if (recovered > 0) parts.push(`${recovered} from Messages`)
  if (partial > 0) parts.push(`${partial} with some macros missing`)
  parts.push(`${nothing} with nothing`)

  return (
    <div>
      <ol className="can-strip" aria-label="Last 7 days">
        {days.map((d) => {
          const today = d.totals.date === todayKey
          const desc = `${today ? "Today" : shortDate(d.totals.date)}: ${STATE_TEXT[d.state]}${d.totals.logged ? `, ${kcal(d.totals.calories)} kcal` : ""}`
          return (
            <li key={d.totals.date} {...(today ? { "data-today": "" } : {})}>
              <span className="can-sq" data-state={d.state} aria-hidden="true" />
              <span aria-hidden="true">{today ? "Today" : weekday(d.totals.date)}</span>
              <span className="ca-sr">{desc}</span>
            </li>
          )
        })}
      </ol>
      <p className="can-text" style={{ margin: "10px 0 0" }}>
        {parts.join(" · ")}{todayEmpty ? " · nothing yet today" : ""}
      </p>
      <ul className="can-legend" aria-label="Key">
        <li><span className="can-sq" data-state="logged" aria-hidden="true" />Logged</li>
        <li><span className="can-sq" data-state="recovered" aria-hidden="true" />From Messages</li>
        <li><span className="can-sq" data-state="partial" aria-hidden="true" />Some macros missing</li>
        <li><span className="can-sq" data-state="empty" aria-hidden="true" />Nothing</li>
      </ul>
    </div>
  )
}
