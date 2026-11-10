export const gold = "#c9a96e"
export const border = "#2a2a2a"
export const cream = "#f0e6d3"
export const muted = "#888888"

export const cardStyle: React.CSSProperties = {
  background: "#111111",
  border: `1px solid ${border}`,
  padding: "1.75rem",
  marginBottom: "1.5rem",
}

export const headingStyle: React.CSSProperties = {
  fontFamily: "var(--font-cormorant), serif",
  fontSize: "1.4rem",
  fontWeight: 400,
  color: cream,
  margin: "0 0 0.75rem",
}

export const bodyStyle: React.CSSProperties = {
  fontFamily: "var(--font-montserrat), sans-serif",
  fontSize: "0.85rem",
  lineHeight: 1.7,
  color: "#cfc6b6",
  margin: "0 0 1rem",
}

export const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-montserrat), sans-serif",
  fontSize: "0.6rem",
  letterSpacing: "0.15em",
  textTransform: "uppercase",
  color: muted,
  marginBottom: "0.5rem",
}

export const inputStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 320,
  background: "#0a0a0a",
  border: `1px solid ${border}`,
  color: cream,
  fontFamily: "var(--font-montserrat), sans-serif",
  fontSize: "0.95rem",
  padding: "0.75rem 1rem",
  outline: "none",
  boxSizing: "border-box",
  marginBottom: "1rem",
  display: "block",
}

export function buttonStyle(busy: boolean, tone: "primary" | "quiet" = "primary"): React.CSSProperties {
  return {
    background: tone === "primary" ? (busy ? "#555" : gold) : "none",
    color: tone === "primary" ? "#0a0a0a" : muted,
    border: tone === "primary" ? "none" : `1px solid ${border}`,
    fontFamily: "var(--font-montserrat), sans-serif",
    fontSize: "0.7rem",
    fontWeight: 600,
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    padding: "0.9rem 1.5rem",
    cursor: busy ? "not-allowed" : "pointer",
  }
}

export const errorStyle: React.CSSProperties = {
  fontFamily: "var(--font-montserrat), sans-serif",
  fontSize: "0.8rem",
  color: "#e07070",
  margin: "0 0 1rem",
}
