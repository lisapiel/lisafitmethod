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

// Admin-only: uploads a post JSON and updates the index
export async function saveBlogPost(post: BlogPost): Promise<void> {
  const { uploadData } = await import("aws-amplify/storage")

  await uploadData({
    path: `media/blog/${post.slug}.json`,
    data: JSON.stringify(post),
    options: { contentType: "application/json" },
  }).result

  const currentIndex = await getBlogIndex()
  const meta: BlogPostMeta = {
    slug: post.slug,
    title: post.title,
    date: post.date,
    excerpt: post.excerpt,
    readingTime: post.readingTime,
    ...(post.coverImage ? { coverImage: post.coverImage } : {}),
  }
  const existing = currentIndex.findIndex((p) => p.slug === post.slug)
  const updated = existing >= 0
    ? currentIndex.map((p, i) => (i === existing ? meta : p))
    : [meta, ...currentIndex]

  updated.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  await uploadData({
    path: "media/blog/index.json",
    data: JSON.stringify({ posts: updated }),
    options: { contentType: "application/json" },
  }).result
}

// Admin-only: removes a post and updates the index
export async function deleteBlogPost(slug: string): Promise<void> {
  const { remove } = await import("aws-amplify/storage")
  const { uploadData } = await import("aws-amplify/storage")

  try {
    await remove({ path: `media/blog/${slug}.json` })
  } catch {
    // file may not exist; index update still proceeds
  }

  const currentIndex = await getBlogIndex()
  const updated = currentIndex.filter((p) => p.slug !== slug)
  await uploadData({
    path: "media/blog/index.json",
    data: JSON.stringify({ posts: updated }),
    options: { contentType: "application/json" },
  }).result
}

// Admin-only: uploads all static posts to S3 (one-time migration)
export async function migrateStaticPosts(): Promise<void> {
  for (const post of staticPosts) {
    await saveBlogPost(post)
  }
}
