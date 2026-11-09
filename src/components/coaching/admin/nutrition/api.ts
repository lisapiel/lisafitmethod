"use client"

import { fetchAuthSession } from "aws-amplify/auth"

export type ApiResult<T> = { ok: boolean; status: number; data: T | null }

export async function adminJson<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<ApiResult<T>> {
  const session = await fetchAuthSession()
  const token = session.tokens?.accessToken?.toString()
  const res = await fetch(path, {
    method: init.method ?? "GET",
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token ?? ""}`,
      ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  })
  let data: T | null = null
  try { data = (await res.json()) as T } catch { data = null }
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
