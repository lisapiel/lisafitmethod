"use client"

import { useEffect, useState } from "react"
import { SignedImage } from "@/components/coaching/SignedMedia.client"
import type { MediaViewer } from "@/lib/mediaUpload.client"
import { POSE_LABEL, type StoredPhoto } from "@/lib/progressPhotos"

const sans = "var(--font-dm-sans), sans-serif"

// Private progress photos as small thumbnails; tap one to see it full size.
// Signed links come from the server, which only signs the client's own photos
// (or any client photo for an admin).
export function ProgressPhotoStrip({ photos, viewer, dark = false, size = 96 }: { photos: StoredPhoto[]; viewer: MediaViewer; dark?: boolean; size?: number }) {
  const [open, setOpen] = useState<StoredPhoto | null>(null)
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(null) }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open])
  if (photos.length === 0) return null
  return (
    <>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {photos.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setOpen(p)}
            aria-label={`View ${POSE_LABEL[p.pose].toLowerCase()} photo full size`}
            style={{ position: "relative", width: size, aspectRatio: "3 / 4", padding: 0, border: `1px solid ${dark ? "#2a2a2a" : "#e8e2dc"}`, borderRadius: 6, overflow: "hidden", background: dark ? "#111" : "#f5f2ee", cursor: "zoom-in" }}
          >
            <SignedImage s3Key={p.key} viewer={viewer} alt={`${POSE_LABEL[p.pose]} progress photo`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            <span style={{ position: "absolute", left: 4, bottom: 4, fontFamily: sans, fontSize: "0.7rem", fontWeight: 600, color: "#fff", background: "rgba(10,10,10,0.6)", borderRadius: 4, padding: "1px 6px" }}>{POSE_LABEL[p.pose]}</span>
          </button>
        ))}
      </div>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${POSE_LABEL[open.pose]} progress photo`}
          onClick={() => setOpen(null)}
          style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", padding: "calc(env(safe-area-inset-top) + 56px) 16px calc(env(safe-area-inset-bottom) + 16px)" }}
        >
          <button
            type="button"
            onClick={() => setOpen(null)}
            aria-label="Close photo"
            autoFocus
            style={{ position: "absolute", top: "calc(env(safe-area-inset-top) + 12px)", right: 12, width: 44, height: 44, borderRadius: "50%", background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.25)", color: "#f0e6d3", fontSize: "1.1rem", cursor: "pointer" }}
          >
            ✕
          </button>
          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: "100%", maxHeight: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <SignedImage s3Key={open.key} viewer={viewer} alt={`${POSE_LABEL[open.pose]} progress photo`} style={{ maxWidth: "min(92vw, 720px)", maxHeight: "78vh", objectFit: "contain", display: "block", borderRadius: 4, minWidth: 120, minHeight: 160 }} />
            <span style={{ fontFamily: sans, fontSize: "0.85rem", color: "#f0e6d3" }}>{POSE_LABEL[open.pose]}</span>
          </div>
        </div>
      )}
    </>
  )
}
