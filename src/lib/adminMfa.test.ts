import { test } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { adminMfaOk, adminMfaRequired, decideAdminAccess } from "./adminMfa"

const ADMIN = "contact@lisafitmethod.com"
const enrolled = { email: ADMIN, mfaSettings: ["SOFTWARE_TOKEN_MFA"] }
const notEnrolled = { email: ADMIN, mfaSettings: [] }

test("only the exact string true turns enforcement on", () => {
  assert.equal(adminMfaRequired({}), false)
  assert.equal(adminMfaRequired({ ADMIN_MFA_REQUIRED: "" }), false)
  assert.equal(adminMfaRequired({ ADMIN_MFA_REQUIRED: "TRUE" }), false)
  assert.equal(adminMfaRequired({ ADMIN_MFA_REQUIRED: "1" }), false)
  assert.equal(adminMfaRequired({ ADMIN_MFA_REQUIRED: "false" }), false)
  assert.equal(adminMfaRequired({ ADMIN_MFA_REQUIRED: "true" }), true)
})

test("enforcement off: admins get in with or without two-factor, as before", () => {
  const off = { required: false, exempt: false }
  assert.deepEqual(decideAdminAccess(notEnrolled, off), { ok: true, email: ADMIN, mfaEnabled: false })
  assert.deepEqual(decideAdminAccess(enrolled, off), { ok: true, email: ADMIN, mfaEnabled: true })
  assert.deepEqual(decideAdminAccess({ email: "LISA.P.MCPHERSON@gmail.com", mfaSettings: [] }, off).ok, true)
})

test("non-admins and bad tokens are refused whatever the setting", () => {
  for (const required of [false, true]) {
    for (const exempt of [false, true]) {
      assert.deepEqual(decideAdminAccess(null, { required, exempt }), { ok: false, reason: "signed-out" })
      assert.deepEqual(decideAdminAccess({ email: "client2@phase0.test", mfaSettings: ["SOFTWARE_TOKEN_MFA"] }, { required, exempt }), { ok: false, reason: "not-admin" })
      assert.deepEqual(decideAdminAccess({ email: null, mfaSettings: [] }, { required, exempt }), { ok: false, reason: "not-admin" })
    }
  }
})

test("enforcement on: an enrolled admin is accepted", () => {
  assert.deepEqual(decideAdminAccess(enrolled, { required: true, exempt: false }), { ok: true, email: ADMIN, mfaEnabled: true })
})

test("enforcement on: an admin without an authenticator app is refused with its own reason", () => {
  assert.deepEqual(decideAdminAccess(notEnrolled, { required: true, exempt: false }), { ok: false, reason: "mfa-required", email: ADMIN })
  // SMS or email codes don't count: only the authenticator app does.
  assert.equal(decideAdminAccess({ email: ADMIN, mfaSettings: ["SMS_MFA", "EMAIL_OTP"] }, { required: true, exempt: false }).ok, false)
})

test("enforcement on: the security page's status check still lets an unenrolled admin through", () => {
  assert.deepEqual(decideAdminAccess(notEnrolled, { required: true, exempt: true }), { ok: true, email: ADMIN, mfaEnabled: false })
})

test("routes with their own GetUser call follow the same rule", () => {
  assert.equal(adminMfaOk({ UserMFASettingList: [] }, {}), true)
  assert.equal(adminMfaOk({}, { ADMIN_MFA_REQUIRED: "nope" }), true)
  assert.equal(adminMfaOk({}, { ADMIN_MFA_REQUIRED: "true" }), false)
  assert.equal(adminMfaOk({ UserMFASettingList: ["SMS_MFA"] }, { ADMIN_MFA_REQUIRED: "true" }), false)
  assert.equal(adminMfaOk({ UserMFASettingList: ["SOFTWARE_TOKEN_MFA"] }, { ADMIN_MFA_REQUIRED: "true" }), true)
})

// Source checks: the status API is the only exempt caller, and every admin
// API that calls GetUser itself also applies the two-factor rule.
const root = path.resolve(__dirname, "../..")
function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name)
    return d.isDirectory() ? walk(p) : [p]
  })
}
const adminRoutes = walk(path.join(root, "src/app/api/admin")).filter((f) => f.endsWith("route.ts"))

test("only the security status API is exempt from two-factor", () => {
  const exempt = adminRoutes.filter((f) => /exempt:\s*true/.test(fs.readFileSync(f, "utf8")))
  assert.deepEqual(exempt.map((f) => path.relative(root, f)), ["src/app/api/admin/security/status/route.ts"])
})

test("every admin API checks the caller through the shared rule", () => {
  const missing = adminRoutes.filter((f) => {
    const src = fs.readFileSync(f, "utf8")
    if (src.includes("GetUserCommand")) return !src.includes("adminMfaOk(result)")
    return !/verifyAdminRequest|verifyAdminToken|adminSessionEmail|checkAdminRequest/.test(src)
  })
  assert.deepEqual(missing.map((f) => path.relative(root, f)), [])
})

test("the Amplify build passes ADMIN_MFA_REQUIRED through to the server", () => {
  assert.match(fs.readFileSync(path.join(root, "amplify.yml"), "utf8"), /'ADMIN_MFA_REQUIRED'/)
})
