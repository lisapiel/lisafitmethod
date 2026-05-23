"use client"
import { useState } from "react"

export default function VideoPlayer({
  src,
  style,
}: {
  src: string
  style?: React.CSSProperties
}) {
  const [controls, setControls] = useState(false)
  return (
    <video
      src={src}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      controls={controls}
      onClick={() => setControls(c => !c)}
      style={{ ...style, cursor: "pointer" }}
    />
  )
}
