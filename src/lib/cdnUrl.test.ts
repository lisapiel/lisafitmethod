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

function fakeImg(src: string, srcset = "") {
  const img = {
    src, srcset, dataset: {} as Record<string, string>, style: { visibility: "" },
    removeAttribute(name: string) { if (name === "srcset") img.srcset = "" },
  }
  return img
}
const fire = (img: ReturnType<typeof fakeImg>) => thumbFallback({ currentTarget: img as unknown as HTMLImageElement })
const resized = (u: string, w: number) => `/_next/image?url=${encodeURIComponent(u)}&w=${w}&q=75`

test("a resized thumbnail that fails falls back to the original file, then hides", () => {
  const g = globalThis as unknown as { window: { location: { href: string } } }
  g.window = { location: { href: "http://x.test/" } }
  const orig = "https://cdn.test/Squat%20F.jpg"
  const img = fakeImg(`http://x.test${resized(orig, 750)}`, `${resized(orig, 384)} 1x, ${resized(orig, 750)} 2x`)
  fire(img)
  assert.equal(img.src, orig)
  assert.equal(img.srcset, "")
  fire(img)
  assert.equal(img.style.visibility, "hidden")
})

test("a resized apostrophe thumbnail retries resized with underscores, then the original, then hides", () => {
  const g = globalThis as unknown as { window: { location: { href: string } } }
  g.window = { location: { href: "http://x.test/" } }
  const orig = "https://cdn.test/World's%20Greatest%20Stretch%20F.jpg"
  const alt = "https://cdn.test/World_s%20Greatest%20Stretch%20F.jpg"
  const img = fakeImg(`http://x.test${resized(orig, 750)}`, `${resized(orig, 384)} 1x, ${resized(orig, 750)} 2x`)
  fire(img)
  const u = new URL(img.src, "http://x.test")
  assert.equal(u.pathname, "/_next/image")
  assert.equal(u.searchParams.get("url"), alt)
  assert.equal(u.searchParams.get("w"), "750")
  assert.deepEqual(img.srcset.split(", ").map((c) => [new URL(c.split(" ")[0], "http://x.test").searchParams.get("url"), c.split(" ")[1]]), [[alt, "1x"], [alt, "2x"]])
  fire(img)
  assert.equal(img.src, alt)
  assert.equal(img.srcset, "")
  fire(img)
  assert.equal(img.style.visibility, "hidden")
})
