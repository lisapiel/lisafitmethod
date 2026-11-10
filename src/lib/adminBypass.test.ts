import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { adminMfaSatisfied, clearAdminMfaCache } from "./adminBypass"

const ON = { ADMIN_MFA_REQUIRED: "true" }
const enrolled = async () => ["SOFTWARE_TOKEN_MFA"]
const notEnrolled = async () => []
const failing = async (): Promise<string[] | null> => { throw new Error("Cognito down") }

test("enforcement off: the admin free pass works exactly as before, with no lookup", async () => {
  clearAdminMfaCache()
  let called = false
  const spy = async () => { called = true; return [] }
  for (const env of [{}, { ADMIN_MFA_REQUIRED: "" }, { ADMIN_MFA_REQUIRED: "false" }, { ADMIN_MFA_REQUIRED: "TRUE" }]) {
    assert.equal(await adminMfaSatisfied("contact@lisafitmethod.com", spy, env), true)
  }
  assert.equal(called, false)
})

test("enforcement on: only an account with an authenticator app keeps the free pass", async () => {
  clearAdminMfaCache()
  assert.equal(await adminMfaSatisfied("contact@lisafitmethod.com", enrolled, ON), true)
  clearAdminMfaCache()
  assert.equal(await adminMfaSatisfied("contact@lisafitmethod.com", notEnrolled, ON), false)
})

test("enforcement on: if Cognito can't be asked, the free pass is refused", async () => {
  clearAdminMfaCache()
  assert.equal(await adminMfaSatisfied("lisa.p.mcpherson@gmail.com", failing, ON), false)
})

test("every admin free pass in client areas goes through the two-factor rule", () => {
  const auth = readFileSync("src/lib/authTokens.ts", "utf8")
  assert.equal((auth.match(/if \(isAdminEmail\(email\)\) return true/g) ?? []).length, 0)
  assert.equal((auth.match(/isAdminEmail\(email\) && await adminMfaSatisfied\(email\)/g) ?? []).length, 5)
  for (const f of ["src/lib/productGates.ts", "src/app/account/page.tsx", "src/app/my-coaching/layout.tsx", "src/app/api/member/access/route.ts", "src/app/my-plan/page.tsx"]) {
    assert.match(readFileSync(f, "utf8"), /adminMfaSatisfied\(/, f)
  }
})
