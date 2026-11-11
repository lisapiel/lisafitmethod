"use client"

import { useEffect, useRef } from "react"
import type { WeightGuide } from "@/lib/weightGuide"
import "./exercise-card.css"

const RPE_ROWS: Array<[string, string]> = [
  ["10", "No clean reps left"],
  ["9", "About 1 rep left"],
  ["8", "About 2 reps left"],
  ["7", "About 3 reps left"],
  ["5–6", "4 to 5 reps left"],
  ["1–4", "Easy, warm-up effort"],
]

export type HelpTopic = { kind: "rpe" } | { kind: "weight"; guide: WeightGuide }

export function HelpSheet({ topic, onClose }: { topic: HelpTopic; onClose: () => void }) {
  const okRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    okRef.current?.focus()
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", onKey)
    return () => { document.removeEventListener("keydown", onKey); opener?.focus?.() }
  }, [onClose])

  const title = topic.kind === "rpe" ? "How hard the set felt" : topic.guide.title
  return (
    <div className="xc-scrim" onClick={onClose}>
      <div className="xc-sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="xc-grab" aria-hidden="true" />
        {topic.kind === "rpe" ? (
          <>
            <p className="xc-k">What is RPE?</p>
            <h2>{title}</h2>
            <p>Count the clean reps you had left when you stopped. It tells me whether the weight is right and when you&apos;re ready for more.</p>
            <div className="xc-rpe">
              {RPE_ROWS.map(([n, d]) => <div key={n}><b>{n}</b><span>{d}</span></div>)}
            </div>
          </>
        ) : (
          <>
            <p className="xc-k">{topic.guide.eyebrow}</p>
            <h2>{title}</h2>
            {topic.guide.body.length > 2
              ? <ul>{topic.guide.body.map((b) => <li key={b}>{b}</li>)}</ul>
              : topic.guide.body.map((b) => <p key={b}>{b}</p>)}
            {topic.guide.examples.map((e) => <p key={e} className="xc-eg">{e}</p>)}
          </>
        )}
        <button ref={okRef} type="button" className="xc-ok" onClick={onClose}>Got it</button>
      </div>
    </div>
  )
}
