"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import AdminHeader from "@/components/admin/AdminHeader"
import { deleteBlogPost, migrateStaticPosts, getBlogIndex } from "@/lib/blogClient"
import type { BlogPostMeta } from "@/lib/blogClient"

const gold = "#c9a96e"
const border = "#2a2a2a"

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}

export default function AdminBlogClient() {
  const [posts, setPosts] = useState<BlogPostMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [migrating, setMigrating] = useState(false)
  const [toast, setToast] = useState("")
  const [deleting, setDeleting] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const index = await getBlogIndex()
    setPosts(index)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(""), 3000)
  }

  async function handleDelete(slug: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    setDeleting(slug)
    try {
      await deleteBlogPost(slug)
      showToast("Post deleted.")
      await load()
    } catch {
      showToast("Error deleting post.")
    }
    setDeleting(null)
  }

  async function handleMigrate() {
    if (!confirm("Import all 5 existing static posts to S3? Do this once — it won't overwrite posts you've already saved to S3.")) return
    setMigrating(true)
    try {
      await migrateStaticPosts()
      showToast("Static posts imported to S3.")
      await load()
    } catch {
      showToast("Migration failed — check console.")
    }
    setMigrating(false)
  }

  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", color: "#f5f2ee", fontFamily: "var(--font-montserrat), sans-serif" }}>
      <AdminHeader />

      {toast && (
        <div style={{ position: "fixed", top: 72, right: 24, background: "#1a1a1a", border: `1px solid ${gold}`, color: gold, padding: "12px 20px", fontSize: 13, zIndex: 200 }}>
          {toast}
        </div>
      )}

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 36 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", color: gold, marginBottom: 8 }}>Content</p>
            <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: 32, fontWeight: 700, color: "#f5f2ee" }}>Blog Posts</h1>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={handleMigrate}
              disabled={migrating}
              style={{ background: "none", border: `1px solid ${border}`, color: "#888", fontFamily: "var(--font-montserrat), sans-serif", fontSize: 11, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", padding: "10px 18px", cursor: "pointer" }}
            >
              {migrating ? "Importing…" : "Import Static Posts"}
            </button>
            <Link
              href="/admin/blog/new"
              style={{ display: "inline-block", background: gold, color: "#0a0a0a", fontFamily: "var(--font-montserrat), sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", textDecoration: "none", padding: "10px 20px" }}
            >
              + New Post
            </Link>
          </div>
        </div>

        {loading ? (
          <p style={{ color: "#888", fontSize: 14 }}>Loading posts…</p>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#888" }}>
            <p style={{ marginBottom: 12 }}>No posts yet.</p>
            <p style={{ fontSize: 13 }}>Click &quot;Import Static Posts&quot; to load the existing articles, or create a new one.</p>
          </div>
        ) : (
          <div>
            {posts.map((post) => (
              <div
                key={post.slug}
                style={{ background: "#111", border: `1px solid ${border}`, padding: "24px 28px", marginBottom: 12, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24 }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: gold, marginBottom: 8 }}>
                    {formatDate(post.date)} · {post.readingTime} min read
                  </p>
                  <h2 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: 20, fontWeight: 700, color: "#f5f2ee", marginBottom: 8, lineHeight: 1.3 }}>
                    {post.title}
                  </h2>
                  <p style={{ fontSize: 13, color: "#888", lineHeight: 1.6, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                    {post.excerpt}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
                  <a
                    href={`/blog/${post.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: "inline-block", border: `1px solid ${border}`, color: "#888", fontFamily: "var(--font-montserrat), sans-serif", fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", textDecoration: "none", padding: "8px 14px" }}
                  >
                    View ↗
                  </a>
                  <Link
                    href={`/admin/blog/edit/${post.slug}`}
                    style={{ display: "inline-block", border: `1px solid ${gold}`, color: gold, fontFamily: "var(--font-montserrat), sans-serif", fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", textDecoration: "none", padding: "8px 14px" }}
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(post.slug, post.title)}
                    disabled={deleting === post.slug}
                    style={{ background: "none", border: "1px solid #3a2020", color: "#aa5555", fontFamily: "var(--font-montserrat), sans-serif", fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", padding: "8px 14px", cursor: "pointer" }}
                  >
                    {deleting === post.slug ? "…" : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
