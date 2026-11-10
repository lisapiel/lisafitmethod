// Pure, testable core of the coaching Admin fetch path. No framework,
// Amplify, or DOM dependency so it runs under `node:test`. The thin
// wrapper in ./api supplies the real Amplify `fetchAuthSession` token
// getter and the real `fetch` with timeout. This split was introduced
// after the iPhone-Safari "Couldn't reach the server. Nothing was changed."
// report so every infra failure (session expiry, timeout, offline, 401)
// has a locked-in behaviour and a specific message the coach can act on.

export type ApiResult<T> = { ok: boolean; status: number; data: T | null }

export const REQUEST_TIMEOUT_MS = 15_000

export type AdminJsonDeps = {
  getToken: (forceRefresh?: boolean) => Promise<string | null>
  doFetch: (path: string, init: RequestInit) => Promise<Response>
}

export async function adminJsonWith<T>(
  deps: AdminJsonDeps,
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<ApiResult<T>> {
  let token = await deps.getToken()
  if (!token) {
    token = await deps.getToken(true)
    if (!token) {
      return { ok: false, status: 0, data: { error: "Your session has expired. Sign in again to continue." } as T }
    }
  }

  const method = init.method ?? "GET"
  const requestInit: RequestInit = {
    method,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  }

  let res: Response
  try {
    res = await deps.doFetch(path, requestInit)
  } catch (err) {
    if ((err as Error)?.name === "AbortError") {
      return { ok: false, status: 0, data: { error: "The server took too long to respond. Check your connection and try again." } as T }
    }
    return { ok: false, status: 0, data: { error: "Couldn't reach the server. Check your connection and try again." } as T }
  }

  // 401 may be a transient stale-token issue. Force-refresh once and retry
  // with the fresh token before giving up. Mirrors the loader path in
  // useAdminFetch so GET and mutation requests recover the same way.
  if (res.status === 401) {
    const fresh = await deps.getToken(true)
    if (fresh && fresh !== token) {
      try {
        const retryInit: RequestInit = { ...requestInit, headers: { ...requestInit.headers, Authorization: `Bearer ${fresh}` } }
        res = await deps.doFetch(path, retryInit)
      } catch (err) {
        if ((err as Error)?.name === "AbortError") {
          return { ok: false, status: 0, data: { error: "The server took too long to respond. Check your connection and try again." } as T }
        }
        return { ok: false, status: 0, data: { error: "Couldn't reach the server. Check your connection and try again." } as T }
      }
    }
  }

  let data: T | null = null
  try {
    data = (await res.json()) as T
  } catch {
    data = null
  }
  return { ok: res.ok, status: res.status, data }
}

export function clientPath(email: string, suffix = ""): string {
  return `/api/admin/coaching/clients/${encodeURIComponent(email)}${suffix}`
}

export function errorText(data: unknown, fallback: string): string {
  if (data && typeof data === "object" && "error" in data && typeof (data as { error: unknown }).error === "string") {
    return (data as { error: string }).error
  }
  return fallback
}
