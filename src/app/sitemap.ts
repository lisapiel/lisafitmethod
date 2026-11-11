import type { MetadataRoute } from "next"
import { getBlogIndex } from "@/lib/blogClient"

const BASE = "https://lisafitmethod.com"

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // lastModified is omitted for pages whose content is driven by S3 siteSettings
  // (homepage, about, courses) — the settings can change via the admin panel
  // without a git commit, so a git-derived date would be inaccurate.
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE,                                                 changeFrequency: "weekly",  priority: 1   },
    { url: `${BASE}/about`,                                      changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/courses`,                                    changeFrequency: "weekly",  priority: 0.9 },
    { url: `${BASE}/coaching`,  lastModified: new Date("2026-10-21"), changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/blog`,      lastModified: new Date("2026-10-21"), changeFrequency: "weekly",  priority: 0.8 },
    { url: `${BASE}/faq`,       lastModified: new Date("2026-10-21"), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/nutrition`, lastModified: new Date("2026-10-21"), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/free-guide`,             lastModified: new Date("2026-10-21"), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/free-guide-nutrition`,   lastModified: new Date("2026-10-21"), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/contact`,   lastModified: new Date("2026-10-21"), changeFrequency: "yearly",  priority: 0.5 },
    { url: `${BASE}/privacy`,   lastModified: new Date("2026-08-12"), changeFrequency: "yearly",  priority: 0.3 },
    { url: `${BASE}/terms`,     lastModified: new Date("2026-11-10"), changeFrequency: "yearly",  priority: 0.3 },
    { url: `${BASE}/licensing`, lastModified: new Date("2026-08-12"), changeFrequency: "yearly",  priority: 0.3 },
  ]

  const posts = await getBlogIndex()
  const blogPages: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${BASE}/blog/${p.slug}`,
    lastModified: new Date(p.date),
    changeFrequency: "monthly",
    priority: 0.7,
  }))

  return [...staticPages, ...blogPages]
}
