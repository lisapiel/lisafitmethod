"use client"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body style={{ background: "#0a0a0a", color: "#f0e6d3", fontFamily: "monospace", padding: "2rem" }}>
        <h2 style={{ color: "#c9a96e", marginBottom: "1rem" }}>Something went wrong</h2>
        <pre style={{ background: "#161616", padding: "1rem", overflowX: "auto", fontSize: "0.8rem", color: "#e07070", marginBottom: "1rem", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
          {error?.message || "Unknown error"}
          {"\n\n"}
          {error?.stack || ""}
        </pre>
        <button
          onClick={reset}
          style={{ background: "#c9a96e", color: "#0a0a0a", border: "none", padding: "0.5rem 1.5rem", cursor: "pointer" }}
        >
          Try again
        </button>
      </body>
    </html>
  )
}
