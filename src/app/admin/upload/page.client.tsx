"use client"

import { useEffect, useRef, useState } from "react"
import { generateClient } from "aws-amplify/data"
import { uploadData } from "aws-amplify/storage"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import UploadProgress from "@/components/admin/UploadProgress"
import type { Schema } from "@/lib/amplifyConfig"
import { VIDEO_SLOT_LABELS, PHOTO_SLOTS } from "@/lib/videoSlots"

const gold = "#c9a96e"
const border = "#2a2a2a"

const S3_BASE = "https://amplify-lisafitmethod-lis-lisafitmediastorebucket2-kgef6soixdov.s3.us-east-2.amazonaws.com"

type Asset = {
  id: string
  title: string
  s3Key: string
  url?: string | null
  isPublished: boolean
  fileSize?: number | null
  mimeType?: string | null
}

interface Props {
  slot: string
  type: "VIDEO" | "PHOTO"
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getLabel(slot: string, type: "VIDEO" | "PHOTO") {
  if (type === "VIDEO") return VIDEO_SLOT_LABELS[slot] ?? slot
  return PHOTO_SLOTS[slot] ?? slot
}

function makeClient() {
  return generateClient<Schema>({ authMode: "userPool" })
}

export default function UploadPageClient({ slot, type }: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [asset, setAsset] = useState<Asset | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!slot) { setLoading(false); return }
    const client = makeClient()
    client.models.MediaAsset.list({
      filter: { and: [{ assignedTo: { eq: slot } }, { type: { eq: type } }] },
      authMode: "userPool",
    }).then(({ data }) => {
      if (data.length > 0) {
        const a = data[0]
        setAsset({ id: a.id, title: a.title, s3Key: a.s3Key, url: a.url, isPublished: a.isPublished, fileSize: a.fileSize, mimeType: a.mimeType })
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [slot, type])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !slot) return
    setError(null)
    setSuccess(null)
    setUploading(true)
    setProgress(0)

    const ext = file.name.includes(".") ? `.${file.name.split(".").pop()}` : ""
    const folder = type === "VIDEO" ? "media/videos" : "media/photos"
    const s3Key = `${folder}/${slot}${ext}`
    const publicUrl = `${S3_BASE}/${s3Key}`

    try {
      await uploadData({
        path: s3Key,
        data: file,
        options: {
          contentType: file.type || (type === "VIDEO" ? "video/mp4" : "image/jpeg"),
          onProgress: ({ transferredBytes, totalBytes }) => {
            if (totalBytes) setProgress(Math.round((transferredBytes / totalBytes) * 100))
          },
        },
      }).result

      const client = makeClient()
      if (asset) {
        await client.models.MediaAsset.update({
          id: asset.id,
          s3Key,
          url: publicUrl,
          fileSize: file.size,
          mimeType: file.type,
          isPublished: asset.isPublished,
        })
        setAsset({ ...asset, s3Key, url: publicUrl, fileSize: file.size, mimeType: file.type })
      } else {
        const label = getLabel(slot, type)
        const { data: created } = await client.models.MediaAsset.create({
          type,
          title: label,
          s3Key,
          url: publicUrl,
          assignedTo: slot,
          isPublished: false,
          fileSize: file.size,
          mimeType: file.type,
        })
        if (created) {
          setAsset({ id: created.id, title: created.title, s3Key: created.s3Key, url: created.url, isPublished: created.isPublished, fileSize: created.fileSize, mimeType: created.mimeType })
        }
      }
      setSuccess("Upload complete. Use the Publish button to make it live.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.")
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  async function handleTogglePublish() {
    if (!asset) return
    setError(null)
    const next = !asset.isPublished
    try {
      await makeClient().models.MediaAsset.update({ id: asset.id, isPublished: next })
      setAsset({ ...asset, isPublished: next })
      setSuccess(next ? "Published — live on the site." : "Unpublished — hidden from the site.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update publish status.")
    }
  }

  async function handleDelete() {
    if (!asset) return
    if (!confirm("Delete this asset? This cannot be undone.")) return
    setDeleting(true)
    setError(null)
    try {
      await makeClient().models.MediaAsset.delete({ id: asset.id })
      setAsset(null)
      setSuccess("Asset deleted.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.")
    } finally {
      setDeleting(false)
    }
  }

  const label = getLabel(slot, type)
  const backHref = type === "VIDEO" ? "/admin/videos" : "/admin/photos"

  if (!slot) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", color: "#888", fontSize: "0.85rem" }}>
          No slot specified. <Link href="/admin" style={{ color: gold }}>Back to dashboard</Link>
        </p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2.5rem" }}>
        <Link
          href={backHref}
          style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#555", textDecoration: "none" }}
        >
          ← Back
        </Link>
        <span style={{ color: "#2a2a2a" }}>|</span>
        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#555" }}>
          {type === "VIDEO" ? "Videos" : "Photos"}
        </p>
      </div>

      <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "2rem", fontWeight: 300, color: "#f0e6d3", marginBottom: "0.25rem" }}>
        {label}
      </h1>
      <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: "#555", marginBottom: "2.5rem" }}>
        <code style={{ fontFamily: "monospace", fontSize: "0.65rem" }}>{slot}</code>
      </p>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
          <div style={{ width: 28, height: 28, border: "2px solid #2a2a2a", borderTop: `2px solid ${gold}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <>
          {/* Current asset preview */}
          {asset && (
            <div style={{ background: "#161616", border: `1px solid ${border}`, padding: "1.5rem", marginBottom: "1.5rem" }}>
              <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#555", marginBottom: "1rem" }}>
                Current asset
              </p>

              {type === "PHOTO" && asset.url && (
                <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", background: "#0a0a0a", marginBottom: "1rem", overflow: "hidden" }}>
                  <Image src={asset.url} alt={label} fill style={{ objectFit: "cover" }} />
                </div>
              )}

              {type === "VIDEO" && asset.url && (
                <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", background: "#0a0a0a", marginBottom: "1rem" }}>
                  <video
                    src={asset.url}
                    controls
                    playsInline
                    preload="metadata"
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
                  />
                </div>
              )}

              <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", alignItems: "center" }}>
                <div>
                  <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", color: "#555", marginBottom: "0.25rem" }}>Status</p>
                  <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: asset.isPublished ? gold : "#888" }}>
                    {asset.isPublished ? "● Live" : "Draft"}
                  </p>
                </div>
                {asset.fileSize && (
                  <div>
                    <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", color: "#555", marginBottom: "0.25rem" }}>Size</p>
                    <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#888" }}>{formatBytes(asset.fileSize)}</p>
                  </div>
                )}
                {asset.mimeType && (
                  <div>
                    <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", color: "#555", marginBottom: "0.25rem" }}>Format</p>
                    <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#888" }}>{asset.mimeType}</p>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem", flexWrap: "wrap" }}>
                <button
                  onClick={handleTogglePublish}
                  style={{
                    background: asset.isPublished ? "none" : gold,
                    color: asset.isPublished ? "#e07070" : "#0a0a0a",
                    border: asset.isPublished ? "1px solid #e07070" : `1px solid ${gold}`,
                    fontFamily: "var(--font-montserrat), sans-serif",
                    fontSize: "0.6rem",
                    fontWeight: 600,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    padding: "0.6rem 1.25rem",
                    cursor: "pointer",
                  }}
                >
                  {asset.isPublished ? "Unpublish" : "Publish"}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  style={{
                    background: "none",
                    color: "#555",
                    border: "1px solid #333",
                    fontFamily: "var(--font-montserrat), sans-serif",
                    fontSize: "0.6rem",
                    fontWeight: 600,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    padding: "0.6rem 1.25rem",
                    cursor: deleting ? "not-allowed" : "pointer",
                  }}
                >
                  {deleting ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          )}

          {/* Upload area */}
          <div style={{ background: "#161616", border: `1px solid ${border}`, padding: "1.5rem" }}>
            <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#555", marginBottom: "1rem" }}>
              {asset ? "Replace file" : "Upload file"}
            </p>

            {uploading ? (
              <UploadProgress progress={progress} />
            ) : (
              <>
                <label
                  style={{
                    display: "block",
                    border: `1px dashed #333`,
                    padding: "2rem",
                    textAlign: "center",
                    cursor: "pointer",
                    marginBottom: "0.75rem",
                  }}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept={type === "VIDEO" ? "video/*" : "image/*"}
                    onChange={handleUpload}
                    style={{ display: "none" }}
                  />
                  <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.1rem", fontWeight: 300, color: "#f0e6d3", marginBottom: "0.5rem" }}>
                    Click to choose a file
                  </p>
                  <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", color: "#555" }}>
                    {type === "VIDEO" ? "MP4, MOV, or any video format" : "JPG, PNG, WebP, or any image format"}
                  </p>
                </label>
              </>
            )}
          </div>

          {error && (
            <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#e07070", marginTop: "1rem" }}>
              {error}
            </p>
          )}
          {success && (
            <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: gold, marginTop: "1rem" }}>
              {success}
            </p>
          )}

          <div style={{ marginTop: "2.5rem", paddingTop: "1.5rem", borderTop: `1px solid ${border}` }}>
            <button
              onClick={() => router.push(backHref)}
              style={{
                background: "none",
                color: "#555",
                border: "none",
                fontFamily: "var(--font-montserrat), sans-serif",
                fontSize: "0.6rem",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                cursor: "pointer",
                padding: 0,
              }}
            >
              ← Back to {type === "VIDEO" ? "Videos" : "Photos"}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
