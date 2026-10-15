"use client"

import { useEffect, useRef, useState } from "react"
import { uploadData } from "aws-amplify/storage"
import { S3_SETTINGS_URL, DEFAULTS, type SiteSettings } from "@/lib/siteSettings"

const gold = "#c9a96e"
const border = "#2a2a2a"

function parseObjPos(pos: string): [number, number] {
  const parts = pos.trim().split(/\s+/)
  const parse = (v: string) => {
    if (v === "center") return 50
    if (v === "top" || v === "left") return 0
    if (v === "bottom" || v === "right") return 100
    return parseInt(v) || 50
  }
  return [parse(parts[0] ?? "center"), parse(parts[1] ?? "center")]
}

export function VideoFramingTool({
  cropKey,
  videoUrl,
}: {
  cropKey: keyof SiteSettings["crops"]
  videoUrl: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const [cropValue, setCropValue] = useState<string>(DEFAULTS.crops[cropKey])
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [loadError, setLoadError] = useState(false)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 5000)
  }

  // Load current saved crop from S3 on mount
  useEffect(() => {
    fetch(S3_SETTINGS_URL, { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<SiteSettings>) : null))
      .then((json) => {
        const saved = json?.crops?.[cropKey]
        if (saved) setCropValue(saved)
      })
      .catch(() => setLoadError(true))
  }, [cropKey])

  const [x, y] = parseObjPos(cropValue)

  function applyPosition(clientX: number, clientY: number) {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const nx = Math.min(100, Math.max(0, Math.round(((clientX - rect.left) / rect.width) * 100)))
    const ny = Math.min(100, Math.max(0, Math.round(((clientY - rect.top) / rect.height) * 100)))
    setCropValue(`${nx}% ${ny}%`)
  }

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (isDragging.current) applyPosition(e.clientX, e.clientY)
    }
    function onTouchMove(e: TouchEvent) {
      if (!isDragging.current) return
      const t = e.touches[0]
      if (t) applyPosition(t.clientX, t.clientY)
      e.preventDefault()
    }
    function onUp() {
      isDragging.current = false
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    window.addEventListener("touchmove", onTouchMove, { passive: false })
    window.addEventListener("touchend", onUp)
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
      window.removeEventListener("touchmove", onTouchMove)
      window.removeEventListener("touchend", onUp)
    }
  })

  async function handleSave() {
    setSaving(true)
    try {
      // Read current settings first so we merge, not overwrite
      const current = await fetch(S3_SETTINGS_URL, { cache: "no-store" })
        .then((r) => (r.ok ? (r.json() as Promise<SiteSettings>) : null))
        .catch(() => null)
      const merged: SiteSettings = {
        ...(current ?? DEFAULTS),
        crops: {
          ...(current?.crops ?? DEFAULTS.crops),
          [cropKey]: cropValue,
        },
      }
      await uploadData({
        path: "media/settings.json",
        data: new Blob([JSON.stringify(merged, null, 2)], { type: "application/json" }),
        options: { contentType: "application/json" },
      }).result
      showToast("Framing saved — changes appear on the site within 60 seconds.")
    } catch {
      showToast("Save failed — please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ marginTop: 20, padding: "20px 20px 16px", background: "#0f0f0f", border: `1px solid ${border}` }}>
      <p style={{
        fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.58rem",
        letterSpacing: "0.2em", textTransform: "uppercase", color: gold, marginBottom: 8,
      }}>
        Video framing
      </p>
      <p style={{
        fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem",
        color: "#666", marginBottom: 16, lineHeight: 1.55,
      }}>
        Drag anywhere on the video to set the focal point.
        Drag <strong style={{ color: "#aaa" }}>up</strong> to remove ceiling space and center on Gino&rsquo;s face.
        The preview below shows exactly what visitors will see.
      </p>

      {loadError && (
        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.62rem", color: "#c0392b", marginBottom: 12 }}>
          Could not load saved framing — showing default.
        </p>
      )}

      {/* Video preview + drag overlay */}
      <div
        ref={containerRef}
        onMouseDown={(e) => { isDragging.current = true; applyPosition(e.clientX, e.clientY); e.preventDefault() }}
        onTouchStart={(e) => {
          isDragging.current = true
          const t = e.touches[0]
          if (t) applyPosition(t.clientX, t.clientY)
          e.preventDefault()
        }}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 280,
          aspectRatio: "3 / 4",
          cursor: "crosshair",
          overflow: "hidden",
          userSelect: "none",
          touchAction: "none",
          background: "#000",
        }}
      >
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          src={videoUrl}
          preload="metadata"
          muted
          playsInline
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: cropValue,
            display: "block",
            pointerEvents: "none",
          }}
        />
        {/* Focal point dot */}
        <div style={{
          position: "absolute",
          left: `${x}%`,
          top: `${y}%`,
          transform: "translate(-50%, -50%)",
          width: 20,
          height: 20,
          borderRadius: "50%",
          border: "2.5px solid #fff",
          background: gold,
          opacity: 0.9,
          pointerEvents: "none",
          boxShadow: "0 0 6px rgba(0,0,0,0.7)",
        }} />
        {/* Crosshair lines */}
        <div style={{
          position: "absolute", left: `${x}%`, top: 0, bottom: 0,
          width: 1, background: "rgba(255,255,255,0.15)", pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", top: `${y}%`, left: 0, right: 0,
          height: 1, background: "rgba(255,255,255,0.15)", pointerEvents: "none",
        }} />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 14 }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            background: saving ? "none" : gold,
            color: saving ? gold : "#0a0a0a",
            border: `1px solid ${gold}`,
            fontFamily: "var(--font-montserrat), sans-serif",
            fontSize: "0.58rem",
            fontWeight: 600,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            padding: "9px 20px",
            cursor: saving ? "default" : "pointer",
          }}
        >
          {saving ? "Saving…" : "Save framing"}
        </button>
        <code style={{ fontFamily: "monospace", fontSize: "0.68rem", color: "#555" }}>
          {cropValue}
        </code>
      </div>

      {toast && (
        <p style={{
          fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.62rem",
          color: toast.includes("failed") ? "#c0392b" : "#4caf7d",
          marginTop: 10,
        }}>
          {toast}
        </p>
      )}
    </div>
  )
}
