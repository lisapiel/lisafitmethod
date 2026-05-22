import type { MetadataRoute } from "next"
import { posts } from "@/lib/posts"

const BASE = "https://lisafitmethod.com"

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    { url: BASE, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 1 },
    { url: `${BASE}/about`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${BASE}/courses`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.9 },
    { url: `${BASE}/coaching`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${BASE}/blog`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
    { url: `${BASE}/contact`, lastModified: new Date(), changeFrequency: "yearly" as const, priority: 0.5 },
  ]

  const blogPages = posts.map((p) => ({
    url: `${BASE}/blog/${p.slug}`,
    lastModified: new Date(p.date),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }))

  return [...staticPages, ...blogPages]
}
