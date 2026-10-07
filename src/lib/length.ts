// Shared body-measurement unit helpers. Mirrors the shape of src/lib/weight.ts
// (toLbs/fromLbs/normalizeUnit) so measurement analytics never grow their own
// one-off conversion math.
//
// A client's measurement history can mix "in" and "cm" if they switched the
// per-row unit selector between check-ins. For analytics we must normalize to
// a single canonical unit before subtracting, otherwise 38 in → 94 cm reads
// as "+56" when the real change is roughly −2.5 cm. Historical records are
// never rewritten — this helper only canonicalizes at compute time.

export type LengthUnit = "in" | "cm"

const CM_PER_IN = 2.54

// Strict parse: returns a known unit or `null` for anything missing /
// unknown / incompatible. Use this when the caller must drop a reading
// rather than guess (analytics). Historical records that pre-date the
// per-row unit toggle may well have no `unit` field at all — in that case
// we exclude the comparison instead of silently assuming inches.
export function parseLengthUnit(unit?: string | null): LengthUnit | null {
  if (unit == null) return null
  const u = String(unit).toLowerCase().trim()
  if (u === "") return null
  if (u === "cm" || u === "cms" || u === "centimeter" || u === "centimeters") return "cm"
  if (u === "in" || u === "ins" || u === "inch" || u === "inches" || u === '"') return "in"
  return null
}

// Lenient fallback — used by UI code (setup form, check-in form) where
// the user-visible selector defaults to inches anyway. NEVER call this
// from analytics; use `parseLengthUnit` and drop the reading on null.
export function normalizeLengthUnit(unit?: string | null): LengthUnit {
  return parseLengthUnit(unit) ?? "in"
}

// Convert a (value, unit) pair to centimetres. Returns null when the value
// isn't a positive finite number OR when the unit cannot be parsed, so
// analytics callers can safely skip the reading in aggregates.
export function toCm(value: number | string | null | undefined, unit?: string | null): number | null {
  const n = typeof value === "number" ? value : parseFloat(String(value ?? ""))
  if (!Number.isFinite(n) || n <= 0) return null
  const parsed = parseLengthUnit(unit)
  if (parsed == null) return null
  return parsed === "cm" ? n : n * CM_PER_IN
}

// Convert centimetres → target unit for display.
export function fromCm(cm: number, unit: LengthUnit): number {
  return unit === "cm" ? cm : cm / CM_PER_IN
}
