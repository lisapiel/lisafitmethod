// Behaviour tests for adminJsonWith — the pure core of the coaching Admin
// mutation path. Guards against the iPhone Safari regression where a
// transient auth or network failure surfaced as a generic "Couldn't reach
// the server. Nothing was changed." message, giving the coach no useful
// signal to act on. Also locks in the one-shot 401 refresh-retry.

import { test } from "node:test"
import assert from "node:assert/strict"
import { adminJsonWith, type AdminJsonDeps } from "./apiCore"

const okResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } })

type FetchCall = { path: string; method: string; headers: Record<string, string>; body: string | null }

function recordingFetch(impl: (call: FetchCall) => Promise<Response> | Response) {
  const calls: FetchCall[] = []
  const doFetch: AdminJsonDeps["doFetch"] = async (path, init) => {
    const headers = Object.fromEntries(Object.entries((init.headers ?? {}) as Record<string, string>))
    const call: FetchCall = {
      path, method: (init.method ?? "GET"),
      headers, body: typeof init.body === "string" ? init.body : null,
    }
    calls.push(call)
    const out = await impl(call)
    return out
  }
  return { doFetch, calls }
}

test("success with a valid token returns ok=true and parsed body", async () => {
  const { doFetch, calls } = recordingFetch(() => okResponse({ ok: true, customMacros: { calories: 2500 } }))
  const deps: AdminJsonDeps = { getToken: async () => "tok-1", doFetch }
  const res = await adminJsonWith<{ ok?: boolean; customMacros?: { calories: number } }>(
    deps, "/api/admin/coaching/clients/x@y.com/nutrition",
    { method: "PATCH", body: { customMacros: { calories: 2500 }, reason: "test" } },
  )
  assert.equal(res.ok, true)
  assert.equal(res.status, 200)
  assert.equal(res.data?.customMacros?.calories, 2500)
  assert.equal(calls.length, 1)
  assert.equal(calls[0].method, "PATCH")
  assert.equal(calls[0].headers.Authorization, "Bearer tok-1")
  assert.equal(calls[0].headers["Content-Type"], "application/json")
  assert.ok(calls[0].body?.includes("customMacros"))
})

test("no token after a forced refresh returns a session-expired result (status 0), not a throw", async () => {
  const { doFetch, calls } = recordingFetch(() => okResponse({ ok: true }))
  const deps: AdminJsonDeps = { getToken: async () => null, doFetch }
  const res = await adminJsonWith<{ error?: string }>(deps, "/api/admin/coaching/clients/x@y.com/nutrition", { method: "PATCH", body: {} })
  assert.equal(res.ok, false)
  assert.equal(res.status, 0)
  assert.equal(res.data?.error, "Your session has expired. Sign in again to continue.")
  assert.equal(calls.length, 0, "fetch must not run when no token is available")
})

test("getToken retries once with forceRefresh when the first attempt returns null", async () => {
  let attempts = 0
  const getToken: AdminJsonDeps["getToken"] = async (force) => {
    attempts++
    return force ? "fresh" : null
  }
  const { doFetch, calls } = recordingFetch(() => okResponse({ ok: true }))
  const res = await adminJsonWith<{ ok?: boolean }>({ getToken, doFetch }, "/x", { method: "PATCH", body: {} })
  assert.equal(res.ok, true)
  assert.equal(attempts, 2)
  assert.equal(calls[0].headers.Authorization, "Bearer fresh")
})

test("fetch AbortError surfaces as a timeout result, not 'Couldn't reach the server'", async () => {
  const doFetch: AdminJsonDeps["doFetch"] = async () => {
    const err = new Error("aborted") as Error & { name: string }
    err.name = "AbortError"
    throw err
  }
  const res = await adminJsonWith<{ error?: string }>({ getToken: async () => "tok", doFetch }, "/x", { method: "PATCH", body: {} })
  assert.equal(res.ok, false)
  assert.equal(res.status, 0)
  assert.match(res.data?.error ?? "", /took too long/i)
})

test("other fetch throws surface as a network-error result", async () => {
  const doFetch: AdminJsonDeps["doFetch"] = async () => { throw new TypeError("Failed to fetch") }
  const res = await adminJsonWith<{ error?: string }>({ getToken: async () => "tok", doFetch }, "/x", { method: "PATCH", body: {} })
  assert.equal(res.ok, false)
  assert.equal(res.status, 0)
  assert.match(res.data?.error ?? "", /Couldn't reach the server/i)
})

test("a 401 triggers one force-refresh retry and uses the fresh token", async () => {
  let gotFresh = false
  const getToken: AdminJsonDeps["getToken"] = async (force) => (force ? (gotFresh = true, "fresh-token") : "stale-token")
  let served = 0
  const doFetch: AdminJsonDeps["doFetch"] = async (_path, init) => {
    served++
    const authHeader = (init.headers as Record<string, string> | undefined)?.Authorization ?? ""
    if (authHeader === "Bearer fresh-token") return okResponse({ ok: true })
    return okResponse({ error: "Unauthorized" }, 401)
  }
  const res = await adminJsonWith<{ ok?: boolean; error?: string }>({ getToken, doFetch }, "/x", { method: "PATCH", body: {} })
  assert.equal(served, 2, "a 401 must trigger exactly one retry")
  assert.equal(gotFresh, true)
  assert.equal(res.ok, true)
  assert.equal(res.status, 200)
})

test("if 401 retry still returns 401 the 401 is reported with its server-provided error", async () => {
  const doFetch: AdminJsonDeps["doFetch"] = async () => okResponse({ error: "Unauthorized" }, 401)
  const res = await adminJsonWith<{ error?: string }>({ getToken: async () => "same", doFetch }, "/x", { method: "PATCH", body: {} })
  assert.equal(res.ok, false)
  assert.equal(res.status, 401)
  assert.equal(res.data?.error, "Unauthorized")
})

test("server 500 is passed through as-is for the caller to surface", async () => {
  const doFetch: AdminJsonDeps["doFetch"] = async () => okResponse({ error: "Save override failed: table unreachable" }, 500)
  const res = await adminJsonWith<{ error?: string }>({ getToken: async () => "tok", doFetch }, "/x", { method: "PATCH", body: {} })
  assert.equal(res.ok, false)
  assert.equal(res.status, 500)
  assert.match(res.data?.error ?? "", /Save override failed/)
})

test("a non-JSON body (HTML error page) resolves with data=null and the HTTP status", async () => {
  const doFetch: AdminJsonDeps["doFetch"] = async () => new Response("<html>oops</html>", { status: 502, headers: { "Content-Type": "text/html" } })
  const res = await adminJsonWith<{ error?: string }>({ getToken: async () => "tok", doFetch }, "/x", { method: "PATCH", body: {} })
  assert.equal(res.ok, false)
  assert.equal(res.status, 502)
  assert.equal(res.data, null)
})

test("adminJsonWith never throws for any of the observed infra failure shapes", async () => {
  const cases: Array<AdminJsonDeps> = [
    { getToken: async () => null, doFetch: async () => okResponse({}) },
    { getToken: async () => "tok", doFetch: async () => { throw new Error("offline") } },
    { getToken: async () => "tok", doFetch: async () => { const e = new Error("ab"); e.name = "AbortError"; throw e } },
    { getToken: async () => "tok", doFetch: async () => okResponse({ error: "boom" }, 500) },
    { getToken: async () => { throw new Error("amplify crashed") }, doFetch: async () => okResponse({}) },
  ]
  for (const deps of cases) {
    const res = await adminJsonWith({
      getToken: async (f) => {
        try { return await deps.getToken(f) } catch { return null }
      },
      doFetch: deps.doFetch,
    }, "/x", { method: "PATCH", body: {} }).catch((e) => ({ threw: true, e }))
    assert.notEqual((res as { threw?: boolean }).threw, true, `adminJsonWith unexpectedly threw: ${JSON.stringify(res)}`)
  }
})
