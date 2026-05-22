"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import AdminHeader from "@/components/admin/AdminHeader"
import { getBlogPost, saveBlogPost } from "@/lib/blogClient"
import type { BlogPost } from "@/lib/blogClient"
import { uploadData } from "aws-amplify/storage"

const gold = "#c9a96e"
const border = "#2a2a2a"
const S3_BASE = "https://amplify-lisafitmethod-lis-lisafitmediastorebucket2-kgef6soixdov.s3.us-east-2.amazonaws.com"

type Section = { heading: string; body: string }

function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function estimateReadingTime(sections: Section[]) {
  const words = sections.reduce((acc, s) => acc + (s.heading + " " + s.body).split(/\s+/).length, 0)
  return Math.max(1, Math.round(words / 200))
}

interface Props {
  mode: "new" | "edit"
  slug?: string
}

export default function BlogPostFormClient({ mode, slug }: Props) {
  const router = useRouter()
  const imageRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState("")
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [excerpt, setExcerpt] = useState("")
  const [coverImage, setCoverImage] = useState("")
  const [sections, setSections] = useState<Section[]>([{ heading: "", body: "" }])
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState("")
  const [loading, setLoading] = useState(mode === "edit")

  useEffect(() => {
    if (mode === "edit" && slug) {
      getBlogPost(slug).then((post) => {
        if (post) {
          setTitle(post.title)
          setDate(post.date)
          setExcerpt(post.excerpt)
          setCoverImage(post.coverImage ?? "")
          setSections(post.sections.map((s) => ({ heading: s.heading ?? "", body: s.body })))
        }
        setLoading(false)
      })
    }
  }, [mode, slug])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(""), 3000)
  }

  function updateSection(index: number, field: "heading" | "body", value: string) {
    setSections((prev) => prev.map((s, i) => i === index ? { ...s, [field]: value } : s))
  }

  function addSection() {
    setSections((prev) => [...prev, { heading: "", body: "" }])
  }

  function removeSection(index: number) {
    setSections((prev) => prev.filter((_, i) => i !== index))
  }

  function moveSection(index: number, dir: -1 | 1) {
    setSections((prev) => {
      const next = [...prev]
      const swap = index + dir
      if (swap < 0 || swap >= next.length) return prev
      ;[next[index], next[swap]] = [next[swap], next[index]]
      return next
    })
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const ext = file.name.split(".").pop()
      const postSlug = mode === "edit" && slug ? slug : slugify(title) || "new-post"
      const key = `media/blog/images/${postSlug}-cover.${ext}`
      await uploadData({ path: key, data: file, options: { contentType: file.type } }).result
      setCoverImage(`${S3_BASE}/${key}`)
      showToast("Cover image uploaded.")
    } catch {
      showToast("Image upload failed.")
    }
    setUploading(false)
  }

  async function handleSave() {
    if (!title.trim()) { showToast("Title is required."); return }
    if (!excerpt.trim()) { showToast("Excerpt is required."); return }
    if (sections.every((s) => !s.body.trim())) { showToast("At least one section with content is required."); return }

    setSaving(true)
    try {
      const postSlug = mode === "edit" && slug ? slug : slugify(title)
      const post: BlogPost = {
        slug: postSlug,
        title: title.trim(),
        date,
        excerpt: excerpt.trim(),
        readingTime: estimateReadingTime(sections),
        ...(coverImage ? { coverImage } : {}),
        sections: sections
          .filter((s) => s.body.trim())
          .map((s) => ({ ...(s.heading.trim() ? { heading: s.heading.trim() } : {}), body: s.body.trim() })),
      }
      await saveBlogPost(post)
      showToast("Saved! Live in ~60 seconds.")
      setTimeout(() => router.push("/admin/blog"), 1500)
    } catch {
      showToast("Save failed — try again.")
    }
    setSaving(false)
  }

  const inputStyle = {
    width: "100%",
    background: "#0a0a0a",
    border: `1px solid ${border}`,
    color: "#f5f2ee",
    fontFamily: "var(--font-montserrat), sans-serif",
    fontSize: 14,
    padding: "10px 14px",
    outline: "none",
    boxSizing: "border-box" as const,
  }

  const labelStyle = {
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    color: "#888",
    display: "block",
    marginBottom: 8,
  }

  if (loading) {
    return (
      <div style={{ background: "#0a0a0a", minHeight: "100vh", color: "#f5f2ee" }}>
        <AdminHeader />
        <div style={{ padding: 48, textAlign: "center", color: "#888" }}>Loading post…</div>
      </div>
    )
  }

  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", color: "#f5f2ee", fontFamily: "var(--font-montserrat), sans-serif" }}>
      <AdminHeader />

      {toast && (
        <div style={{ position: "fixed", top: 72, right: 24, background: "#1a1a1a", border: `1px solid ${gold}`, color: gold, padding: "12px 20px", fontSize: 13, zIndex: 200 }}>
          {toast}
        </div>
      )}

      <main style={{ maxWidth: 800, margin: "0 auto", padding: "48px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 36 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", color: gold, marginBottom: 8 }}>
              {mode === "new" ? "New Post" : "Edit Post"}
            </p>
            <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: 28, fontWeight: 700, color: "#f5f2ee" }}>
              {mode === "new" ? "Create a New Blog Post" : title || "Edit Post"}
            </h1>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ background: gold, color: "#0a0a0a", fontFamily: "var(--font-montserrat), sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", border: "none", padding: "12px 24px", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}
          >
            {saving ? "Saving…" : "Save Post"}
          </button>
        </div>

        <div style={{ display: "grid", gap: 24 }}>
          {/* Title */}
          <div>
            <label style={labelStyle}>Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. How to Build a Strong Foundation"
              style={inputStyle}
            />
          </div>

          {/* Date + Excerpt row */}
          <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 16 }}>
            <div>
              <label style={labelStyle}>Date *</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Excerpt * (shown in blog list)</label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={2}
                placeholder="One or two sentences summarizing the post."
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>
          </div>

          {/* Cover image */}
          <div>
            <label style={labelStyle}>Cover Image (optional)</label>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <input
                type="text"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="Paste URL or upload below"
                style={{ ...inputStyle, flex: 1 }}
              />
              <button
                onClick={() => imageRef.current?.click()}
                disabled={uploading}
                style={{ background: "none", border: `1px solid ${border}`, color: "#888", fontFamily: "var(--font-montserrat), sans-serif", fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", padding: "10px 16px", cursor: "pointer", whiteSpace: "nowrap" }}
              >
                {uploading ? "Uploading…" : "Upload Image"}
              </button>
              <input ref={imageRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
            </div>
            {coverImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverImage} alt="Cover preview" style={{ marginTop: 12, maxHeight: 200, objectFit: "cover", border: `1px solid ${border}` }} />
            )}
          </div>

          {/* Sections */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>Content Sections *</label>
              <button
                onClick={addSection}
                style={{ background: "none", border: `1px solid ${border}`, color: gold, fontFamily: "var(--font-montserrat), sans-serif", fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", padding: "6px 14px", cursor: "pointer" }}
              >
                + Add Section
              </button>
            </div>

            {sections.map((section, i) => (
              <div key={i} style={{ background: "#111", border: `1px solid ${border}`, padding: "20px 20px 16px", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ fontSize: 12, color: "#888", fontWeight: 500, letterSpacing: "0.08em" }}>Section {i + 1}</span>
                  <div style={{ display: "flex", gap: 8 }}>
                    {i > 0 && (
                      <button onClick={() => moveSection(i, -1)} style={{ background: "none", border: `1px solid ${border}`, color: "#888", fontSize: 12, padding: "4px 10px", cursor: "pointer" }}>↑</button>
                    )}
                    {i < sections.length - 1 && (
                      <button onClick={() => moveSection(i, 1)} style={{ background: "none", border: `1px solid ${border}`, color: "#888", fontSize: 12, padding: "4px 10px", cursor: "pointer" }}>↓</button>
                    )}
                    {sections.length > 1 && (
                      <button onClick={() => removeSection(i)} style={{ background: "none", border: "1px solid #3a2020", color: "#aa5555", fontSize: 12, padding: "4px 10px", cursor: "pointer" }}>Remove</button>
                    )}
                  </div>
                </div>
                <input
                  type="text"
                  value={section.heading}
                  onChange={(e) => updateSection(i, "heading", e.target.value)}
                  placeholder="Section heading (optional — leave blank for intro paragraph)"
                  style={{ ...inputStyle, marginBottom: 10 }}
                />
                <textarea
                  value={section.body}
                  onChange={(e) => updateSection(i, "body", e.target.value)}
                  rows={6}
                  placeholder="Section content…"
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", paddingTop: 12, borderTop: `1px solid ${border}` }}>
            <button
              onClick={() => router.push("/admin/blog")}
              style={{ background: "none", border: `1px solid ${border}`, color: "#888", fontFamily: "var(--font-montserrat), sans-serif", fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", padding: "12px 20px", cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ background: gold, color: "#0a0a0a", fontFamily: "var(--font-montserrat), sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", border: "none", padding: "12px 24px", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}
            >
              {saving ? "Saving…" : "Save Post"}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
