"use client"

import { useEffect, useRef, useState } from "react"
import { uploadData } from "aws-amplify/storage"
import { S3_SETTINGS_URL, DEFAULTS, type SiteSettings } from "@/lib/siteSettings"

const gold = "#c9a96e"
const border = "#2a2a2a"

// Video slots that have framing controls. The values are the crop keys in settings.crops.
export const FRAMING_SLOTS: Record<string, { posKey: keyof SiteSettings["crops"]; zoomKey: keyof SiteSettings["crops"] }> = {
  testimonial_gino: {
    posKey: "testimonial_gino_video",
    zoomKey: "testimonial_gino_video_zoom",
  },
}

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

export function VideoFramingTool({ slot, videoUrl }: { slot: string; videoUrl: string }) {
  const keys = FRAMING_SLOTS[slot]
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const [position, setPosition] = useState<string>(DEFAULTS.crops[keys?.posKey ?? "testimonial_gino_video"])
  const [zoom, setZoom] = useState<number>(1)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 5000)
  }

  // Load saved framing from S3 on mount
  useEffect(() => {
    if (!keys) return
    fetch(S3_SETTINGS_URL, { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<SiteSettings>) : null))
      .then((json) => {
        if (json?.crops?.[keys.posKey]) setPosition(json.crops[keys.posKey])
        const zStr = json?.crops?.[keys.zoomKey]
        if (zStr) setZoom(parseFloat(zStr) || 1)
      })
      .catch(() => {})
  }, [keys])

  // Global mouse/touch event listeners for drag
  useEffect(() => {
    function applyFromEvent(clientX: number, clientY: number) {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      const nx = Math.min(100, Math.max(0, Math.round(((clientX - rect.left) / rect.width) * 100)))
      const ny = Math.min(100, Math.max(0, Math.round(((clientY - rect.top) / rect.height) * 100)))
      setPosition(`${nx}% ${ny}%`)
    }
    function onMove(e: MouseEvent) {
      if (isDragging.current) applyFromEvent(e.clientX, e.clientY)
    }
    function onTouchMove(e: TouchEvent) {
      if (!isDragging.current) return
      const t = e.touches[0]
      if (t) applyFromEvent(t.clientX, t.clientY)
      e.preventDefault()
    }
    function onUp() { isDragging.current = false }
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

  if (!keys) return null

  const [x, y] = parseObjPos(position)

  function applyPosition(clientX: number, clientY: number) {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const nx = Math.min(100, Math.max(0, Math.round(((clientX - rect.left) / rect.width) * 100)))
    const ny = Math.min(100, Math.max(0, Math.round(((clientY - rect.top) / rect.height) * 100)))
    setPosition(`${nx}% ${ny}%`)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const current = await fetch(S3_SETTINGS_URL, { cache: "no-store" })
        .then((r) => (r.ok ? (r.json() as Promise<SiteSettings>) : null))
        .catch(() => null)
      const merged: SiteSettings = {
        ...(current ?? DEFAULTS),
        crops: {
          ...(current?.crops ?? DEFAULTS.crops),
          [keys.posKey]: position,
          [keys.zoomKey]: String(zoom),
        },
      }
      await uploadData({
        path: "media/settings.json",
        data: new Blob([JSON.stringify(merged, null, 2)], { type: "application/json" }),
        options: { contentType: "application/json" },
      }).result
      showToast("Framing saved — changes appear on the site within 60 seconds.", true)
    } catch {
      showToast("Save failed — please try again.", false)
    } finally {
      setSaving(false)
    }
  }

  const zoomDisplay = zoom.toFixed(2)

  return (
    <div style={{ background: "#0f0f0f", border: `1px solid ${border}`, padding: "20px" }}>
      <p style={{
        fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.58rem",
        letterSpacing: "0.2em", textTransform: "uppercase", color: gold, marginBottom: 10,
      }}>
        Video framing
      </p>
      <p style={{
        fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.63rem",
        color: "#666", marginBottom: 18, lineHeight: 1.6,
      }}>
        <strong style={{ color: "#999" }}>Drag on the video to reposition.</strong> The gold dot shows the focal
        point — drag it toward Gino&rsquo;s face to center on him.{" "}
        <strong style={{ color: "#999" }}>Drag down</strong> to cut ceiling space;{" "}
        <strong style={{ color: "#999" }}>drag up</strong> to reveal more of the top.
        Use <strong style={{ color: "#999" }}>zoom</strong> to fill more of the frame.
      </p>

      <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
        {/* Drag preview */}
        <div>
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", color: "#444", marginBottom: 6, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Preview (3:4 — same shape as the testimonial card)
          </p>
          <div
            ref={containerRef}
            onMouseDown={(e) => {
              isDragging.current = true
              applyPosition(e.clientX, e.clientY)
              e.preventDefault()
            }}
            onTouchStart={(e) => {
              isDragging.current = true
              const t = e.touches[0]
              if (t) applyPosition(t.clientX, t.clientY)
              e.preventDefault()
            }}
            style={{
              position: "relative",
              width: 200,
              aspectRatio: "3 / 4",
              cursor: "crosshair",
              overflow: "hidden",
              userSelect: "none",
              touchAction: "none",
              background: "#000",
              flexShrink: 0,
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
                objectPosition: position,
                display: "block",
                pointerEvents: "none",
                transform: zoom !== 1 ? `scale(${zoom})` : undefined,
                transformOrigin: position,
              }}
            />
            {/* Focal dot */}
            <div style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              transform: "translate(-50%, -50%)",
              width: 18,
              height: 18,
              borderRadius: "50%",
              border: "2px solid #fff",
              background: gold,
              opacity: 0.9,
              pointerEvents: "none",
              boxShadow: "0 0 6px rgba(0,0,0,0.8)",
              zIndex: 2,
            }} />
            {/* Crosshair guides */}
            <div style={{ position: "absolute", left: `${x}%`, top: 0, bottom: 0, width: 1, background: "rgba(255,255,255,0.12)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", top: `${y}%`, left: 0, right: 0, height: 1, background: "rgba(255,255,255,0.12)", pointerEvents: "none" }} />
          </div>
        </div>

        {/* Zoom + position readout */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingTop: 22 }}>
          <div>
            <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", color: "#444", marginBottom: 8, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Zoom ({zoomDisplay}×)
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                onClick={() => setZoom((z) => Math.max(1, parseFloat((z - 0.1).toFixed(2))))}
                disabled={zoom <= 1}
                style={{
                  width: 32, height: 32, background: "none", border: `1px solid ${border}`,
                  color: zoom <= 1 ? "#333" : "#888", cursor: zoom <= 1 ? "not-allowed" : "pointer",
                  fontFamily: "monospace", fontSize: "1rem",
                }}
              >
                −
              </button>
              <input
                type="range"
                min={1}
                max={2.5}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                style={{ width: 100, accentColor: gold }}
              />
              <button
                onClick={() => setZoom((z) => Math.min(2.5, parseFloat((z + 0.1).toFixed(2))))}
                disabled={zoom >= 2.5}
                style={{
                  width: 32, height: 32, background: "none", border: `1px solid ${border}`,
                  color: zoom >= 2.5 ? "#333" : "#888", cursor: zoom >= 2.5 ? "not-allowed" : "pointer",
                  fontFamily: "monospace", fontSize: "1rem",
                }}
              >
                +
              </button>
            </div>
          </div>

          <div>
            <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", color: "#444", marginBottom: 4, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Position
            </p>
            <code style={{ fontFamily: "monospace", fontSize: "0.7rem", color: "#555" }}>{position}</code>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: saving ? "none" : gold,
              color: saving ? gold : "#0a0a0a",
              border: `1px solid ${gold}`,
              fontFamily: "var(--font-montserrat), sans-serif",
              fontSize: "0.6rem",
              fontWeight: 700,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              padding: "10px 22px",
              cursor: saving ? "default" : "pointer",
              marginTop: 4,
            }}
          >
            {saving ? "Saving…" : "Save framing"}
          </button>
        </div>
      </div>

      {toast && (
        <p style={{
          fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem",
          color: toast.ok ? "#4caf7d" : "#c0392b",
          marginTop: 14,
        }}>
          {toast.msg}
        </p>
      )}
    </div>
  )
}
