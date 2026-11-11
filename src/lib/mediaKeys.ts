// Key-building and key-checking rules for the media bucket. Pure functions, so
// both the API routes and the unit tests use exactly the same rules.

export const MEDIA_BUCKET_DEFAULT = "amplify-lisafitmethod-lis-lisafitmediastorebucket2-kgef6soixdov"

export const MAX_KEY_LENGTH = 512

// Public objects (photos, videos, blog) are read straight from the bucket.
export function s3PublicUrl(bucket: string, region: string, key: string): string {
  const host = region === "us-east-1" ? `${bucket}.s3.amazonaws.com` : `${bucket}.s3.${region}.amazonaws.com`
  return `https://${host}/${key.split("/").map(encodeURIComponent).join("/")}`
}

// ── Admin uploads ───────────────────────────────────────────────────────────

export const ADMIN_UPLOAD_FOLDERS = {
  photos: { prefix: "media/photos/", typePrefix: "image/" },
  videos: { prefix: "media/videos/", typePrefix: "video/" },
  blog: { prefix: "media/blog/images/", typePrefix: "image/" },
  "blog-images": { prefix: "media/blog/images/", typePrefix: "image/" },
} as const

export type AdminUploadFolder = keyof typeof ADMIN_UPLOAD_FOLDERS

export const ADMIN_DELETE_PREFIXES = ["media/photos/", "media/videos/", "media/blog/"] as const

export function isAdminUploadFolder(v: unknown): v is AdminUploadFolder {
  return typeof v === "string" && Object.prototype.hasOwnProperty.call(ADMIN_UPLOAD_FOLDERS, v)
}

// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/

// A single file name: no folders, no traversal. Unsafe characters become "-".
// Returns null when nothing usable is left.
export function sanitizeFileName(name: unknown): string | null {
  if (typeof name !== "string") return null
  const trimmed = name.trim()
  if (!trimmed || trimmed.length > 200) return null
  if (trimmed.includes("/") || trimmed.includes("\\") || trimmed.includes("..") || CONTROL_CHARS.test(trimmed)) return null
  const cleaned = trimmed
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^[-.]+/, "")
  if (!cleaned) return null
  const dot = cleaned.lastIndexOf(".")
  const base = dot > 0 ? cleaned.slice(0, dot) : cleaned
  if (!/[A-Za-z0-9]/.test(base)) return null
  return cleaned.slice(0, 120)
}

export function isValidContentType(v: unknown): v is string {
  return typeof v === "string" && v.length <= 100 && /^[a-z]+\/[a-z0-9.+-]+$/i.test(v)
}

export type AdminUploadPlan = { key: string; contentType: string }

export function planAdminUpload(folder: unknown, fileName: unknown, contentType: unknown): AdminUploadPlan | { error: string } {
  if (!isAdminUploadFolder(folder)) return { error: "Unknown folder" }
  const rule = ADMIN_UPLOAD_FOLDERS[folder]
  const name = sanitizeFileName(fileName)
  if (!name) return { error: "Invalid file name" }
  if (!isValidContentType(contentType) || !contentType.toLowerCase().startsWith(rule.typePrefix)) {
    return { error: `This folder only takes ${rule.typePrefix.slice(0, -1)} files` }
  }
  return { key: rule.prefix + name, contentType: contentType.toLowerCase() }
}

// A safe object key: no traversal, empty segments, backslashes or control characters.
export function isSafeKey(key: unknown): key is string {
  if (typeof key !== "string" || key.length === 0 || key.length > MAX_KEY_LENGTH) return false
  if (key.includes("\\") || CONTROL_CHARS.test(key) || key.startsWith("/") || key.endsWith("/")) return false
  return key.split("/").every((seg) => seg.length > 0 && seg !== "." && seg !== "..")
}

export function isAdminDeletableKey(key: unknown): key is string {
  return isSafeKey(key) && ADMIN_DELETE_PREFIXES.some((p) => key.startsWith(p) && key.length > p.length)
}

// ── Blog JSON ───────────────────────────────────────────────────────────────

export function isValidBlogSlug(slug: unknown): slug is string {
  return typeof slug === "string" && slug.length > 0 && slug.length <= 120 && /^[a-z0-9][a-z0-9_-]*$/i.test(slug) && slug !== "index"
}

export function blogPostKey(slug: string): string {
  return `media/blog/${slug}.json`
}

export const BLOG_INDEX_KEY = "media/blog/index.json"

// ── Client coaching uploads ────────────────────────────────────────────────

// Each client's private files live in a folder named after their Cognito
// user id (the token's "sub"). It never changes and no two logins share one,
// unlike a folder built from the email address, where "a.b@x.com" and
// "a-b@x.com" would land in the same place.
export function uploadOwnerFolder(sub: unknown): string | null {
  if (typeof sub !== "string") return null
  const v = sub.trim().toLowerCase()
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(v) ? v : null
}

export const CLIENT_UPLOAD_KINDS = {
  "form-review": { prefix: "media/coaching-form-reviews/", typePrefix: "video/", maxBytes: 200 * 1024 * 1024 },
  "meal-photo": { prefix: "media/nutrition-messages/", typePrefix: "image/", maxBytes: 8 * 1024 * 1024 },
  "progress-photo": { prefix: "media/coaching-progress-photos/", typePrefix: "image/", maxBytes: 15 * 1024 * 1024 },
} as const

export type ClientUploadKind = keyof typeof CLIENT_UPLOAD_KINDS

export const CLIENT_UPLOAD_PREFIXES = Object.values(CLIENT_UPLOAD_KINDS).map((k) => k.prefix)

export function isClientUploadKind(v: unknown): v is ClientUploadKind {
  return typeof v === "string" && Object.prototype.hasOwnProperty.call(CLIENT_UPLOAD_KINDS, v)
}

export type ClientUploadPlan = { key: string; contentType: string; size: number }

export function planClientUpload(
  input: { kind: unknown; ext: unknown; contentType: unknown; size: unknown },
  ownerSub: string,
  now: number = Date.now(),
  rand: string = randomSuffix(),
): ClientUploadPlan | { error: string; status: number } {
  if (!isClientUploadKind(input.kind)) return { error: "Unknown upload type", status: 400 }
  const rule = CLIENT_UPLOAD_KINDS[input.kind]
  const folder = uploadOwnerFolder(ownerSub)
  if (!folder) return { error: "Unauthorized", status: 401 }
  const ext = typeof input.ext === "string" ? input.ext.trim().toLowerCase().replace(/^\./, "") : ""
  if (!/^[a-z0-9]{1,5}$/.test(ext)) return { error: "Invalid file extension", status: 400 }
  if (!isValidContentType(input.contentType) || !input.contentType.toLowerCase().startsWith(rule.typePrefix)) {
    return { error: input.kind === "form-review" ? "Please choose a video file." : "Please choose an image file.", status: 400 }
  }
  const size = typeof input.size === "number" ? input.size : NaN
  if (!Number.isInteger(size) || size <= 0) return { error: "Invalid file size", status: 400 }
  if (size > rule.maxBytes) {
    const mb = Math.round(rule.maxBytes / (1024 * 1024))
    return { error: input.kind === "form-review" ? `Videos need to be under ${mb} MB.` : `Photos need to be under ${mb} MB.`, status: 413 }
  }
  return { key: `${rule.prefix}${folder}/${now}-${rand}.${ext}`, contentType: input.contentType.toLowerCase(), size }
}

export function randomSuffix(): string {
  const bytes = new Uint8Array(6)
  globalThis.crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("") + Date.now().toString(36)
}

// A key under one of the client upload prefixes, one owner folder deep.
export function clientKeyOwnerSlug(key: unknown): string | null {
  if (!isSafeKey(key)) return null
  const prefix = CLIENT_UPLOAD_PREFIXES.find((p) => key.startsWith(p))
  if (!prefix) return null
  const parts = key.slice(prefix.length).split("/")
  return parts.length === 2 ? parts[0] : null
}

export function isClientUploadKey(key: unknown): key is string {
  return clientKeyOwnerSlug(key) != null
}

// True only when the key is in the caller's own folder.
export function isOwnClientKey(key: unknown, ownerSub: string, kind?: ClientUploadKind): key is string {
  const owner = clientKeyOwnerSlug(key)
  const folder = uploadOwnerFolder(ownerSub)
  if (!owner || !folder || owner !== folder) return false
  return kind ? (key as string).startsWith(CLIENT_UPLOAD_KINDS[kind].prefix) : true
}

export const MAX_READ_KEYS = 50

// Body of the read routes: { keys: string[] }. Null when malformed.
export function parseKeyList(body: unknown): string[] | null {
  if (!body || typeof body !== "object") return null
  const keys = (body as { keys?: unknown }).keys
  if (!Array.isArray(keys) || keys.length > MAX_READ_KEYS) return null
  if (!keys.every((k): k is string => typeof k === "string")) return null
  return Array.from(new Set(keys))
}
