import { test } from "node:test"
import assert from "node:assert/strict"
import { parseBlogPost, upsertIndex } from "./blogPostInput"

const post = {
  slug: "how-to-hip-hinge", title: "How to hip hinge", date: "2026-01-02", excerpt: "x", readingTime: 4,
  coverImage: "https://b.s3.us-east-2.amazonaws.com/media/blog/images/how-to-hip-hinge-cover.jpg",
  sections: [{ heading: "Start", body: "Body" }, { body: "More" }],
}

test("a valid post is rebuilt with only post fields", () => {
  assert.deepEqual(parseBlogPost({ ...post, extra: "x" }), post)
})

test("slugs that could leave the blog folder or replace the index are refused", () => {
  for (const slug of ["../settings", "a/b", "index", "", "a.json", " x"]) {
    assert.equal(parseBlogPost({ ...post, slug }), null, slug)
  }
})

test("index upsert replaces by slug and sorts newest first", () => {
  const idx = [{ slug: "a", title: "A", date: "2025-01-01", excerpt: "", readingTime: 1 }]
  const out = upsertIndex(idx, { slug: "b", title: "B", date: "2026-01-01", excerpt: "", readingTime: 1 })
  assert.deepEqual(out.map((p) => p.slug), ["b", "a"])
  assert.deepEqual(upsertIndex(out, { slug: "a", title: "A2", date: "2027-01-01", excerpt: "", readingTime: 1 }).map((p) => p.title), ["A2", "B"])
})
