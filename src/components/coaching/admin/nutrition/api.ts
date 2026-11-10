"use client"

import { fetchAuthSession } from "aws-amplify/auth"
import { adminJsonWith, REQUEST_TIMEOUT_MS, type ApiResult } from "./apiCore"

export type { ApiResult } from "./apiCore"
export { clientPath, errorText, REQUEST_TIMEOUT_MS } from "./apiCore"

async function defaultGetToken(forceRefresh = false): Promise<string | null> {
  try {
    const session = await fetchAuthSession(forceRefresh ? { forceRefresh: true } : undefined)
    return session.tokens?.accessToken?.toString() ?? null
  } catch {
    // fetchAuthSession throws on refresh-token network failure (seen on iOS
    // Safari when ITP has cleared storage, or during transient connectivity
    // loss). Convert to null so adminJson can surface the session error
    // through the normal non-ok result path rather than a generic throw.
    return null
  }
}

async function defaultDoFetch(path: string, init: RequestInit): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS)
  try {
    return await fetch(path, { ...init, signal: ctrl.signal })
  } finally {
    clearTimeout(timer)
  }
}

export async function adminJson<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<ApiResult<T>> {
  return adminJsonWith<T>({ getToken: defaultGetToken, doFetch: defaultDoFetch }, path, init)
}
