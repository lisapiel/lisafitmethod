import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { TERMS_VERSION, PRIOR_TERMS_STILL_IN_FORCE, termsAcceptanceCurrent } from "./authTokens"

test("the current Terms version is accepted; missing or unknown versions are not", () => {
  assert.equal(termsAcceptanceCurrent(TERMS_VERSION), true)
  assert.equal(termsAcceptanceCurrent(null), false)
  assert.equal(termsAcceptanceCurrent(undefined), false)
  assert.equal(termsAcceptanceCurrent(""), false)
  assert.equal(termsAcceptanceCurrent("2020-01-01"), false)
})

test("every earlier version kept in force is still accepted", () => {
  for (const v of PRIOR_TERMS_STILL_IN_FORCE) assert.equal(termsAcceptanceCurrent(v), true, v)
})

test("My Coaching asks for re-acceptance only through the in-force rule", () => {
  const layout = readFileSync("src/app/my-coaching/layout.tsx", "utf8")
  assert.match(layout, /termsAcceptanceCurrent\(versions\.acceptedTermsVersion\)/)
  assert.doesNotMatch(layout, /acceptedTermsVersion !== TERMS_VERSION/)
})
