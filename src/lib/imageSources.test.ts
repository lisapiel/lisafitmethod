import { test } from "node:test"
import assert from "node:assert/strict"
import { allowedImageSources, exerciseCdnBase, RESIZE_WIDTHS } from "./imageSources"
import { thumbSources, resizedUrl } from "./thumbImage"

const config = { exerciseCdnUrl: "https://cdn.example.net", mediaBucket: "site-media", region: "us-east-2" }

test("allows only the configured exercise CDN and the public photo folder, never query strings", () => {
  assert.deepEqual(allowedImageSources(config), [
    { protocol: "https", hostname: "cdn.example.net", pathname: "/**", search: "" },
    { protocol: "https", hostname: "site-media.s3.us-east-2.amazonaws.com", pathname: "/media/photos/**", search: "" },
  ])
})

test("follows configuration: a CDN with a folder, another bucket and region", () => {
  const s = allowedImageSources({ exerciseCdnUrl: "https://media.lfm.test/exercises/", mediaBucket: "lfm-media", region: "us-east-1" })
  assert.deepEqual(s.map((x) => `${x.hostname}${x.pathname}`), ["media.lfm.test/exercises/**", "lfm-media.s3.amazonaws.com/media/photos/**"])
})

test("an unset, non-https or odd CDN value adds no source", () => {
  for (const bad of [undefined, "", "http://cdn.example.net", "https://cdn.example.net/?a=1", "https://u:p@cdn.example.net", "not a url"]) {
    assert.equal(exerciseCdnBase(bad), null, String(bad))
    assert.equal(allowedImageSources({ ...config, exerciseCdnUrl: bad }).length, 1)
  }
})

test("thumbnail requests cover the box on 1x, 2x and 3x screens with allowed widths", () => {
  const cdn = "https://cdn.example.net"
  const r = thumbSources(`${cdn}/Squat%20F.jpg`, { w: 240, h: 190 }, cdn)
  const widths = [...(r.srcSet ?? "").matchAll(/w=(\d+)/g)].map((m) => Number(m[1]))
  assert.deepEqual(widths, [384, 750, 1080])
  widths.forEach((w, i) => {
    assert.ok((RESIZE_WIDTHS as readonly number[]).includes(w))
    assert.ok(w / (i + 1) >= Math.ceil((190 * 16) / 9), "drawn at least as large as the box needs")
  })
  assert.equal(r.src, resizedUrl(`${cdn}/Squat%20F.jpg`, 750))
  assert.match(r.src, /^\/_next\/image\?url=https%3A%2F%2Fcdn\.example\.net%2FSquat%2520F\.jpg&w=750&q=75$/)
})

test("small icons stay small; anything not on the CDN is left alone", () => {
  const cdn = "https://cdn.example.net"
  assert.match(thumbSources(`${cdn}/a.jpg`, { w: 36, h: 36 }, cdn).srcSet ?? "", /w=64&q=75 1x, .*w=128&q=75 2x, .*w=256&q=75 3x/)
  for (const other of ["https://bucket.s3.us-east-2.amazonaws.com/media/coaching-progress-photos/a.jpg?X-Amz-Signature=1", "https://evil.example.com/a.jpg", "https://cdn.example.net.evil.com/a.jpg", `${cdn}/a.jpg?x=1`, ""]) {
    assert.deepEqual(thumbSources(other, { w: 40, h: 40 }, cdn), { src: other })
  }
  assert.deepEqual(thumbSources(`${cdn}/a.jpg`, { w: 40, h: 40 }, null), { src: `${cdn}/a.jpg` })
})
