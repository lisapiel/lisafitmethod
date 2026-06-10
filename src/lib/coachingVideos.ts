const CDN_BASE = process.env.AMBRISA_CDN_URL ?? ""

export function getVideoUrl(s3Key: string): string {
  const encoded = s3Key.split("/").map(encodeURIComponent).join("/")
  return `${CDN_BASE}/${encoded}`
}

export function getThumbnailUrl(s3Key: string): string {
  const jpgKey = s3Key.replace(/\.mp4$/i, ".jpg")
  const encoded = jpgKey.split("/").map(encodeURIComponent).join("/")
  return `${CDN_BASE}/${encoded}`
}
