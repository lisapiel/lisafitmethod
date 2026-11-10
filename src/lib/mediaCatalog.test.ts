import { test } from "node:test"
import assert from "node:assert/strict"
import { catalogMutation, parseCatalogRequest } from "./mediaCatalog"

const create = {
  type: "VIDEO", title: "Trailer", s3Key: "media/videos/lp_trailer.mp4",
  url: "https://b.s3.us-east-2.amazonaws.com/media/videos/lp_trailer.mp4",
  assignedTo: "lp_trailer", isPublished: false, fileSize: 1234, mimeType: "video/mp4",
}

test("create passes only MediaAsset fields through", () => {
  const r = parseCatalogRequest({ action: "create", input: { ...create, owner: "x", id: "forced", createdAt: "x" } })
  assert.deepEqual(r, { action: "create", input: create })
})

test("create needs the required fields", () => {
  for (const f of ["type", "title", "s3Key", "assignedTo", "isPublished"]) {
    const input: Record<string, unknown> = { ...create }
    delete input[f]
    assert.ok("error" in parseCatalogRequest({ action: "create", input }), f)
  }
})

test("update needs an id and at least one valid field", () => {
  assert.deepEqual(parseCatalogRequest({ action: "update", input: { id: "abc-123", isPublished: true } }), { action: "update", input: { id: "abc-123", isPublished: true } })
  assert.ok("error" in parseCatalogRequest({ action: "update", input: { isPublished: true } }))
  assert.ok("error" in parseCatalogRequest({ action: "update", input: { id: "abc" } }))
  assert.ok("error" in parseCatalogRequest({ action: "update", input: { id: "abc", isPublished: "yes" } }))
})

test("delete takes only the id", () => {
  assert.deepEqual(parseCatalogRequest({ action: "delete", input: { id: "abc", title: "x" } }), { action: "delete", input: { id: "abc" } })
  assert.ok("error" in parseCatalogRequest({ action: "delete", input: { id: "a b" } }))
})

test("bad values and unknown actions are refused", () => {
  assert.ok("error" in parseCatalogRequest({ action: "list", input: {} }))
  assert.ok("error" in parseCatalogRequest({ action: "create", input: { ...create, type: "AUDIO" } }))
  assert.ok("error" in parseCatalogRequest({ action: "create", input: { ...create, s3Key: "media/settings.json" } }))
  assert.ok("error" in parseCatalogRequest({ action: "create", input: { ...create, s3Key: "media/videos/../settings.json" } }))
  assert.ok("error" in parseCatalogRequest({ action: "create", input: { ...create, url: "javascript:alert(1)" } }))
  assert.ok("error" in parseCatalogRequest({ action: "create", input: { ...create, fileSize: -1 } }))
  assert.ok("error" in parseCatalogRequest(null))
})

test("mutations name the deployed AppSync operations", () => {
  assert.match(catalogMutation("create"), /createMediaAsset\(input: \$input\)/)
  assert.match(catalogMutation("update"), /\$input: UpdateMediaAssetInput!/)
  assert.match(catalogMutation("delete"), /deleteMediaAsset/)
})
