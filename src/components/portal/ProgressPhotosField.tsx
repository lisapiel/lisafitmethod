"use client"

import { SignedImage } from "@/components/coaching/SignedMedia.client"
import { PHOTO_POSES, POSE_LABEL, type PhotoMilestone, type PhotoPose } from "@/lib/progressPhotos"

export type PhotoSlot = {
  pose: PhotoPose
  name: string
  previewUrl: string | null
  s3Key: string | null
  progress: number
  uploading: boolean
  error: string | null
}

const PROMPTS: Record<Exclude<PhotoMilestone, null>, { title: string; body: string }> = {
  start: {
    title: "Let's capture your starting point! 📸",
    body: "Progress photos can help us see changes that don't always show up on the scale. Totally optional.",
  },
  final: {
    title: "Look how far you've come!",
    body: "If you'd like, add updated photos so we can compare your progress.",
  },
}

const sans = "var(--font-dm-sans), sans-serif"

// Optional front, side and back photos for a check-in. Quiet by default; a
// friendly highlighted prompt at the start and end of a phase. Never required.
export function ProgressPhotosField({
  photos,
  prompt,
  onPick,
  onRemove,
}: {
  photos: PhotoSlot[]
  prompt: PhotoMilestone
  onPick: (pose: PhotoPose, file: File) => void
  onRemove: (pose: PhotoPose) => void
}) {
  const highlight = prompt ? PROMPTS[prompt] : null
  return (
    <section
      aria-labelledby="progress-photos-heading"
      style={{
        marginTop: 20,
        padding: highlight ? "16px 14px" : 0,
        background: highlight ? "#fdfbf7" : "transparent",
        border: highlight ? "1px solid #e8e2dc" : "none",
        borderLeft: highlight ? "3px solid #c8a97e" : "none",
        borderRadius: highlight ? 8 : 0,
      }}
    >
      {highlight ? (
        <>
          <h3 id="progress-photos-heading" style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.1rem", fontWeight: 700, color: "#0a0a0a", margin: "0 0 4px" }}>{highlight.title}</h3>
          <p style={{ fontFamily: sans, fontSize: "0.9rem", color: "#4a4540", lineHeight: 1.5, margin: "0 0 4px" }}>{highlight.body}</p>
        </>
      ) : (
        <h3 id="progress-photos-heading" style={{ fontFamily: sans, fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6b6560", margin: "0 0 4px" }}>
          Progress photos <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span>
        </h3>
      )}
      <p style={{ fontFamily: sans, fontSize: "0.8rem", color: "#6b6560", margin: "0 0 10px", lineHeight: 1.45 }}>
        Add any you like: front, side or back. They&apos;re private to you and me.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8, maxWidth: 360 }}>
        {PHOTO_POSES.map((pose) => {
          const p = photos.find((x) => x.pose === pose)
          const label = POSE_LABEL[pose]
          const inputId = `progress-photo-${pose}`
          return (
            <div key={pose} style={{ position: "relative", aspectRatio: "3 / 4", borderRadius: 6, overflow: "hidden", background: p ? "#f5f2ee" : "#fff", border: p ? "1px solid #e8e2dc" : "1.5px dashed #d6cfc6" }}>
              {p ? (
                <>
                  {p.previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.previewUrl} alt={`${label} progress photo`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  ) : p.s3Key ? (
                    <SignedImage s3Key={p.s3Key} viewer="client" alt={`${label} progress photo`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  ) : null}
                  <span style={{ position: "absolute", left: 6, bottom: 6, fontFamily: sans, fontSize: "0.72rem", fontWeight: 600, color: "#fff", background: "rgba(10,10,10,0.6)", borderRadius: 4, padding: "2px 6px" }}>{label}</span>
                  {p.uploading && (
                    <span role="status" style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", background: "rgba(255,255,255,0.7)", fontFamily: sans, fontSize: "0.8rem", fontWeight: 600, color: "#1a1a1a" }}>
                      {p.progress < 100 ? `${p.progress}%` : "Saving…"}
                    </span>
                  )}
                  {p.error && (
                    <span role="alert" style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center", padding: 6, background: "rgba(255,255,255,0.85)", fontFamily: sans, fontSize: "0.75rem", fontWeight: 600, color: "#c14646" }}>
                      {p.error}
                    </span>
                  )}
                  {!p.uploading && (
                    <button
                      type="button"
                      onClick={() => onRemove(pose)}
                      aria-label={`Remove ${label.toLowerCase()} photo`}
                      style={{ position: "absolute", top: 4, right: 4, width: 32, height: 32, borderRadius: "50%", border: "none", background: "rgba(10,10,10,0.6)", color: "#fff", fontSize: "1rem", lineHeight: 1, cursor: "pointer" }}
                    >
                      ×
                    </button>
                  )}
                </>
              ) : (
                <label htmlFor={inputId} style={{ position: "absolute", inset: 0, display: "grid", placeContent: "center", gap: 2, textAlign: "center", cursor: "pointer", fontFamily: sans, color: "#6b6560" }}>
                  <span aria-hidden="true" style={{ fontSize: "1.3rem", lineHeight: 1, color: "#a8895e" }}>+</span>
                  <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{label}</span>
                </label>
              )}
              <input
                id={inputId}
                type="file"
                // JPEG/PNG only, so iPhones convert HEIC on the way out and every browser can show it.
                accept="image/jpeg,image/png"
                className="pt-sr"
                aria-label={`Add ${label.toLowerCase()} progress photo`}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  e.target.value = ""
                  if (f) onPick(pose, f)
                }}
              />
            </div>
          )
        })}
      </div>
    </section>
  )
}
