import { NextRequest, NextResponse } from "next/server"
import { verifyAdminRequest } from "@/lib/adminAuth"
import { posts as staticPosts } from "@/lib/posts"
import type { BlogPostMeta } from "@/lib/blogClient"
import { blogMeta, parseBlogPost, upsertIndex } from "@/lib/blogPostInput"
import { BLOG_INDEX_KEY, blogPostKey, isValidBlogSlug } from "@/lib/mediaKeys"
import { deleteMediaObject, publicMediaUrl, putMediaObject } from "@/lib/mediaStorage"

export const dynamic = "force-dynamic"

class IndexUnavailable extends Error {}

// Fresh read of the public index. A missing index starts from the built-in
// posts, as before; any other failure stops the save so the index is never
// overwritten from a stale or partial copy.
async function currentIndex(): Promise<BlogPostMeta[]> {
  let res: Response
  try {
    res = await fetch(publicMediaUrl(BLOG_INDEX_KEY), { cache: "no-store" })
  } catch {
    throw new IndexUnavailable()
  }
  if (res.status === 403 || res.status === 404) {
    return staticPosts.map(({ slug, title, date, excerpt, readingTime }) => ({ slug, title, date, excerpt, readingTime }))
  }
  if (!res.ok) throw new IndexUnavailable()
  const data = await res.json().catch(() => null) as { posts?: BlogPostMeta[] } | null
  if (!data || !Array.isArray(data.posts)) throw new IndexUnavailable()
  return data.posts
}

async function writeIndex(posts: BlogPostMeta[]): Promise<void> {
  await putMediaObject(BLOG_INDEX_KEY, JSON.stringify({ posts }), "application/json")
}

function failure(err: unknown, what: string) {
  if (err instanceof IndexUnavailable) {
    return NextResponse.json({ error: "The blog index could not be read, so nothing was changed. Please try again." }, { status: 502 })
  }
  console.error(`[admin/blog/save] ${what} failed:`, err instanceof Error ? err.name : "unknown")
  return NextResponse.json({ error: `${what} failed` }, { status: 502 })
}

export async function POST(req: NextRequest) {
  const admin = await verifyAdminRequest(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null) as { post?: unknown } | null
  const post = parseBlogPost(body?.post)
  if (!post) return NextResponse.json({ error: "Invalid post" }, { status: 400 })

  try {
    const index = await currentIndex()
    await putMediaObject(blogPostKey(post.slug), JSON.stringify(post), "application/json")
    await writeIndex(upsertIndex(index, blogMeta(post)))
    return NextResponse.json({ ok: true })
  } catch (err) {
    return failure(err, "Save")
  }
}

export async function DELETE(req: NextRequest) {
  const admin = await verifyAdminRequest(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null) as { slug?: unknown } | null
  const slug = body?.slug
  if (!isValidBlogSlug(slug)) return NextResponse.json({ error: "Invalid slug" }, { status: 400 })

  try {
    const index = await currentIndex()
    await deleteMediaObject(blogPostKey(slug))
    await writeIndex(index.filter((p) => p.slug !== slug))
    return NextResponse.json({ ok: true })
  } catch (err) {
    return failure(err, "Delete")
  }
}
