// Every local asset the site references must exist on disk AND be tracked by
// git, or it will 404 in production while looking perfect locally.
//
//   node scripts/verify-assets.mjs
//
// This exists because public/preview/.gitignore once listed the site's own
// backgrounds, nutrition still, testimonial photo and video. The files were on
// disk, so every local preview and screenshot looked right, and Amplify built
// without them. Nothing in the build warns about that.
import { execFileSync } from "node:child_process"
import fs from "node:fs"

const src = execFileSync("git", ["ls-files", "src"], { encoding: "utf8" }).trim().split("\n")
const tracked = new Set(execFileSync("git", ["ls-files", "public"], { encoding: "utf8" }).trim().split("\n"))

const refs = new Map()
for (const file of src) {
  if (!/\.(tsx?|mjs)$/.test(file)) continue
  const text = fs.readFileSync(file, "utf8")
  for (const m of text.matchAll(/["'`](\/[A-Za-z0-9/._-]+\.(?:jpg|jpeg|png|webp|avif|svg|mp4|webm|mov|ico|woff2?))["'`]/g)) {
    if (!refs.has(m[1])) refs.set(m[1], new Set())
    refs.get(m[1]).add(file)
  }
}

let bad = 0
for (const [ref, where] of [...refs].sort()) {
  const path = "public" + ref
  const onDisk = fs.existsSync(path)
  const inGit = tracked.has(path)
  if (onDisk && inGit) continue
  bad++
  const why = !onDisk ? "MISSING FROM DISK" : "NOT TRACKED BY GIT — will 404 in production"
  console.log(`  ${why}: ${ref}`)
  for (const w of where) console.log(`      referenced by ${w}`)
}
console.log(`\n${refs.size - bad}/${refs.size} referenced assets are present and tracked.`)
process.exit(bad > 0 ? 1 : 0)
