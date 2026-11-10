import { normalizeTotpCode } from "@/lib/totp"

export function TotpCodeInput({
  id,
  value,
  onChange,
  style,
  autoFocus = true,
}: {
  id: string
  value: string
  onChange: (code: string) => void
  style: React.CSSProperties
  autoFocus?: boolean
}) {
  return (
    <input
      id={id}
      name="totp-code"
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="[0-9]{6}"
      maxLength={7}
      required
      autoFocus={autoFocus}
      value={value}
      onChange={(e) => onChange(normalizeTotpCode(e.target.value))}
      style={{ ...style, letterSpacing: "0.3em", fontVariantNumeric: "tabular-nums" }}
    />
  )
}
