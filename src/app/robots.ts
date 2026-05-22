import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/training-foundations", "/api/"],
      },
    ],
    sitemap: [
      "https://lisafitmethod.com/sitemap.xml",
      "https://lisafitmethod.com/image-sitemap.xml",
      "https://lisafitmethod.com/video-sitemap.xml",
    ],
  }
}
