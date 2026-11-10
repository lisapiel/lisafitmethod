import { posts as staticPosts } from "@/lib/posts"

export type BlogPost = {
  slug: string
  title: string
  date: string
  excerpt: string
  readingTime: number
  coverImage?: string
  sections: { heading?: string; body: string }[]
}

export type BlogIndex = {
  posts: BlogPostMeta[]
}

export type BlogPostMeta = {
  slug: string
  title: string
  date: string
  excerpt: string
  readingTime: number
  coverImage?: string
}

const S3_BASE = "https://amplify-lisafitmethod-lis-lisafitmediastorebucket2-kgef6soixdov.s3.us-east-2.amazonaws.com"
const INDEX_URL = `${S3_BASE}/media/blog/index.json`

function staticIndex(): BlogPostMeta[] {
  return staticPosts.map(({ slug, title, date, excerpt, readingTime }) => ({
    slug, title, date, excerpt, readingTime,
  }))
}

export async function getBlogIndex(): Promise<BlogPostMeta[]> {
  try {
    const res = await fetch(INDEX_URL, { next: { revalidate: 60 } })
    if (!res.ok) return staticIndex()
    const data: BlogIndex = await res.json()
    return data.posts ?? staticIndex()
  } catch {
    return staticIndex()
  }
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    const res = await fetch(`${S3_BASE}/media/blog/${slug}.json`, { next: { revalidate: 60 } })
    if (!res.ok) {
      const fallback = staticPosts.find((p) => p.slug === slug)
      return fallback ?? null
    }
    return await res.json()
  } catch {
    return staticPosts.find((p) => p.slug === slug) ?? null
  }
}

// Admin-only: the server writes the post JSON and updates the index.
export async function saveBlogPost(post: BlogPost): Promise<void> {
  const { adminJson } = await import("@/lib/mediaUpload.client")
  await adminJson("/api/admin/blog/save", { post })
}

// Admin-only: the server removes the post and updates the index.
export async function deleteBlogPost(slug: string): Promise<void> {
  const { adminJson } = await import("@/lib/mediaUpload.client")
  await adminJson("/api/admin/blog/save", { slug }, "DELETE")
}

// Admin-only: uploads all static posts to S3 (one-time migration)
export async function migrateStaticPosts(): Promise<void> {
  for (const post of staticPosts) {
    await saveBlogPost(post)
  }
}
