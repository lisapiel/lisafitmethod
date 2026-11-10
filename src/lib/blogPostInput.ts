import { isValidBlogSlug } from "@/lib/mediaKeys"
import type { BlogPost, BlogPostMeta } from "@/lib/blogClient"

const MAX_SECTIONS = 200
const MAX_TEXT = 100_000

function str(v: unknown, max: number): string | null {
  return typeof v === "string" && v.length <= max ? v : null
}

// Rebuilds a post from the request body with only the fields a post has.
export function parseBlogPost(raw: unknown): BlogPost | null {
  if (!raw || typeof raw !== "object") return null
  const p = raw as Record<string, unknown>
  if (!isValidBlogSlug(p.slug)) return null
  const title = str(p.title, 500)
  const date = str(p.date, 40)
  const excerpt = str(p.excerpt, 5000)
  const readingTime = typeof p.readingTime === "number" && Number.isFinite(p.readingTime) && p.readingTime >= 0 ? p.readingTime : null
  if (!title || !date || excerpt == null || readingTime == null) return null
  if (Number.isNaN(new Date(date).getTime())) return null
  let coverImage: string | undefined
  if (p.coverImage !== undefined && p.coverImage !== "") {
    const c = str(p.coverImage, 1024)
    if (!c || !/^https:\/\//.test(c)) return null
    coverImage = c
  }
  if (!Array.isArray(p.sections) || p.sections.length > MAX_SECTIONS) return null
  const sections: BlogPost["sections"] = []
  for (const s of p.sections as unknown[]) {
    if (!s || typeof s !== "object") return null
    const sec = s as Record<string, unknown>
    const body = str(sec.body, MAX_TEXT)
    if (body == null) return null
    const heading = sec.heading === undefined ? undefined : str(sec.heading, 500)
    if (heading === null) return null
    sections.push({ ...(heading ? { heading } : {}), body })
  }
  return { slug: p.slug, title, date, excerpt, readingTime, ...(coverImage ? { coverImage } : {}), sections }
}

export function blogMeta(post: BlogPost): BlogPostMeta {
  return {
    slug: post.slug,
    title: post.title,
    date: post.date,
    excerpt: post.excerpt,
    readingTime: post.readingTime,
    ...(post.coverImage ? { coverImage: post.coverImage } : {}),
  }
}

export function upsertIndex(index: BlogPostMeta[], meta: BlogPostMeta): BlogPostMeta[] {
  const existing = index.findIndex((p) => p.slug === meta.slug)
  const updated = existing >= 0 ? index.map((p, i) => (i === existing ? meta : p)) : [meta, ...index]
  return updated.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}
