// Robust client-local date utilities.
//
// Nutrition logs (and anywhere else we need "what day was this?") store a
// plain YYYY-MM-DD in the client's own timezone, plus the IANA timezone
// identifier that produced it. This lets late-night logs, travel across
// time zones, and server-side aggregation all agree on which calendar day
// an entry belongs to without depending on a server clock or browser locale
// defaults.
//
// Rules:
//   - Dates are formatted using Intl.DateTimeFormat with the "en-CA" locale,
//     which pins the output to the ISO-ish YYYY-MM-DD regardless of the
//     user's browser locale (en-US would produce MM/DD/YYYY).
//   - When no timezone is provided we use Intl.DateTimeFormat().resolvedOptions().timeZone
//     — the browser's own IANA zone — on the client, and a safe fallback on
//     the server (where this helper is rarely used — server trusts the
//     client's submitted `date` field).

export type LocalDateKey = string // YYYY-MM-DD

export function resolveTimeZone(explicit?: string): string {
  if (explicit) return explicit
  if (typeof Intl !== "undefined" && typeof Intl.DateTimeFormat === "function") {
    try {
      const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone
      if (resolved) return resolved
    } catch {}
  }
  return "UTC"
}

export function localDateKey(input: Date | string = new Date(), timeZone?: string): LocalDateKey {
  const d = typeof input === "string" ? new Date(input) : input
  const tz = resolveTimeZone(timeZone)
  // en-CA formats as YYYY-MM-DD. Explicitly request numeric year/month/day
  // (2-digit for month/day) to avoid locale subtlety.
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" })
  const parts = fmt.formatToParts(d)
  const year = parts.find((p) => p.type === "year")?.value ?? "1970"
  const month = parts.find((p) => p.type === "month")?.value ?? "01"
  const day = parts.find((p) => p.type === "day")?.value ?? "01"
  return `${year}-${month}-${day}`
}

export function isLocalDateKey(s: unknown): s is LocalDateKey {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s)
}

// Add N days to a YYYY-MM-DD key (positive or negative), returning a new key.
// Pure string math — safe to use with any timezone, no DST surprises.
export function addDaysToKey(key: LocalDateKey, days: number): LocalDateKey {
  const [y, m, d] = key.split("-").map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  date.setUTCDate(date.getUTCDate() + days)
  const yy = date.getUTCFullYear()
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0")
  const dd = String(date.getUTCDate()).padStart(2, "0")
  return `${yy}-${mm}-${dd}`
}

// Count whole days between two keys (b - a). Positive if b is later.
export function daysBetweenKeys(a: LocalDateKey, b: LocalDateKey): number {
  const [ay, am, ad] = a.split("-").map(Number)
  const [by, bm, bd] = b.split("-").map(Number)
  const ad0 = Date.UTC(ay, am - 1, ad)
  const bd0 = Date.UTC(by, bm - 1, bd)
  return Math.round((bd0 - ad0) / (1000 * 60 * 60 * 24))
}

// Build a contiguous array of keys covering [from, to] inclusive.
export function keyRange(from: LocalDateKey, to: LocalDateKey): LocalDateKey[] {
  const span = daysBetweenKeys(from, to)
  if (span < 0) return []
  return Array.from({ length: span + 1 }, (_, i) => addDaysToKey(from, i))
}
