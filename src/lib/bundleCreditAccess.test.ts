import { test } from "node:test"
import assert from "node:assert/strict"
import { resolveBundleCreditLookup } from "./bundleCreditAccess"

test("a signed-out lookup is refused", () => {
  assert.deepEqual(resolveBundleCreditLookup(null, "buyer@example.com"), { ok: false, status: 401 })
  assert.deepEqual(resolveBundleCreditLookup(null, null), { ok: false, status: 401 })
})

test("a signed-in person cannot look up someone else's email", () => {
  assert.deepEqual(resolveBundleCreditLookup("me@example.com", "buyer@example.com"), { ok: false, status: 403 })
})

test("a signed-in person gets their own email, ignoring case and spaces", () => {
  assert.deepEqual(resolveBundleCreditLookup("me@example.com", " Me@Example.com "), { ok: true, email: "me@example.com" })
})

test("with no email given, the lookup uses the session email", () => {
  assert.deepEqual(resolveBundleCreditLookup("Me@Example.com", null), { ok: true, email: "me@example.com" })
  assert.deepEqual(resolveBundleCreditLookup("me@example.com", ""), { ok: true, email: "me@example.com" })
})
