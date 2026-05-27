import { ImageResponse } from "next/og"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: "#0a0a0a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 148,
            height: 148,
            background: "#111111",
            borderRadius: 22,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ color: "#c9a96e", fontSize: 42, letterSpacing: 6, display: "flex" }}>
            LFM
          </div>
          <div style={{ color: "#555555", fontSize: 10, letterSpacing: 5, marginTop: 8, display: "flex" }}>
            TRACKER
          </div>
        </div>
      </div>
    ),
    { width: 180, height: 180 }
  )
}
