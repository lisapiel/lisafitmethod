import { test } from "node:test"
import assert from "node:assert/strict"
import {
  clientKeyOwnerSlug, emailSlug, isAdminDeletableKey, isClientUploadKey, isOwnClientKey, isSafeKey,
  parseKeyList, planAdminUpload, planClientUpload, s3PublicUrl, sanitizeFileName,
} from "./mediaKeys"

const MB = 1024 * 1024

test("admin uploads land only in the allowed folders, with the same key the old page wrote", () => {
  assert.deepEqual(planAdminUpload("videos", "lp_trailer.mp4", "video/mp4"), { key: "media/videos/lp_trailer.mp4", contentType: "video/mp4" })
  assert.deepEqual(planAdminUpload("photos", "hero.JPG", "image/jpeg"), { key: "media/photos/hero.JPG", contentType: "image/jpeg" })
  assert.deepEqual(planAdminUpload("blog-images", "my-post-cover.png", "image/png"), { key: "media/blog/images/my-post-cover.png", contentType: "image/png" })
  assert.deepEqual(planAdminUpload("blog", "x.webp", "image/webp"), { key: "media/blog/images/x.webp", contentType: "image/webp" })
  for (const folder of ["settings", "coaching-form-reviews", "nutrition-messages", "../photos", "", null, "media/photos", "constructor", "__proto__"]) {
    assert.ok("error" in planAdminUpload(folder, "a.jpg", "image/jpeg"), String(folder))
  }
})

test("admin uploads refuse the wrong file type for a folder", () => {
  assert.ok("error" in planAdminUpload("photos", "a.mp4", "video/mp4"))
  assert.ok("error" in planAdminUpload("videos", "a.jpg", "image/jpeg"))
  assert.ok("error" in planAdminUpload("photos", "a.jpg", ""))
  assert.ok("error" in planAdminUpload("photos", "a.jpg", "image/jpeg\r\nx-amz-acl: public"))
})

test("file names are sanitised and traversal is refused", () => {
  assert.equal(sanitizeFileName("my photo (1).jpg"), "my-photo-1-.jpg")
  assert.equal(sanitizeFileName("  hero.png "), "hero.png")
  assert.equal(sanitizeFileName("-.-hero.png"), "hero.png")
  assert.equal(sanitizeFileName(".htaccess"), "htaccess")
  for (const bad of ["../hero.jpg", "a/../../b.jpg", "folder/hero.jpg", "..\\hero.jpg", "hero\u0000.jpg", "..", ".", "", "   ", "-", "...", 5, null]) {
    assert.equal(sanitizeFileName(bad), null, JSON.stringify(bad))
  }
  assert.ok("error" in planAdminUpload("photos", "../settings.json", "image/jpeg"))
  assert.ok("error" in planAdminUpload("photos", "../../media/settings.json", "image/jpeg"))
})

test("admin deletes are confined to photos, videos and blog", () => {
  assert.ok(isAdminDeletableKey("media/photos/hero.jpg"))
  assert.ok(isAdminDeletableKey("media/videos/lp_trailer.mp4"))
  assert.ok(isAdminDeletableKey("media/blog/images/x-cover.png"))
  assert.ok(isAdminDeletableKey("media/blog/old-post.json"))
  for (const bad of [
    "media/settings.json", "media/coaching-form-reviews/a/b.mp4", "media/nutrition-messages/a/b.jpg",
    "media/photos/", "media/photos/../settings.json", "media/photos//x.jpg", "media/videos/./x.mp4",
    "/media/photos/x.jpg", "media/photosx/y.jpg", "other/photos/x.jpg", "", 3,
  ]) {
    assert.equal(isAdminDeletableKey(bad), false, String(bad))
  }
})

test("safe keys refuse traversal and odd segments", () => {
  assert.ok(isSafeKey("media/a/b.jpg"))
  for (const bad of ["media/../x", "media/./x", "media//x", "/media/x", "media/x/", "media\\x", "media/x\n", "a".repeat(513)]) {
    assert.equal(isSafeKey(bad), false, bad)
  }
})

test("the email slug is the one the check-in page and composer always used", () => {
  assert.equal(emailSlug("Client2@Phase0.test"), "client2-phase0-test")
  assert.equal(emailSlug("a.b+c@x.co.uk"), "a-b-c-x-co-uk")
  assert.equal(emailSlug("--odd__@x.com--"), "odd-x-com")
})

test("client upload keys are built in the caller's own folder for each kind", () => {
  const video = planClientUpload({ kind: "form-review", ext: "MOV", contentType: "video/quicktime", size: 50 * MB }, "Client2@phase0.test", 1700000000000, "abc123")
  assert.deepEqual(video, { key: "media/coaching-form-reviews/client2-phase0-test/1700000000000-abc123.mov", contentType: "video/quicktime", size: 50 * MB })
  const photo = planClientUpload({ kind: "meal-photo", ext: "jpg", contentType: "image/jpeg", size: 3 * MB }, "client2@phase0.test", 1700000000000, "zz")
  assert.deepEqual(photo, { key: "media/nutrition-messages/client2-phase0-test/1700000000000-zz.jpg", contentType: "image/jpeg", size: 3 * MB })
  const random = planClientUpload({ kind: "meal-photo", ext: "jpg", contentType: "image/jpeg", size: 1 }, "client2@phase0.test")
  assert.ok(!("error" in random) && /^media\/nutrition-messages\/client2-phase0-test\/\d+-[a-z0-9]+\.jpg$/.test(random.key))
})

test("client uploads enforce the old size limits and file types", () => {
  const e = "c@x.test"
  const status = (r: ReturnType<typeof planClientUpload>) => ("error" in r ? r.status : 200)
  assert.equal(status(planClientUpload({ kind: "form-review", ext: "mp4", contentType: "video/mp4", size: 200 * MB }, e)), 200)
  assert.equal(status(planClientUpload({ kind: "form-review", ext: "mp4", contentType: "video/mp4", size: 200 * MB + 1 }, e)), 413)
  assert.equal(status(planClientUpload({ kind: "meal-photo", ext: "jpg", contentType: "image/jpeg", size: 8 * MB }, e)), 200)
  assert.equal(status(planClientUpload({ kind: "meal-photo", ext: "jpg", contentType: "image/jpeg", size: 8 * MB + 1 }, e)), 413)
  assert.equal(status(planClientUpload({ kind: "meal-photo", ext: "mp4", contentType: "video/mp4", size: 10 }, e)), 400)
  assert.equal(status(planClientUpload({ kind: "form-review", ext: "jpg", contentType: "image/jpeg", size: 10 }, e)), 400)
  assert.equal(status(planClientUpload({ kind: "meal-photo", ext: "html", contentType: "text/html", size: 10 }, e)), 400)
  assert.equal(status(planClientUpload({ kind: "meal-photo", ext: "jpg", contentType: "image/jpeg", size: 0 }, e)), 400)
  assert.equal(status(planClientUpload({ kind: "meal-photo", ext: "jpg", contentType: "image/jpeg", size: 1.5 }, e)), 400)
  assert.equal(status(planClientUpload({ kind: "meal-photo", ext: "jpg", contentType: "image/jpeg", size: "10" }, e)), 400)
  assert.equal(status(planClientUpload({ kind: "meal-photo", ext: "../x", contentType: "image/jpeg", size: 10 }, e)), 400)
  assert.equal(status(planClientUpload({ kind: "meal-photo", ext: "jpg/x", contentType: "image/jpeg", size: 10 }, e)), 400)
  assert.equal(status(planClientUpload({ kind: "photos", ext: "jpg", contentType: "image/jpeg", size: 10 }, e)), 400)
  assert.equal(status(planClientUpload({ kind: "meal-photo", ext: "jpg", contentType: "image/jpeg", size: 10 }, "@@@")), 401)
})

test("client keys are only the caller's own; other slugs and traversal are refused", () => {
  const me = "client2@phase0.test"
  const own = "media/nutrition-messages/client2-phase0-test/1700-abc.jpg"
  const ownVideo = "media/coaching-form-reviews/client2-phase0-test/1700-abc.mp4"
  assert.ok(isOwnClientKey(own, me))
  assert.ok(isOwnClientKey(ownVideo, me))
  assert.ok(isOwnClientKey(own, "CLIENT2@phase0.test"))
  assert.ok(isOwnClientKey(own, me, "meal-photo"))
  assert.equal(isOwnClientKey(own, me, "form-review"), false)
  assert.equal(isOwnClientKey(ownVideo, me, "meal-photo"), false)
  for (const bad of [
    "media/nutrition-messages/someone-else-test/1-a.jpg",
    "media/nutrition-messages/client2-phase0-test/../someone-else-test/1-a.jpg",
    "media/nutrition-messages/client2-phase0-test/sub/1-a.jpg",
    "media/nutrition-messages/client2-phase0-test/",
    "media/nutrition-messages/client2-phase0-test",
    "media/nutrition-messages/client2-phase0-testx/1-a.jpg",
    "media/photos/client2-phase0-test/1-a.jpg",
    "media/settings.json",
    "media/nutrition-messages//1-a.jpg",
  ]) {
    assert.equal(isOwnClientKey(bad, me), false, bad)
  }
})

test("admin reads accept any client upload key and nothing else", () => {
  assert.ok(isClientUploadKey("media/nutrition-messages/anyone-x-com/1-a.jpg"))
  assert.ok(isClientUploadKey("media/coaching-form-reviews/anyone-x-com/1-a.mov"))
  assert.equal(clientKeyOwnerSlug("media/coaching-form-reviews/anyone-x-com/1-a.mov"), "anyone-x-com")
  for (const bad of ["media/photos/hero.jpg", "media/settings.json", "media/nutrition-messages/a/../b/c.jpg", "media/nutrition-messages/x.jpg"]) {
    assert.equal(isClientUploadKey(bad), false, bad)
  }
})

test("read key lists are capped and must be strings", () => {
  assert.deepEqual(parseKeyList({ keys: ["a", "a", "b"] }), ["a", "b"])
  assert.equal(parseKeyList({ keys: "a" }), null)
  assert.equal(parseKeyList({ keys: [1] }), null)
  assert.equal(parseKeyList({ keys: Array.from({ length: 51 }, (_, i) => `k${i}`) }), null)
  assert.equal(parseKeyList(null), null)
})

test("public URLs match the old S3 base", () => {
  assert.equal(
    s3PublicUrl("amplify-lisafitmethod-lis-lisafitmediastorebucket2-kgef6soixdov", "us-east-2", "media/videos/lp_trailer.mp4"),
    "https://amplify-lisafitmethod-lis-lisafitmediastorebucket2-kgef6soixdov.s3.us-east-2.amazonaws.com/media/videos/lp_trailer.mp4",
  )
})
