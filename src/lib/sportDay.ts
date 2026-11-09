export type SportIntensity = "easy" | "moderate" | "hard"

export type SportLogFields = { dayType?: "sport"; sportName?: string; sportDurationMinutes?: number; sportIntensity?: SportIntensity }

export function sportSummary(s: { name?: string; durationMinutes?: number; intensity?: SportIntensity }) {
  return [
    s.name,
    s.durationMinutes != null ? `${s.durationMinutes} min` : null,
    s.intensity ? `${s.intensity[0].toUpperCase()}${s.intensity.slice(1)}` : null,
  ].filter(Boolean).join(" · ")
}

export function sportLogSummary(log: SportLogFields) {
  if (log.dayType !== "sport") return null
  return sportSummary({ name: log.sportName, durationMinutes: log.sportDurationMinutes, intensity: log.sportIntensity }) || "Sport day"
}
