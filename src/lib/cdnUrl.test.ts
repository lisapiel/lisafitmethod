import { test } from "node:test"
import assert from "node:assert/strict"
import { cdnUrl, thumbFallback } from "./cdnUrl"

test("keeps folders, encodes spaces and apostrophes safely", () => {
  assert.equal(cdnUrl("https://cdn.test", "World's Greatest Stretch F.mp4"), "https://cdn.test/World's%20Greatest%20Stretch%20F.mp4")
  assert.equal(cdnUrl("https://cdn.test", "drills/World’s Greatest Stretch.mp4"), "https://cdn.test/drills/World%E2%80%99s%20Greatest%20Stretch.mp4")
  assert.equal(cdnUrl("https://cdn.test", "a#b?.mp4"), "https://cdn.test/a%23b%3F.mp4")
})

test("thumbnail fallback retries once with underscores, then hides", () => {
  const g = globalThis as unknown as { window: { location: { href: string } } }
  g.window = { location: { href: "http://x.test/" } }
  const img = { src: "https://cdn.test/World's%20Greatest%20Stretch%20F.jpg", dataset: {} as Record<string, string>, style: { visibility: "" } }
  const ev = { currentTarget: img as unknown as HTMLImageElement }
  thumbFallback(ev)
  assert.equal(img.src, "https://cdn.test/World_s%20Greatest%20Stretch%20F.jpg")
  thumbFallback(ev)
  assert.equal(img.style.visibility, "hidden")
  const plain = { src: "https://cdn.test/Squat%20F.jpg", dataset: {} as Record<string, string>, style: { visibility: "" } }
  thumbFallback({ currentTarget: plain as unknown as HTMLImageElement })
  assert.equal(plain.style.visibility, "hidden")
})
