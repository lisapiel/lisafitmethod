"use client"

import { useEffect, useState } from "react"
import { signedReadUrl, type MediaViewer } from "@/lib/mediaUpload.client"

const muted = "#6b6560"

function useSignedUrl(viewer: MediaViewer, s3Key: string): { url: string | null; error: boolean } {
  const [state, setState] = useState<{ key: string; url: string | null; error: boolean }>({ key: s3Key, url: null, error: false })

  useEffect(() => {
    let cancelled = false
    setState({ key: s3Key, url: null, error: false })
    signedReadUrl(viewer, s3Key).then((url) => {
      if (!cancelled) setState({ key: s3Key, url, error: url == null })
    })
    return () => { cancelled = true }
  }, [viewer, s3Key])

  return state.key === s3Key ? state : { url: null, error: false }
}

// Private client uploads are never public. The server checks who is asking
// (the coach, or the client who sent the file) and returns a short-lived URL.
export function SignedVideo({
  s3Key,
  viewer,
  style,
  controls = true,
}: {
  s3Key: string
  viewer: MediaViewer
  style?: React.CSSProperties
  controls?: boolean
}) {
  const { url, error } = useSignedUrl(viewer, s3Key)
  if (error) {
    return (
      <div style={{ ...style, background: "#111", color: muted, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.7rem", padding: 12 }}>
        Couldn&apos;t load video
      </div>
    )
  }
  if (!url) return <div style={{ ...style, background: "#111" }} />
  return <video src={url} controls={controls} playsInline preload="metadata" style={style} />
}

export function SignedImage({
  s3Key,
  viewer,
  alt = "",
  style,
}: {
  s3Key: string
  viewer: MediaViewer
  alt?: string
  style?: React.CSSProperties
}) {
  const { url, error } = useSignedUrl(viewer, s3Key)
  if (error) {
    return (
      <div style={{ ...style, background: "#f5f2ee", color: muted, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.65rem", textAlign: "center", padding: 8 }}>
        Couldn&apos;t load
      </div>
    )
  }
  if (!url) return <div style={{ ...style, background: "#f5f2ee" }} />
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={alt} style={style} />
  )
}
