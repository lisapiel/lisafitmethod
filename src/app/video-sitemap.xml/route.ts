import { getPublishedVideoUrl } from "@/lib/mediaClient"

const BASE = "https://lisafitmethod.com"

export const revalidate = 3600

export async function GET() {
  // Only include the public-facing trailer — module videos are behind auth
  const trailerUrl = await getPublishedVideoUrl("lp_trailer")

  const videos: { pageUrl: string; videoUrl: string; title: string; description: string }[] = []

  if (trailerUrl) {
    videos.push({
      pageUrl: `${BASE}/courses`,
      videoUrl: trailerUrl,
      title: "Training Foundations — Program Overview",
      description: "A 4-week beginner strength training program for women built around movement fundamentals. Three days a week. Warm-up, working sets, cool-down. No guesswork.",
    })
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${videos.map((v) => `  <url>
    <loc>${v.pageUrl}</loc>
    <video:video>
      <video:thumbnail_loc>${BASE}/hero.png</video:thumbnail_loc>
      <video:title>${escapeXml(v.title)}</video:title>
      <video:description>${escapeXml(v.description)}</video:description>
      <video:content_loc>${escapeXml(v.videoUrl)}</video:content_loc>
      <video:family_friendly>yes</video:family_friendly>
      <video:requires_subscription>no</video:requires_subscription>
      <video:uploader info="${BASE}/about">Lisa McPherson</video:uploader>
    </video:video>
  </url>`).join("\n")}
</urlset>`

  return new Response(xml, {
    headers: { "Content-Type": "application/xml" },
  })
}

function escapeXml(str: string) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;")
}
