import { ImageResponse } from "next/og"
import { readFileSync } from "fs"
import { join } from "path"

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function Image() {
  const imgBuffer = readFileSync(join(process.cwd(), "public/hero.png"))
  const imgSrc = `data:image/jpeg;base64,${imgBuffer.toString("base64")}`

  const scaledW = Math.round((2172 / 724) * 630)
  const offsetX = -Math.round((scaledW - 1200) * 0.65)

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          background: "#0a0a0a",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <img
          src={imgSrc}
          alt=""
          style={{
            position: "absolute",
            width: scaledW,
            height: 630,
            left: offsetX,
            top: 0,
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(100deg, rgba(10,10,10,0.92) 38%, rgba(10,10,10,0.45) 70%, rgba(10,10,10,0.15) 100%)",
            display: "flex",
          }}
        />

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 80px",
            height: "100%",
            maxWidth: 660,
          }}
        >
          <p
            style={{
              color: "#c8a97e",
              fontSize: 17,
              fontWeight: 600,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              margin: "0 0 18px",
            }}
          >
            Lisa Fit Method
          </p>
          <h1
            style={{
              color: "#ffffff",
              fontSize: 62,
              fontWeight: 900,
              lineHeight: 1.08,
              margin: "0 0 28px",
            }}
          >
            Train the Right Way
          </h1>
          <p
            style={{
              color: "rgba(240,230,211,0.5)",
              fontSize: 20,
              margin: 0,
              letterSpacing: "0.06em",
            }}
          >
            lisafitmethod.com
          </p>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
