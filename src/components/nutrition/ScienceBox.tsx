const gold = "#c9a96e"
const goldDeep = "#a8895e"

export default function ScienceBox({ study, finding, cite }: { study: string; finding: string; cite: string }) {
  return (
    <div style={{
      background: "#111",
      borderLeft: `2px solid ${gold}`,
      padding: "0.875rem 1.2rem",
      marginTop: "1rem",
    }}>
      <p style={{
        fontSize: "0.55rem",
        textTransform: "uppercase",
        letterSpacing: "0.2em",
        color: goldDeep,
        fontWeight: 600,
        marginBottom: "0.4rem",
        fontFamily: "var(--font-montserrat), sans-serif",
      }}>
        The Research
      </p>
      <p style={{
        fontSize: "0.8rem",
        color: "#c9bfb0",
        lineHeight: 1.62,
        margin: "0 0 0.4rem",
        fontFamily: "var(--font-montserrat), sans-serif",
      }}>
        <strong style={{ color: "#f0e6d3" }}>{study}:</strong> {finding}
      </p>
      <p style={{
        fontSize: "0.68rem",
        color: "#555",
        margin: 0,
        fontFamily: "var(--font-montserrat), sans-serif",
        fontStyle: "italic",
        lineHeight: 1.5,
      }}>
        {cite}
      </p>
    </div>
  )
}
