import { test } from "node:test"
import assert from "node:assert/strict"
import { cdnUrl } from "./cdnUrl"

test("keeps folders, encodes spaces and apostrophes safely", () => {
  assert.equal(cdnUrl("https://cdn.test", "World's Greatest Stretch F.mp4"), "https://cdn.test/World's%20Greatest%20Stretch%20F.mp4")
  assert.equal(cdnUrl("https://cdn.test", "drills/World’s Greatest Stretch.mp4"), "https://cdn.test/drills/World%E2%80%99s%20Greatest%20Stretch.mp4")
  assert.equal(cdnUrl("https://cdn.test", "a#b?.mp4"), "https://cdn.test/a%23b%3F.mp4")
})
