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

// Accept common unit spellings. Defaults to "in" because the UI's
// measurement rows default to inches and most legacy snapshots are in
// inches too.
export function normalizeLengthUnit(unit?: string | null): LengthUnit {
  const u = (unit ?? "").toLowerCase().trim()
  if (u === "cm" || u === "cms" || u === "centimeter" || u === "centimeters") return "cm"
  return "in"
}

// Convert any (value, unit) pair to centimetres. Returns null if the value
// isn't a positive finite number so callers can safely skip it in aggregates.
export function toCm(value: number | string | null | undefined, unit?: string | null): number | null {
  const n = typeof value === "number" ? value : parseFloat(String(value ?? ""))
  if (!Number.isFinite(n) || n <= 0) return null
  return normalizeLengthUnit(unit) === "cm" ? n : n * CM_PER_IN
}

// Convert centimetres → target unit for display.
export function fromCm(cm: number, unit: LengthUnit): number {
  return unit === "cm" ? cm : cm / CM_PER_IN
}
