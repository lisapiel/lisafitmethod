import { isSafeKey } from "@/lib/mediaKeys"

// MediaAsset as deployed (amplify/data/resource.ts). Only these fields are
// ever passed to AppSync.
export type MediaAssetType = "VIDEO" | "PHOTO"

export type MediaAsset = {
  id: string
  type: MediaAssetType | null
  title: string
  s3Key: string
  url: string | null
  assignedTo: string
  isPublished: boolean
  fileSize: number | null
  mimeType: string | null
}

export const MEDIA_ASSET_SELECTION = "id type title s3Key url assignedTo isPublished fileSize mimeType"

export type CatalogAction = "create" | "update" | "delete"

export type CatalogRequest =
  | { action: "create"; input: Record<string, string | number | boolean> }
  | { action: "update"; input: Record<string, string | number | boolean> }
  | { action: "delete"; input: { id: string } }

const MEDIA_KEY_PREFIXES = ["media/photos/", "media/videos/"]

type Parsed = { ok: true; value: string | number | boolean } | { ok: false }

const FIELD_RULES: Record<string, (v: unknown) => Parsed> = {
  type: (v) => (v === "VIDEO" || v === "PHOTO" ? { ok: true, value: v } : { ok: false }),
  title: (v) => (typeof v === "string" && v.trim().length > 0 && v.length <= 300 ? { ok: true, value: v } : { ok: false }),
  s3Key: (v) => (isSafeKey(v) && MEDIA_KEY_PREFIXES.some((p) => v.startsWith(p)) ? { ok: true, value: v } : { ok: false }),
  url: (v) => (typeof v === "string" && v.length <= 1024 && /^https:\/\//.test(v) ? { ok: true, value: v } : { ok: false }),
  assignedTo: (v) => (typeof v === "string" && /^[A-Za-z0-9_.-]{1,120}$/.test(v) ? { ok: true, value: v } : { ok: false }),
  isPublished: (v) => (typeof v === "boolean" ? { ok: true, value: v } : { ok: false }),
  fileSize: (v) => (typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 2 ** 31 - 1 ? { ok: true, value: v } : { ok: false }),
  mimeType: (v) => (typeof v === "string" && v.length <= 100 ? { ok: true, value: v } : { ok: false }),
}

const REQUIRED_ON_CREATE = ["type", "title", "s3Key", "assignedTo", "isPublished"]

function isId(v: unknown): v is string {
  return typeof v === "string" && /^[A-Za-z0-9-]{1,64}$/.test(v)
}

// Keeps only known MediaAsset fields and checks each one. Unknown fields are dropped.
export function parseCatalogRequest(body: unknown): CatalogRequest | { error: string } {
  if (!body || typeof body !== "object") return { error: "Invalid JSON body" }
  const { action, input } = body as { action?: unknown; input?: unknown }
  if (action !== "create" && action !== "update" && action !== "delete") return { error: "Unknown action" }
  if (!input || typeof input !== "object" || Array.isArray(input)) return { error: "input must be an object" }
  const raw = input as Record<string, unknown>

  if (action === "delete") {
    return isId(raw.id) ? { action, input: { id: raw.id } } : { error: "id is required" }
  }

  const out: Record<string, string | number | boolean> = {}
  for (const [field, rule] of Object.entries(FIELD_RULES)) {
    if (raw[field] === undefined) continue
    const parsed = rule(raw[field])
    if (!parsed.ok) return { error: `Invalid ${field}` }
    out[field] = parsed.value
  }

  if (action === "create") {
    const missing = REQUIRED_ON_CREATE.find((f) => out[f] === undefined)
    if (missing) return { error: `${missing} is required` }
    return { action, input: out }
  }

  if (!isId(raw.id)) return { error: "id is required" }
  if (Object.keys(out).length === 0) return { error: "Nothing to update" }
  return { action, input: { id: raw.id, ...out } }
}

export function catalogMutation(action: CatalogAction): string {
  const name = action === "create" ? "createMediaAsset" : action === "update" ? "updateMediaAsset" : "deleteMediaAsset"
  const inputType = action === "create" ? "CreateMediaAssetInput" : action === "update" ? "UpdateMediaAssetInput" : "DeleteMediaAssetInput"
  return `mutation Catalog($input: ${inputType}!) { ${name}(input: $input) { ${MEDIA_ASSET_SELECTION} } }`
}

export function catalogResultField(action: CatalogAction): string {
  return action === "create" ? "createMediaAsset" : action === "update" ? "updateMediaAsset" : "deleteMediaAsset"
}
