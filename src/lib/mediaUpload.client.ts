import { fetchAuthSession } from "aws-amplify/auth"
import type { AdminUploadFolder, ClientUploadKind } from "@/lib/mediaKeys"

// Browser-only helpers (no "use client" so blogClient can import it lazily).
// Server-authorized media: ask our API for a signed URL,
// then send the file straight to S3 with it.

export type SignedUpload = { key: string; url: string; headers: Record<string, string>; publicUrl?: string }

async function errorFrom(res: Response): Promise<Error> {
  const data = await res.json().catch(() => ({} as { error?: string })) as { error?: string }
  return new Error(data.error || `Request failed (error ${res.status})`)
}

export async function adminAccessToken(): Promise<string> {
  const session = await fetchAuthSession()
  const token = session.tokens?.accessToken?.toString()
  if (!token) throw new Error("Not signed in")
  return token
}

export async function adminFetch(path: string, body: unknown, method: "POST" | "DELETE" = "POST"): Promise<Response> {
  const token = await adminAccessToken()
  return fetch(path, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  })
}

export async function adminJson<T>(path: string, body: unknown, method: "POST" | "DELETE" = "POST"): Promise<T> {
  const res = await adminFetch(path, body, method)
  if (!res.ok) throw await errorFrom(res)
  return await res.json() as T
}

export async function requestAdminUpload(folder: AdminUploadFolder, fileName: string, contentType: string): Promise<SignedUpload> {
  return adminJson<SignedUpload>("/api/admin/media/upload-url", { folder, fileName, contentType })
}

export async function requestClientUpload(kind: ClientUploadKind, ext: string, contentType: string, size: number): Promise<SignedUpload> {
  const res = await fetch("/api/coaching/uploads/url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, ext, contentType, size }),
  })
  if (!res.ok) throw await errorFrom(res)
  return await res.json() as SignedUpload
}

// PUT the file to a presigned URL. XMLHttpRequest so we can report progress.
// The browser sets Content-Length itself and refuses to let scripts set it.
export function putToSignedUrl(
  upload: SignedUpload,
  file: Blob,
  onProgress?: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("PUT", upload.url)
    for (const [name, value] of Object.entries(upload.headers)) {
      if (name.toLowerCase() !== "content-length") xhr.setRequestHeader(name, value)
    }
    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && e.total > 0) onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (error ${xhr.status})`)))
    xhr.onerror = () => reject(new Error("Upload failed. Check your connection and try again."))
    xhr.onabort = () => reject(new Error("Upload cancelled"))
    xhr.send(file)
  })
}

// ── Private reads ──────────────────────────────────────────────────────────

export type MediaViewer = "admin" | "client"

type CachedUrl = { url: string; expiresAt: number }
const urlCache = new Map<string, CachedUrl>()
const pending = new Map<MediaViewer, Map<string, Array<(url: string | null) => void>>>()
const timers = new Map<MediaViewer, ReturnType<typeof setTimeout>>()

async function fetchReadUrls(viewer: MediaViewer, keys: string[]): Promise<{ urls: Record<string, string>; expiresIn: number }> {
  const path = viewer === "admin" ? "/api/admin/media/read" : "/api/coaching/uploads/read"
  const res = viewer === "admin"
    ? await adminFetch(path, { keys })
    : await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ keys }) })
  if (!res.ok) throw await errorFrom(res)
  return await res.json() as { urls: Record<string, string>; expiresIn: number }
}

async function flush(viewer: MediaViewer) {
  timers.delete(viewer)
  const waiting = pending.get(viewer)
  pending.delete(viewer)
  if (!waiting) return
  const keys = Array.from(waiting.keys())
  for (let i = 0; i < keys.length; i += 50) {
    const batch = keys.slice(i, i + 50)
    try {
      const { urls, expiresIn } = await fetchReadUrls(viewer, batch)
      // Refresh well before the signed URL itself runs out.
      const expiresAt = Date.now() + Math.max(60, expiresIn - 300) * 1000
      for (const key of batch) {
        const url = urls[key] ?? null
        if (url) urlCache.set(`${viewer}:${key}`, { url, expiresAt })
        for (const cb of waiting.get(key) ?? []) cb(url)
      }
    } catch {
      for (const key of batch) for (const cb of waiting.get(key) ?? []) cb(null)
    }
  }
}

// One request for every key asked for in the same moment.
export function signedReadUrl(viewer: MediaViewer, key: string): Promise<string | null> {
  const cached = urlCache.get(`${viewer}:${key}`)
  if (cached && cached.expiresAt > Date.now()) return Promise.resolve(cached.url)
  return new Promise((resolve) => {
    let waiting = pending.get(viewer)
    if (!waiting) { waiting = new Map(); pending.set(viewer, waiting) }
    const list = waiting.get(key) ?? []
    list.push(resolve)
    waiting.set(key, list)
    if (!timers.has(viewer)) timers.set(viewer, setTimeout(() => { void flush(viewer) }, 15))
  })
}
