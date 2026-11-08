"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { fetchAuthSession } from "aws-amplify/auth"

const TIMEOUT_MS = 15_000
const FRESH_MS = 20_000

type Entry = { data: unknown; at: number }
const cache = new Map<string, Entry>()
const inflight = new Map<string, Promise<unknown>>()
const listeners = new Map<string, Set<() => void>>()

export class AdminFetchError extends Error {
  constructor(message: string, readonly status: number | null) { super(message) }
}

async function token(forceRefresh = false) {
  const session = await fetchAuthSession(forceRefresh ? { forceRefresh: true } : undefined)
  return session.tokens?.accessToken?.toString() ?? null
}

async function request(path: string): Promise<unknown> {
  let t = await token()
  if (!t) t = await token(true)
  if (!t) throw new AdminFetchError("Your session has expired. Sign in again to continue.", 401)
  const attempt = async (bearer: string) => {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
    try {
      return await fetch(path, { headers: { Authorization: `Bearer ${bearer}` }, signal: ctrl.signal, cache: "no-store" })
    } finally {
      clearTimeout(timer)
    }
  }
  let res: Response
  try {
    res = await attempt(t)
    if (res.status === 401) {
      const fresh = await token(true)
      if (fresh) res = await attempt(fresh)
    }
  } catch (err) {
    if ((err as Error).name === "AbortError") throw new AdminFetchError("This is taking longer than usual. Check your connection and try again.", null)
    throw new AdminFetchError("Couldn't reach the server. Check your connection and try again.", null)
  }
  if (res.status === 401) throw new AdminFetchError("Your session has expired. Sign in again to continue.", 401)
  if (!res.ok) throw new AdminFetchError("Something went wrong loading this page. Try again in a moment.", res.status)
  return res.json()
}

export function loadAdmin<T>(path: string): Promise<T> {
  const running = inflight.get(path)
  if (running) return running as Promise<T>
  const p = request(path)
    .then((data) => {
      cache.set(path, { data, at: Date.now() })
      listeners.get(path)?.forEach((fn) => fn())
      return data
    })
    .finally(() => inflight.delete(path))
  inflight.set(path, p)
  return p as Promise<T>
}

export function invalidateAdmin(path: string) {
  const e = cache.get(path)
  if (e) e.at = 0
}

export function useAdminFetch<T>(path: string, opts: { pollMs?: number } = {}) {
  const cached = cache.get(path)
  const [data, setData] = useState<T | null>((cached?.data as T) ?? null)
  const [error, setError] = useState<AdminFetchError | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const mounted = useRef(true)

  const reload = useCallback(async () => {
    setRefreshing(true)
    try {
      const d = await loadAdmin<T>(path)
      if (!mounted.current) return
      setData(d)
      setError(null)
    } catch (err) {
      if (!mounted.current) return
      setError(err instanceof AdminFetchError ? err : new AdminFetchError("Something went wrong loading this page.", null))
    } finally {
      if (mounted.current) setRefreshing(false)
    }
  }, [path])

  useEffect(() => {
    mounted.current = true
    const sync = () => {
      const e = cache.get(path)
      if (e && mounted.current) setData(e.data as T)
    }
    if (!listeners.has(path)) listeners.set(path, new Set())
    listeners.get(path)!.add(sync)
    const entry = cache.get(path)
    if (!entry || Date.now() - entry.at > FRESH_MS) reload()
    const onVisible = () => { if (document.visibilityState === "visible") reload() }
    document.addEventListener("visibilitychange", onVisible)
    const timer = opts.pollMs ? setInterval(() => { if (document.visibilityState === "visible") reload() }, opts.pollMs) : null
    return () => {
      mounted.current = false
      listeners.get(path)?.delete(sync)
      document.removeEventListener("visibilitychange", onVisible)
      if (timer) clearInterval(timer)
    }
  }, [path, reload, opts.pollMs])

  return { data, error, loading: data === null && error === null, refreshing, reload }
}
