"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { uploadData, getUrl } from "aws-amplify/storage"

const accent = "#c8a97e"
const black = "#0a0a0a"
const muted = "#6b6560"
const border = "#e8e2dc"
const white = "#fff"

type NutritionKind = "nutrition-meal" | "nutrition-day" | "nutrition-question"

const KIND_OPTIONS: Array<{ value: NutritionKind; label: string; hint: string; placeholder: string }> = [
  {
    value: "nutrition-meal",
    label: "Meal",
    hint: "Share a single meal you ate or plan to eat.",
    placeholder: "Anything you want me to look at?",
  },
  {
    value: "nutrition-day",
    label: "Day of eating",
    hint: "Share your full day — photos, a written summary, or a screenshot of a tracker.",
    placeholder: "What you ate, roughly when, and anything you want feedback on.",
  },
  {
    value: "nutrition-question",
    label: "Question",
    hint: "Protein, meal timing, hunger, hitting your targets — anything nutrition.",
    placeholder: "e.g. Am I eating enough protein on training days?",
  },
]

// Reasonable upload guardrails. iPhone JPEGs are typically 2–5 MB.
const MAX_ATTACHMENTS = 6
const MAX_FILE_BYTES = 8 * 1024 * 1024 // 8 MB

interface Attachment {
  file: File
  previewUrl: string
  s3Key: string | null   // null until upload finishes
  progress: number
  error: string | null
  uploading: boolean
}

type Phase = "idle" | "submitting" | "sent" | "error"

function extForFile(file: File): string {
  const fromName = file.name.includes(".") ? file.name.split(".").pop()! : ""
  if (fromName && fromName.length <= 5) return fromName.toLowerCase()
  if (file.type === "image/jpeg") return "jpg"
  if (file.type === "image/png") return "png"
  if (file.type === "image/webp") return "webp"
  if (file.type === "image/heic" || file.type === "image/heif") return "heic"
  return "jpg"
}

function randomId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export default function NutritionComposer({ email }: { email: string }) {
  const [kind, setKind] = useState<NutritionKind>("nutrition-meal")
  const [text, setText] = useState("")
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [phase, setPhase] = useState<Phase>("idle")
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const submitLockRef = useRef(false)

  // Revoke object URLs on unmount so we don't leak blob URLs.
  useEffect(() => () => {
    for (const a of attachments) URL.revokeObjectURL(a.previewUrl)
  }, [attachments])

  const currentKindMeta = KIND_OPTIONS.find((k) => k.value === kind)!
  const anyUploading = attachments.some((a) => a.uploading)
  const canSubmit = !anyUploading && phase !== "submitting" && (text.trim().length > 0 || attachments.some((a) => a.s3Key))

  async function handlePickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (fileRef.current) fileRef.current.value = ""
    if (files.length === 0) return

    setError(null)
    const room = MAX_ATTACHMENTS - attachments.length
    const accepted: File[] = []
    for (const f of files.slice(0, room)) {
      if (!f.type.startsWith("image/")) {
        setError("Only image files are supported.")
        continue
      }
      if (f.size > MAX_FILE_BYTES) {
        setError(`${f.name} is larger than 8 MB.`)
        continue
      }
      accepted.push(f)
    }
    if (accepted.length === 0) return

    // Add all attachments in uploading state first so the UI shows previews
    // immediately; each upload progresses independently.
    const emailSlug = email.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    const newAttachments: Attachment[] = accepted.map((file) => {
      const s3Key = `media/nutrition-messages/${emailSlug}/${Date.now()}-${randomId()}.${extForFile(file)}`
      return {
        file,
        previewUrl: URL.createObjectURL(file),
        s3Key: null,
        progress: 0,
        error: null,
        uploading: true,
        _plannedKey: s3Key,
      } as Attachment & { _plannedKey: string }
    })
    setAttachments((prev) => [...prev, ...newAttachments])

    // Upload sequentially — parallel uploads on mobile can hit iOS memory limits
    // for larger photos. Sequential is a bit slower but far more reliable.
    for (const att of newAttachments) {
      const plannedKey = (att as Attachment & { _plannedKey: string })._plannedKey
      try {
        await uploadData({
          path: plannedKey,
          data: att.file,
          options: {
            contentType: att.file.type || "image/jpeg",
            onProgress: ({ transferredBytes, totalBytes }) => {
              if (!totalBytes) return
              const pct = Math.round((transferredBytes / totalBytes) * 100)
              setAttachments((prev) => prev.map((x) => x === att ? { ...x, progress: pct } : x))
            },
          },
        }).result
        setAttachments((prev) => prev.map((x) => x === att ? { ...x, s3Key: plannedKey, uploading: false, progress: 100 } : x))
      } catch {
        setAttachments((prev) => prev.map((x) => x === att ? { ...x, uploading: false, error: "Upload failed" } : x))
      }
    }
  }

  function removeAttachment(att: Attachment) {
    URL.revokeObjectURL(att.previewUrl)
    setAttachments((prev) => prev.filter((x) => x !== att))
  }

  async function submit() {
    if (!canSubmit || submitLockRef.current) return
    submitLockRef.current = true
    setPhase("submitting")
    setError(null)
    try {
      const uploadedKeys = attachments.map((a) => a.s3Key).filter((k): k is string => k != null)
      const res = await fetch("/api/coaching/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: text.trim(),
          kind,
          attachmentS3Keys: uploadedKeys,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({} as { error?: string }))
        throw new Error(data.error || `Send failed (${res.status})`)
      }
      // Clean up preview URLs — the sent-state view uses CDN URLs instead.
      for (const a of attachments) URL.revokeObjectURL(a.previewUrl)
      setAttachments([])
      setText("")
      setPhase("sent")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed")
      setPhase("error")
    } finally {
      submitLockRef.current = false
    }
  }

  function reset() {
    setPhase("idle")
    setError(null)
  }

  // ── Sent confirmation ────────────────────────────────────────────────
  if (phase === "sent") {
    return (
      <div style={{
        background: white, border: `1px solid ${accent}`, borderLeft: `4px solid ${accent}`,
        borderRadius: 8, padding: "1.25rem 1.5rem",
      }}>
        <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: accent, margin: "0 0 6px" }}>
          Sent to Lisa ✓
        </p>
        <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.85rem", color: black, margin: "0 0 12px", lineHeight: 1.5 }}>
          I&apos;ll review it and reply in your coaching messages.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link
            href="/my-coaching/messages"
            style={{
              display: "inline-block", background: black, color: white,
              padding: "10px 18px", fontFamily: "var(--font-dm-sans), sans-serif",
              fontSize: "0.78rem", fontWeight: 700, textDecoration: "none",
              borderRadius: 4, letterSpacing: "0.06em",
            }}
          >
            Open Messages →
          </Link>
          <button
            onClick={reset}
            style={{
              background: "transparent", border: `1px solid ${border}`,
              padding: "10px 18px", fontFamily: "var(--font-dm-sans), sans-serif",
              fontSize: "0.78rem", fontWeight: 600, color: black,
              borderRadius: 4, cursor: "pointer",
            }}
          >
            Send another
          </button>
        </div>
      </div>
    )
  }

  // ── Composer ─────────────────────────────────────────────────────────
  return (
    <div style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, padding: "1.25rem 1.25rem" }}>
      <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: accent, margin: "0 0 4px" }}>
        Nutrition Support
      </p>
      <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(1.1rem, 3.5vw, 1.25rem)", fontWeight: 700, color: black, margin: "0 0 6px", lineHeight: 1.25 }}>
        Send your nutrition to Lisa
      </h2>
      <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", color: muted, margin: "0 0 16px", lineHeight: 1.55 }}>
        Share a meal, a day of eating, or a question and I&apos;ll help you make practical adjustments around your goals and training.
      </p>

      {/* Kind selector */}
      <div role="radiogroup" aria-label="What are you sharing" style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        {KIND_OPTIONS.map((opt) => {
          const active = kind === opt.value
          return (
            <button
              key={opt.value}
              role="radio"
              aria-checked={active}
              type="button"
              onClick={() => setKind(opt.value)}
              style={{
                flex: "1 1 auto", minWidth: 0,
                background: active ? black : "transparent",
                border: `1px solid ${active ? black : border}`,
                color: active ? white : black,
                padding: "10px 14px",
                fontFamily: "var(--font-dm-sans), sans-serif",
                fontSize: "0.78rem", fontWeight: active ? 700 : 600,
                letterSpacing: "0.04em",
                borderRadius: 4, cursor: "pointer",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
      <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.72rem", color: muted, margin: "0 0 12px", lineHeight: 1.5 }}>
        {currentKindMeta.hint}
      </p>

      {/* Attachments — hidden for question type since text is the point */}
      {kind !== "nutrition-question" && (
        <div style={{ marginBottom: 12 }}>
          {attachments.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(88px, 1fr))", gap: 8, marginBottom: 10 }}>
              {attachments.map((att) => (
                <div key={att.previewUrl} style={{ position: "relative", aspectRatio: "1 / 1", background: "#f5f2ee", borderRadius: 6, overflow: "hidden", border: `1px solid ${border}` }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={att.previewUrl}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: att.error ? 0.4 : 1 }}
                  />
                  {att.uploading && (
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", color: white, fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.7rem", fontWeight: 700 }}>
                      {att.progress}%
                    </div>
                  )}
                  {att.error && (
                    <div style={{ position: "absolute", inset: 0, background: "rgba(193,70,70,0.55)", display: "flex", alignItems: "center", justifyContent: "center", color: white, fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.65rem", fontWeight: 700, padding: 6, textAlign: "center" }}>
                      {att.error}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeAttachment(att)}
                    aria-label="Remove photo"
                    style={{
                      position: "absolute", top: 4, right: 4,
                      width: 24, height: 24, borderRadius: "50%",
                      background: "rgba(0,0,0,0.65)", border: "none",
                      color: white, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      padding: 0,
                    }}
                  >
                    <svg width="10" height="10" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                      <path d="M1.5 1.5l15 15M16.5 1.5l-15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
          {attachments.length < MAX_ATTACHMENTS && (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handlePickFiles}
                style={{ display: "none" }}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  background: "transparent", border: `1px dashed ${border}`,
                  padding: "10px 14px", cursor: "pointer",
                  borderRadius: 6,
                  fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.78rem", fontWeight: 600, color: black,
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <rect x="2.5" y="4.5" width="15" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
                  <circle cx="7.5" cy="8.5" r="1.2" fill="currentColor" />
                  <path d="M4 14l3.5-3 3 3 3-4 3 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {attachments.length === 0 ? "Add photo(s)" : `Add more (${MAX_ATTACHMENTS - attachments.length} left)`}
              </button>
            </>
          )}
        </div>
      )}

      {/* Text */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={currentKindMeta.placeholder}
        rows={3}
        style={{
          width: "100%", boxSizing: "border-box",
          background: "#faf8f5", border: `1px solid ${border}`,
          color: black, padding: "10px 12px",
          fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 16,
          lineHeight: 1.5, borderRadius: 6, outline: "none",
          resize: "vertical", minHeight: 80, maxHeight: 220,
          marginBottom: 12,
        }}
      />

      {error && (
        <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.75rem", color: "#c14646", margin: "0 0 10px" }}>
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={!canSubmit}
        style={{
          width: "100%",
          background: canSubmit ? black : "#ddd5ca",
          color: canSubmit ? white : "#9a9087",
          border: "none",
          padding: "13px 20px",
          fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.85rem",
          fontWeight: 700, letterSpacing: "0.08em",
          cursor: canSubmit ? "pointer" : "not-allowed",
          borderRadius: 4,
          WebkitTapHighlightColor: "transparent",
        }}
      >
        {phase === "submitting" ? "Sending…" : anyUploading ? "Uploading photos…" : "Send to Lisa →"}
      </button>
    </div>
  )
}

// Turn the comma-separated attachmentS3Keys string into an array of S3 keys.
// Nutrition-message attachments are stored under an authenticated-only prefix,
// so the renderer must call getUrl() to produce a short-lived signed URL —
// there is no public CDN URL for these files.
export function attachmentKeys(attachmentS3Keys?: string): string[] {
  if (!attachmentS3Keys) return []
  return attachmentS3Keys
    .split(",")
    .map((k) => k.trim())
    .filter((k) => k.length > 0)
}

// Render a private S3 image via a short-lived signed URL. The URL is generated
// from the viewer's authenticated Amplify session; a logged-out user cannot
// produce one. Shown behind a neutral placeholder while the signed URL is
// being requested, and behind a subtle error state if the request fails.
export function SignedImage({
  s3Key,
  alt = "",
  style,
  expiresIn = 3600,
}: {
  s3Key: string
  alt?: string
  style?: React.CSSProperties
  expiresIn?: number
}) {
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setUrl(null)
    setError(false)
    getUrl({ path: s3Key, options: { expiresIn, validateObjectExistence: false } })
      .then(({ url }) => { if (!cancelled) setUrl(url.toString()) })
      .catch(() => { if (!cancelled) setError(true) })
    return () => { cancelled = true }
  }, [s3Key, expiresIn])

  if (error) {
    return (
      <div style={{ ...style, background: "#f5f2ee", color: muted, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.65rem", textAlign: "center", padding: 8 }}>
        Couldn&apos;t load
      </div>
    )
  }
  if (!url) {
    return <div style={{ ...style, background: "#f5f2ee" }} />
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={alt} style={style} />
  )
}
