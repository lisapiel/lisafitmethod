export default function NutritionDisclaimer() {
  return (
    <div style={{
      background: "#111",
      border: "1px solid #2a2a2a",
      borderLeft: "3px solid #444",
      padding: "0.875rem 1.25rem",
      marginBottom: "2rem",
    }}>
      <p style={{
        fontSize: "0.6rem",
        fontWeight: 600,
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        color: "#555",
        marginBottom: "0.35rem",
        fontFamily: "var(--font-montserrat), sans-serif",
      }}>
        Scope of practice
      </p>
      <p style={{
        fontSize: "0.75rem",
        color: "#666",
        lineHeight: 1.6,
        margin: 0,
        fontFamily: "var(--font-montserrat), sans-serif",
      }}>
        Lisa McPherson is a Certified Personal Trainer (CPT), not a Registered Dietitian or licensed medical professional. This content provides general nutrition education for fitness and performance goals — not medical nutrition therapy. Consult a licensed healthcare provider or Registered Dietitian for medical conditions, medications, or eating disorder history. Individual results vary.
      </p>
    </div>
  )
}
