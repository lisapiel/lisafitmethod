"use client"

const gold = "#c9a96e"

interface UploadProgressProps {
  progress: number
  label?: string
}

export default function UploadProgress({ progress, label = "Uploading…" }: UploadProgressProps) {
  return (
    <div style={{ marginTop: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
        <span style={{ fontSize: "0.7rem", color: "#888", fontFamily: "var(--font-montserrat), sans-serif", letterSpacing: "0.1em" }}>
          {label}
        </span>
        <span style={{ fontSize: "0.7rem", color: gold, fontFamily: "var(--font-montserrat), sans-serif" }}>
          {Math.round(progress)}%
        </span>
      </div>
      <div style={{ background: "#2a2a2a", height: 2, width: "100%" }}>
        <div
          style={{
            height: "100%",
            background: gold,
            width: `${progress}%`,
            transition: "width 0.2s ease",
          }}
        />
      </div>
    </div>
  )
}
