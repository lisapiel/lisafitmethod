import { s3PublicUrl } from "./mediaKeys"

// The image resizer (/_next/image) fetches only from these places. Everything
// comes from configuration, so a new media account needs new environment
// values, not code changes. `search: ""` refuses any address with a query
// string, which keeps signed (private) media links out: a resized copy is
// cached, and could otherwise outlive the signature that protected it.

export const RESIZE_QUALITY = 75

// Next.js's default device and image sizes. The resizer refuses other widths.
export const RESIZE_WIDTHS = [16, 32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840] as const

// Only the folder of public site photos. Client media (progress photos,
// form reviews, nutrition photos) lives in other folders of the same bucket.
export const PUBLIC_PHOTO_PATH = "/media/photos/**"

export type ImageSource = { protocol: "https"; hostname: string; pathname: string; search: "" }

export type ImageSourceConfig = {
  exerciseCdnUrl?: string
  mediaBucket: string
  region: string
}

// The exercise CDN as "https://host[/path]" without a trailing slash, or null
// when it isn't configured or isn't https.
export function exerciseCdnBase(url: string | undefined): string | null {
  if (!url) return null
  try {
    const u = new URL(url)
    if (u.protocol !== "https:" || u.search || u.hash || u.username || u.password) return null
    return `${u.origin}${u.pathname.replace(/\/+$/, "")}`
  } catch {
    return null
  }
}

export function allowedImageSources(config: ImageSourceConfig): ImageSource[] {
  const sources: ImageSource[] = []
  const cdn = exerciseCdnBase(config.exerciseCdnUrl)
  if (cdn) {
    const u = new URL(cdn)
    sources.push({ protocol: "https", hostname: u.hostname, pathname: `${u.pathname.replace(/\/$/, "")}/**`, search: "" })
  }
  const media = new URL(s3PublicUrl(config.mediaBucket, config.region, "x"))
  sources.push({ protocol: "https", hostname: media.hostname, pathname: PUBLIC_PHOTO_PATH, search: "" })
  return sources
}
