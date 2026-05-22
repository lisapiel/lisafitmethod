import { getPublishedPhotoUrl } from "@/lib/mediaClient"
import { getBlogIndex } from "@/lib/blogClient"

const BASE = "https://lisafitmethod.com"

export const revalidate = 3600

export async function GET() {
  const [heroUrl, aboutUrl, bannerUrl, blogPosts] = await Promise.all([
    getPublishedPhotoUrl("hero"),
    getPublishedPhotoUrl("about_bio"),
    getPublishedPhotoUrl("banner"),
    getBlogIndex(),
  ])

  const images: { loc: string; pageUrl: string; title: string }[] = []

  const slotMap = [
    { slot: "hero", url: heroUrl, pageUrl: BASE, title: "Lisa McPherson — Lisa Fit Method" },
    { slot: "about_bio", url: aboutUrl, pageUrl: `${BASE}/about`, title: "Lisa McPherson — Certified Personal Trainer" },
    { slot: "banner", url: bannerUrl, pageUrl: `${BASE}/courses`, title: "Training Foundations — Lisa Fit Method" },
  ]

  for (const { url, pageUrl, title } of slotMap) {
    if (url) images.push({ loc: url, pageUrl, title })
  }

  for (const post of blogPosts) {
    if (post.coverImage) {
      images.push({
        loc: post.coverImage,
        pageUrl: `${BASE}/blog/${post.slug}`,
        title: post.title,
      })
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${images.map((img) => `  <url>
    <loc>${img.pageUrl}</loc>
    <image:image>
      <image:loc>${img.loc}</image:loc>
      <image:title>${escapeXml(img.title)}</image:title>
    </image:image>
  </url>`).join("\n")}
</urlset>`

  return new Response(xml, {
    headers: { "Content-Type": "application/xml" },
  })
}

function escapeXml(str: string) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;")
}
