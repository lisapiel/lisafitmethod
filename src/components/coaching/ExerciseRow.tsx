"use client"

const border = "#2a2a2a"
const gold = "#c9a96e"

export type ProgramExercise = {
  exerciseId: string
  name: string
  videoS3Key: string
  sets: string
  reps: string
  weight: string
  rpe: string
  rest: string
  tempo: string
  coachNotes: string
  metric?: "reps" | "time"
}

const CDN = process.env.NEXT_PUBLIC_AMBRISA_CDN_URL ?? ""
function cdnThumb(key: string | null | undefined) {
  if (!key) return ""
  return `${CDN}/${encodeURIComponent(key.replace(/\.mp4$/i, ".jpg"))}`
}

function SmallInput({ value, onChange, placeholder, width }: { value: string; onChange: (v: string) => void; placeholder?: string; width?: number | string }) {
  return (
    <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      style={{ background: "#0a0a0a", border: `1px solid ${border}`, color: "#f0e6d3", padding: "5px 8px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", outline: "none", width: width ?? 64, boxSizing: "border-box" }}
    />
  )
}

export default function ExerciseRow({ ex, onUpdate, onRemove, onReplace, onMoveUp, onMoveDown, canMoveUp, canMoveDown }: {
  ex: ProgramExercise
  onUpdate: (updated: ProgramExercise) => void
  onRemove: () => void
  onReplace?: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  canMoveUp?: boolean
  canMoveDown?: boolean
}) {
  const set = (key: keyof ProgramExercise) => (val: string) => onUpdate({ ...ex, [key]: val })

  return (
    <div style={{ background: "#0f0f0f", border: `1px solid ${border}`, padding: "12px 14px", marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        {/* Reorder controls */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2, flexShrink: 0 }}>
          <button onClick={onMoveUp} disabled={!canMoveUp} style={{ background: "none", border: "none", color: canMoveUp ? "#888" : "#333", cursor: canMoveUp ? "pointer" : "not-allowed", padding: "0 4px", fontSize: "0.7rem", lineHeight: 1 }}>▲</button>
          <button onClick={onMoveDown} disabled={!canMoveDown} style={{ background: "none", border: "none", color: canMoveDown ? "#888" : "#333", cursor: canMoveDown ? "pointer" : "not-allowed", padding: "0 4px", fontSize: "0.7rem", lineHeight: 1 }}>▼</button>
        </div>

        <div style={{ width: 36, height: 36, flexShrink: 0 }}>
          {ex.videoS3Key && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cdnThumb(ex.videoS3Key)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          )}
        </div>
        <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#f0e6d3", flex: 1 }}>{ex.name}</span>

        {onReplace && (
          <button onClick={onReplace} style={{ background: "none", border: `1px solid ${border}`, color: gold, cursor: "pointer", padding: "4px 10px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Replace
          </button>
        )}
        <button onClick={onRemove} style={{ background: "none", border: "none", color: "#444", cursor: "pointer", padding: "4px 8px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.8rem", lineHeight: 1 }}>×</button>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <div>
          <div style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", color: "#555", marginBottom: 3, letterSpacing: "0.08em", textTransform: "uppercase" }}>Sets</div>
          <SmallInput value={ex.sets} onChange={set("sets")} placeholder="3" width={52} />
        </div>
        <div>
          <div style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", color: "#555", marginBottom: 3, letterSpacing: "0.08em", textTransform: "uppercase" }}>Reps</div>
          <SmallInput value={ex.reps} onChange={set("reps")} placeholder="10-12" width={72} />
        </div>
        <div>
          <div style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", color: "#555", marginBottom: 3, letterSpacing: "0.08em", textTransform: "uppercase" }}>Weight</div>
          <SmallInput value={ex.weight} onChange={set("weight")} placeholder="e.g. 20kg" width={80} />
        </div>
        <div>
          <div style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", color: "#555", marginBottom: 3, letterSpacing: "0.08em", textTransform: "uppercase" }}>RPE</div>
          <SmallInput value={ex.rpe} onChange={set("rpe")} placeholder="7-8" width={52} />
        </div>
        <div>
          <div style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", color: "#555", marginBottom: 3, letterSpacing: "0.08em", textTransform: "uppercase" }}>Rest</div>
          <SmallInput value={ex.rest} onChange={set("rest")} placeholder="60s" width={60} />
        </div>
        <div>
          <div style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", color: "#555", marginBottom: 3, letterSpacing: "0.08em", textTransform: "uppercase" }}>Tempo</div>
          <SmallInput value={ex.tempo} onChange={set("tempo")} placeholder="3-1-1" width={64} />
        </div>
        <div style={{ flex: "1 1 200px", minWidth: 140 }}>
          <div style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", color: "#555", marginBottom: 3, letterSpacing: "0.08em", textTransform: "uppercase" }}>Coach Notes</div>
          <input type="text" value={ex.coachNotes} onChange={(e) => set("coachNotes")(e.target.value)} placeholder="Any notes…"
            style={{ width: "100%", background: "#0a0a0a", border: `1px solid ${border}`, color: "#f0e6d3", padding: "5px 8px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", outline: "none", boxSizing: "border-box" }} />
        </div>
      </div>
    </div>
  )
}

export function emptyExercise(ex: { id: string; name: string; videoS3Key: string | null }): ProgramExercise {
  return { exerciseId: ex.id, name: ex.name, videoS3Key: ex.videoS3Key ?? "", sets: "3", reps: "10-12", weight: "", rpe: "", rest: "60s", tempo: "", coachNotes: "" }
}
