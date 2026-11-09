"use client"

import { useId, useState } from "react"
import { Icon } from "@/components/coaching/admin/AdminUi"
import { entryLabel, isRecovered, kcal, macroLine, plural, shortDate } from "./format"
import type { DayInfo } from "./types"

export function DayRow({ day, todayKey, yesterdayKey }: { day: DayInfo; todayKey: string; yesterdayKey: string }) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const { totals, entries } = day
  const name = totals.date === todayKey ? "Today" : totals.date === yesterdayKey ? "Yesterday" : shortDate(totals.date)

  if (!totals.logged) {
    return (
      <div className="can-day-btn" style={{ cursor: "default" }}>
        <span className="can-day-main"><b>{name}</b><span>Nothing logged</span></span>
      </div>
    )
  }

  const protein = totals.known.protein ? `${Math.round(totals.protein)} g protein` : "protein not logged"
  return (
    <>
      <button type="button" className="can-day-btn" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((v) => !v)}>
        <span className="can-day-main">
          <b>{name}</b>
          <span className="can-num">{kcal(totals.calories)} kcal · {protein}</span>
        </span>
        <span className="can-day-aside">
          {day.hasRecovered && <span className="can-tag">From Messages</span>}
          <span>{plural(entries.length, "entry", "entries")}</span>
          <Icon name="chevron" size={16} />
        </span>
      </button>
      {open && (
        <ul id={panelId} className="can-entries">
          {entries.map((e) => (
            <li key={e.id} className="can-entry">
              <div className="can-entry-top">
                <b>{entryLabel(e)}</b>
                <span className="can-num">{kcal(e.calories)} kcal</span>
                {isRecovered(e) && <span className="can-tag">Estimate from Messages</span>}
              </div>
              {e.description && <p>{e.description}</p>}
              <p className="can-num">{macroLine(e)}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
