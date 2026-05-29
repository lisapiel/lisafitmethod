"use client"

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div style={{ background: "#0a0a0a", minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ maxWidth: 480, textAlign: "center" }}>
        <h2 style={{ color: "#c9a96e", marginBottom: "1rem", fontFamily: "var(--font-cormorant), serif", fontSize: "2rem", fontWeight: 600 }}>Something went wrong</h2>
        <p style={{ color: "#888", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.875rem", marginBottom: "1.5rem", lineHeight: 1.6 }}>
          {error?.message || "An unexpected error occurred. Please try again."}
        </p>
        <button
          onClick={reset}
          style={{ background: "#c9a96e", color: "#0a0a0a", border: "none", padding: "0.75rem 2rem", cursor: "pointer", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase" }}
        >
          Try again
        </button>
      </div>
    </div>
  )
}
