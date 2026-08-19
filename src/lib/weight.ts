// Shared body-weight helpers. Every UI that compares check-in weights across
// entries must go through toLbs() first — clients can switch between LBS and
// KG between check-ins and raw subtraction across mixed units produces
// nonsense trends (e.g. 60 kg → 132 lb should read as no meaningful change,
// not +72). The canonical internal unit is pounds; individual entries stay
// stored in whatever unit the client submitted them in.

export type WeightUnit = "LBS" | "KG"

const LB_PER_KG = 2.20462

// Accept both casings ("LBS" / "lbs" / "KG" / "kg") plus common misspellings.
// Anything unrecognized defaults to LBS to match the historical default in the
// check-in form and the coaching client record.
export function normalizeUnit(unit?: string | null): WeightUnit {
  const u = (unit ?? "").toUpperCase().trim()
  if (u === "KG" || u === "KGS" || u === "KILOGRAM" || u === "KILOGRAMS") return "KG"
  return "LBS"
}

// Convert any (value, unit) pair to pounds. Returns null if the value isn't
// a positive finite number so callers can safely skip it in aggregates.
export function toLbs(value: number | string | null | undefined, unit?: string | null): number | null {
  const n = typeof value === "number" ? value : parseFloat(String(value ?? ""))
  if (!Number.isFinite(n) || n <= 0) return null
  return normalizeUnit(unit) === "KG" ? n * LB_PER_KG : n
}

// Convert pounds → target unit for display.
export function fromLbs(lbs: number, unit: WeightUnit): number {
  return unit === "KG" ? lbs / LB_PER_KG : lbs
}

// Format a canonical-lb value for display in the client's preferred unit.
// One-decimal precision — bodyweight rarely needs more.
export function formatWeight(lbs: number, displayUnit: WeightUnit): string {
  const v = fromLbs(lbs, displayUnit)
  return `${v.toFixed(1)}`
}

// Relative change between two weights (used by the typo-confirmation guard).
// Returns |latest − previous| / previous. Compares in the same canonical unit.
// Returns null if either input can't be normalized.
export function relativeChange(
  previous: { value: number | string; unit?: string | null },
  latest: { value: number | string; unit?: string | null },
): number | null {
  const p = toLbs(previous.value, previous.unit)
  const l = toLbs(latest.value, latest.unit)
  if (p == null || l == null || p === 0) return null
  return Math.abs(l - p) / p
}
