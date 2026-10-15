"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { uploadData } from "aws-amplify/storage"
import { S3_SETTINGS_URL, DEFAULTS, computeVideoCropCSS, type SiteSettings, type VideoCrop } from "@/lib/siteSettings"

const gold = "#c9a96e"
const border = "#2a2a2a"

export const FRAMING_SLOTS: Record<string, true> = {
  testimonial_gino: true,
}

const AR_PRESETS = [
  { label: "3:4", ratio: 3 / 4 },
  { label: "4:5", ratio: 4 / 5 },
  { label: "1:1", ratio: 1 },
  { label: "9:16", ratio: 9 / 16 },
  { label: "Original", ratio: 0 },
]

const MIN_CROP_W = 0.1
const MAX_W = 420
const MAX_H = 460

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}

type CropRect = { x: number; y: number; w: number; h: number }
type DragMode = "move" | "nw" | "ne" | "sw" | "se"
type DragState = {
  mode: DragMode
  startX: number
  startY: number
  startCrop: CropRect
  cropAR: number
}

function defaultCropFor(videoAR: number, targetAR = 3 / 4): CropRect {
  let w = 1
  let h = w * videoAR / targetAR
  if (h > 1) { h = 1; w = targetAR / videoAR }
  return { x: (1 - w) / 2, y: (1 - h) / 2, w, h }
}

export function VideoFramingTool({ slot, videoUrl }: { slot: string; videoUrl: string }) {
  const editorRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const dragRef = useRef<DragState | null>(null)

  const [videoAR, setVideoAR] = useState(0)
  const [crop, setCrop] = useState<CropRect | null>(null)
  const [selectedAR, setSelectedAR] = useState("3:4")
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 5000)
  }

  // Load saved crop from S3 on mount
  useEffect(() => {
    fetch(S3_SETTINGS_URL, { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<SiteSettings>) : null))
      .then((json) => {
        const saved = json?.videoCrops?.[slot]
        if (saved) {
          setCrop({ x: saved.x, y: saved.y, w: saved.w, h: saved.h })
          setSelectedAR(saved.ar ?? "3:4")
        }
      })
      .catch(() => {})
  }, [slot])

  // Set default crop once video AR is known and no saved crop was found
  useEffect(() => {
    if (videoAR > 0 && crop === null) {
      setCrop(defaultCropFor(videoAR, 3 / 4))
    }
  }, [videoAR, crop])

  // Global drag: mouse + touch handlers
  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    const ds = dragRef.current
    if (!ds || !editorRef.current) return
    const rect = editorRef.current.getBoundingClientRect()
    if (!rect.width || !rect.height) return

    const dx = (clientX - ds.startX) / rect.width
    const dy = (clientY - ds.startY) / rect.height
    const sc = ds.startCrop
    const tAR = ds.cropAR
    const vid = videoRef.current
    const cVAR = vid && vid.videoWidth ? vid.videoWidth / vid.videoHeight : 1

    let newCrop: CropRect
    switch (ds.mode) {
      case "move": {
        newCrop = { x: clamp(sc.x + dx, 0, 1 - sc.w), y: clamp(sc.y + dy, 0, 1 - sc.h), w: sc.w, h: sc.h }
        break
      }
      case "se": {
        const proj = (dx + dy) / 2
        let w = clamp(sc.w + proj, MIN_CROP_W, 1 - sc.x)
        let h = w * cVAR / tAR
        if (sc.y + h > 1) { h = 1 - sc.y; w = h * tAR / cVAR }
        newCrop = { x: sc.x, y: sc.y, w, h }
        break
      }
      case "nw": {
        const proj = (-dx - dy) / 2
        const ar = sc.x + sc.w
        const ab = sc.y + sc.h
        let w = clamp(sc.w + proj, MIN_CROP_W, ar)
        let h = w * cVAR / tAR
        let y = ab - h
        if (y < 0) { h = ab; w = h * tAR / cVAR; y = 0 }
        newCrop = { x: ar - w, y, w, h }
        break
      }
      case "ne": {
        const proj = (dx - dy) / 2
        const ab = sc.y + sc.h
        let w = clamp(sc.w + proj, MIN_CROP_W, 1 - sc.x)
        let h = w * cVAR / tAR
        let y = ab - h
        if (y < 0) { h = ab; w = h * tAR / cVAR; y = 0 }
        newCrop = { x: sc.x, y, w, h }
        break
      }
      case "sw": {
        const proj = (-dx + dy) / 2
        const ar = sc.x + sc.w
        let w = clamp(sc.w + proj, MIN_CROP_W, ar)
        let h = w * cVAR / tAR
        if (sc.y + h > 1) { h = 1 - sc.y; w = h * tAR / cVAR }
        newCrop = { x: ar - w, y: sc.y, w, h }
        break
      }
      default:
        return
    }
    setCrop(newCrop)
  }, [])

  const handleDragEnd = useCallback(() => { dragRef.current = null }, [])

  useEffect(() => {
    function onMove(e: MouseEvent) { handleDragMove(e.clientX, e.clientY) }
    function onTouchMove(e: TouchEvent) {
      const t = e.touches[0]
      if (t) handleDragMove(t.clientX, t.clientY)
      if (dragRef.current) e.preventDefault()
    }
    function onUp() { handleDragEnd() }
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
  }, [handleDragMove, handleDragEnd])

  function startDrag(mode: DragMode, clientX: number, clientY: number, e: React.MouseEvent | React.TouchEvent) {
    if (!crop || videoAR <= 0) return
    e.preventDefault()
    e.stopPropagation()
    const vid = videoRef.current
    const cVAR = vid && vid.videoWidth ? vid.videoWidth / vid.videoHeight : videoAR
    dragRef.current = { mode, startX: clientX, startY: clientY, startCrop: crop, cropAR: crop.w / crop.h * cVAR }
  }

  function handleARChange(arLabel: string) {
    if (!crop || videoAR <= 0) return
    setSelectedAR(arLabel)
    const preset = AR_PRESETS.find((p) => p.label === arLabel)
    if (!preset) return
    const vid = videoRef.current
    const cVAR = vid && vid.videoWidth ? vid.videoWidth / vid.videoHeight : videoAR
    const targetAR = preset.ratio === 0 ? cVAR : preset.ratio
    const cx = crop.x + crop.w / 2
    const cy = crop.y + crop.h / 2
    let newW = crop.w
    let newH = newW * cVAR / targetAR
    if (newH > 1) { newH = 1; newW = targetAR / cVAR }
    if (newW > 1) { newW = 1; newH = cVAR / targetAR }
    newW = Math.max(newW, MIN_CROP_W)
    const newX = clamp(cx - newW / 2, 0, 1 - newW)
    const newY = clamp(cy - newH / 2, 0, 1 - newH)
    setCrop({ x: newX, y: newY, w: newW, h: newH })
  }

  async function handleSave() {
    if (!crop || videoAR <= 0) return
    setSaving(true)
    try {
      const current = await fetch(S3_SETTINGS_URL, { cache: "no-store" })
        .then((r) => (r.ok ? (r.json() as Promise<SiteSettings>) : null))
        .catch(() => null)
      const vid = videoRef.current
      const savedVideoAR = vid && vid.videoWidth ? vid.videoWidth / vid.videoHeight : videoAR
      const videoCrop: VideoCrop = { x: crop.x, y: crop.y, w: crop.w, h: crop.h, ar: selectedAR, videoAR: savedVideoAR }
      const merged: SiteSettings = {
        ...(current ?? DEFAULTS),
        videoCrops: { ...(current?.videoCrops ?? {}), [slot]: videoCrop },
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

  function handleReset() {
    if (videoAR <= 0) return
    setCrop(defaultCropFor(videoAR, 3 / 4))
    setSelectedAR("3:4")
  }

  // Editor canvas dimensions — sized to match the video's aspect ratio
  const effAR = videoAR > 0 ? videoAR : 9 / 16
  const editorW = effAR > MAX_W / MAX_H ? MAX_W : Math.round(MAX_H * effAR)
  const editorH = effAR > MAX_W / MAX_H ? Math.round(MAX_W / effAR) : MAX_H

  // Preview pane — always shows the 3:4 testimonial card rendering
  const previewW = 150
  const previewH = Math.round(previewW / (3 / 4)) // 200px
  const previewCSS = crop && videoAR > 0
    ? computeVideoCropCSS({ ...crop, ar: selectedAR, videoAR }, 3 / 4)
    : null

  const HANDLE = 14

  return (
    <div style={{ background: "#0f0f0f", border: `1px solid ${border}`, padding: "20px 20px 24px" }}>
      <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.58rem", letterSpacing: "0.2em", textTransform: "uppercase", color: gold, marginBottom: 6 }}>
        Video framing
      </p>
      <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", color: "#555", lineHeight: 1.6, marginBottom: 18 }}>
        Drag the crop rectangle to reposition it. Drag a corner handle to resize while maintaining the aspect ratio. The preview shows exactly what visitors see on the site.
      </p>

      {/* Aspect ratio selector */}
      <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 18, flexWrap: "wrap" }}>
        <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", color: "#444", textTransform: "uppercase", letterSpacing: "0.1em", marginRight: 4 }}>
          Crop shape:
        </span>
        {AR_PRESETS.map(({ label }) => (
          <button
            key={label}
            onClick={() => handleARChange(label)}
            style={{
              background: selectedAR === label ? gold : "none",
              color: selectedAR === label ? "#0a0a0a" : "#666",
              border: `1px solid ${selectedAR === label ? gold : border}`,
              fontFamily: "var(--font-montserrat), sans-serif",
              fontSize: "0.55rem",
              fontWeight: selectedAR === label ? 700 : 400,
              letterSpacing: "0.06em",
              padding: "4px 10px",
              cursor: "pointer",
            }}
          >
            {label}{label === "3:4" ? " ★" : ""}
          </button>
        ))}
        <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.5rem", color: "#333", marginLeft: 4 }}>
          ★ matches the testimonial card
        </span>
      </div>

      {/* Editor + preview side by side */}
      <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>

        {/* Main editor canvas */}
        <div style={{ flexShrink: 0 }}>
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.5rem", color: "#333", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Full video — drag crop region
          </p>
          <div
            ref={editorRef}
            style={{
              position: "relative",
              width: editorW,
              height: editorH,
              background: "#000",
              overflow: "hidden",
              userSelect: "none",
              touchAction: "none",
              maxWidth: "100%",
              cursor: "default",
            }}
          >
            {/* The video fills the canvas exactly (canvas is sized to video AR) */}
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video
              ref={videoRef}
              src={videoUrl}
              playsInline
              preload="metadata"
              onLoadedMetadata={(e) => {
                const v = e.currentTarget
                const ar = v.videoWidth / v.videoHeight
                setVideoAR(ar)
                setDuration(v.duration)
              }}
              onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "fill", display: "block" }}
            />

            {/* Overlay + crop handles — only once video AR and crop are known */}
            {crop && videoAR > 0 && (
              <>
                {/* Shaded regions outside crop */}
                <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                  {/* top */}
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: `${crop.y * 100}%`, background: "rgba(0,0,0,0.6)" }} />
                  {/* bottom */}
                  <div style={{ position: "absolute", left: 0, right: 0, top: `${(crop.y + crop.h) * 100}%`, bottom: 0, background: "rgba(0,0,0,0.6)" }} />
                  {/* left */}
                  <div style={{ position: "absolute", top: `${crop.y * 100}%`, bottom: `${(1 - crop.y - crop.h) * 100}%`, left: 0, width: `${crop.x * 100}%`, background: "rgba(0,0,0,0.6)" }} />
                  {/* right */}
                  <div style={{ position: "absolute", top: `${crop.y * 100}%`, bottom: `${(1 - crop.y - crop.h) * 100}%`, left: `${(crop.x + crop.w) * 100}%`, right: 0, background: "rgba(0,0,0,0.6)" }} />
                </div>

                {/* Rule-of-thirds grid inside crop */}
                {[1 / 3, 2 / 3].map((f) => (
                  <div key={`grid-${f}`} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                    <div style={{ position: "absolute", left: `${(crop.x + f * crop.w) * 100}%`, top: `${crop.y * 100}%`, width: 1, height: `${crop.h * 100}%`, background: "rgba(255,255,255,0.15)" }} />
                    <div style={{ position: "absolute", top: `${(crop.y + f * crop.h) * 100}%`, left: `${crop.x * 100}%`, width: `${crop.w * 100}%`, height: 1, background: "rgba(255,255,255,0.15)" }} />
                  </div>
                ))}

                {/* Crop rectangle border (move handle) */}
                <div
                  onMouseDown={(e) => startDrag("move", e.clientX, e.clientY, e)}
                  onTouchStart={(e) => { const t = e.touches[0]; if (t) startDrag("move", t.clientX, t.clientY, e) }}
                  style={{
                    position: "absolute",
                    left: `${crop.x * 100}%`,
                    top: `${crop.y * 100}%`,
                    width: `${crop.w * 100}%`,
                    height: `${crop.h * 100}%`,
                    border: "2px solid rgba(255,255,255,0.85)",
                    boxSizing: "border-box",
                    cursor: "move",
                  }}
                />

                {/* Corner handles */}
                {(["nw", "ne", "sw", "se"] as const).map((corner) => {
                  const isE = corner[1] === "e"
                  const isS = corner[0] === "s"
                  return (
                    <div
                      key={corner}
                      onMouseDown={(e) => { e.stopPropagation(); startDrag(corner, e.clientX, e.clientY, e) }}
                      onTouchStart={(e) => { e.stopPropagation(); const t = e.touches[0]; if (t) startDrag(corner, t.clientX, t.clientY, e) }}
                      style={{
                        position: "absolute",
                        width: HANDLE,
                        height: HANDLE,
                        background: "#fff",
                        border: "1px solid rgba(0,0,0,0.3)",
                        left: isE ? `${(crop.x + crop.w) * 100}%` : `${crop.x * 100}%`,
                        top: isS ? `${(crop.y + crop.h) * 100}%` : `${crop.y * 100}%`,
                        transform: `translate(${isE ? "-100%" : "0"}, ${isS ? "-100%" : "0"})`,
                        cursor: `${corner}-resize`,
                        zIndex: 3,
                      }}
                    />
                  )
                })}
              </>
            )}
          </div>

          {/* Playback controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, maxWidth: editorW }}>
            <button
              onClick={() => { const v = videoRef.current; if (!v) return; if (isPlaying) v.pause(); else v.play() }}
              style={{ background: "none", border: `1px solid ${border}`, color: "#666", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.58rem", padding: "5px 10px", cursor: "pointer", flexShrink: 0 }}
            >
              {isPlaying ? "⏸" : "▶"}
            </button>
            <input
              type="range"
              min={0}
              max={duration || 1}
              step={0.05}
              value={currentTime}
              onChange={(e) => { const v = videoRef.current; if (v) v.currentTime = parseFloat(e.target.value) }}
              style={{ flex: 1, accentColor: gold, cursor: "pointer" }}
            />
            <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.52rem", color: "#333", flexShrink: 0, minWidth: 48, textAlign: "right" }}>
              {Math.floor(currentTime)}s / {Math.floor(duration)}s
            </span>
          </div>
        </div>

        {/* Preview pane */}
        <div style={{ flexShrink: 0 }}>
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.5rem", color: "#333", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Testimonial card (3:4)
          </p>
          <div
            style={{
              position: "relative",
              width: previewW,
              height: previewH,
              overflow: "hidden",
              background: "#000",
              border: `1px solid ${border}`,
            }}
          >
            {previewCSS ? (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <video src={videoUrl} preload="metadata" muted playsInline style={previewCSS} />
            ) : (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 16, height: 16, border: `2px solid ${border}`, borderTop: `2px solid #333`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            )}
          </div>
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.48rem", color: "#2a2a2a", marginTop: 6, lineHeight: 1.5 }}>
            Exact match to the public site
          </p>

          {/* Crop coordinates readout */}
          {crop && (
            <div style={{ marginTop: 14 }}>
              <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.5rem", color: "#333", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Crop region
              </p>
              {[
                ["X", `${(crop.x * 100).toFixed(1)}%`],
                ["Y", `${(crop.y * 100).toFixed(1)}%`],
                ["W", `${(crop.w * 100).toFixed(1)}%`],
                ["H", `${(crop.h * 100).toFixed(1)}%`],
              ].map(([lbl, val]) => (
                <div key={lbl} style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                  <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.52rem", color: "#333" }}>{lbl}</span>
                  <span style={{ fontFamily: "monospace", fontSize: "0.52rem", color: "#555" }}>{val}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Save + Reset */}
      <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
        <button
          onClick={handleSave}
          disabled={saving || !crop || videoAR <= 0}
          style={{
            background: saving || !crop ? "none" : gold,
            color: saving || !crop ? gold : "#0a0a0a",
            border: `1px solid ${gold}`,
            fontFamily: "var(--font-montserrat), sans-serif",
            fontSize: "0.6rem",
            fontWeight: 700,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            padding: "10px 22px",
            cursor: saving || !crop ? "default" : "pointer",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Saving…" : "Save framing"}
        </button>
        <button
          onClick={handleReset}
          disabled={videoAR <= 0}
          style={{
            background: "none",
            color: "#555",
            border: `1px solid ${border}`,
            fontFamily: "var(--font-montserrat), sans-serif",
            fontSize: "0.6rem",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            padding: "10px 22px",
            cursor: videoAR <= 0 ? "default" : "pointer",
          }}
        >
          Reset to default
        </button>
      </div>

      {toast && (
        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", color: toast.ok ? "#4caf7d" : "#c0392b", marginTop: 14 }}>
          {toast.msg}
        </p>
      )}
    </div>
  )
}
