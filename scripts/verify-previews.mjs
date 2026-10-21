// Run the copy-fidelity check across every Direction D preview at once.
//
//   node scripts/verify-previews.mjs
//
// Each preview must render exactly the words its production page renders.
// The only declared differences are review chrome: the preview page titles,
// the prototype selector, and the two structural notes in preview-chrome.txt.
// Exits non-zero if any page drifts, so this can gate a deploy.
import { execFileSync } from "node:child_process"

const BASE = process.env.BASE_URL ?? "http://localhost:3000"
const PAIRS = [
  ["/courses", "/preview/d/courses"],
  ["/nutrition", "/preview/d/nutrition"],
  ["/coaching", "/preview/d/coaching"],
  ["/faq", "/preview/d/faq"],
  ["/contact", "/preview/d/contact"],
  ["/free-guide", "/preview/d/free-guide"],
  ["/free-guide?unlocked=1", "/preview/d/free-guide?unlocked=1"],
  ["/free-guide-nutrition", "/preview/d/free-guide-nutrition"],
  ["/free-guide-nutrition?unlocked=1", "/preview/d/free-guide-nutrition?unlocked=1"],
  ["/about", "/preview/d/about"],
  ["/blog", "/preview/d/blog"],
  ["/", "/preview/d"],
]

let failed = 0
for (const [prod, proto] of PAIRS) {
  const args = [
    "scripts/compare-copy.mjs",
    BASE + prod,
    BASE + proto,
    "--additions=scripts/preview-chrome.txt",
    "--removals=scripts/preview-titles.txt",
  ]
  if (prod === "/") {
    args.push("--additions=scripts/direction-d-additions.txt", "--removals=scripts/direction-d-removals.txt")
  }
  let out = ""
  try {
    out = execFileSync("node", args, { encoding: "utf8" })
  } catch (err) {
    out = String(err.stdout ?? "") + String(err.stderr ?? "")
  }
  const line = out.trim().split("\n").at(-1) ?? ""
  const ok = line.startsWith("RESULT: identical copy")
  if (!ok) failed++
  console.log(`${ok ? "  ok  " : "  FAIL"}  ${prod.padEnd(34)} -> ${proto}`)
  if (!ok) console.log(out.split("\n").slice(-26).join("\n"))
}

console.log(`\n${PAIRS.length - failed}/${PAIRS.length} pages render identical copy.`)
process.exit(failed > 0 ? 1 : 0)
