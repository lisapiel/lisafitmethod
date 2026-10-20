// Compare the visible text of a redesign prototype against the live page it
// is meant to reproduce.
//
//   node scripts/compare-copy.mjs http://localhost:3000/ http://localhost:3000/preview/c
//
// Exists because the redesign brief is "zero unapproved copy changes": the
// prototype may re-set the page however it likes, but it may not reword,
// shorten, merge or drop a single line. Eyeballing two long pages cannot
// prove that; diffing their rendered text can.
//
// Markup splits some phrases across elements ("$" and "97" are separate
// spans in production), so comparison happens on two levels: the list of
// text runs, and a single normalised blob that is immune to where the tags
// happen to fall.

const ENTITIES = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
  "&nbsp;": " ",
}

function decodeEntities(input) {
  return input.replace(/&[a-zA-Z]+;|&#x?[0-9a-fA-F]+;/g, (match) => {
    if (ENTITIES[match]) return ENTITIES[match]
    const hex = match.match(/&#x([0-9a-fA-F]+);/)
    if (hex) return String.fromCodePoint(parseInt(hex[1], 16))
    const dec = match.match(/&#(\d+);/)
    if (dec) return String.fromCodePoint(Number(dec[1]))
    return match
  })
}

const TAG_BREAK = "@@TAG@@"

// Review chrome that belongs to the prototype harness, not to either design:
// the floating A/B/C switcher pinned to the bottom of each prototype page.
// Listed explicitly rather than filtered silently, so the exclusions stay
// visible to anyone reading the output.
export const PROTOTYPE_CHROME = [
  "prototype",
  "console",
  "a · atelier",
  "b · nocturne",
  "c · combined",
]

export function textRuns(html) {
  let s = html
  // <head> carries the document title and meta description. Neither is
  // visible page copy, and the prototype is deliberately titled as a
  // prototype, so the comparison starts at <body>.
  s = s.replace(/<head[\s\S]*?<\/head>/i, " ")
  s = s.replace(/<script[\s\S]*?<\/script>/gi, " ")
  s = s.replace(/<style[\s\S]*?<\/style>/gi, " ")
  s = s.replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
  // React separates adjacent text nodes with an empty comment. Those must
  // close up to nothing, or every "<mark>{value}" pair reads as two words
  // with a space wedged between them. Other comments still become a space.
  s = s.replace(/<!--\s*-->/g, "")
  s = s.replace(/<!--[\s\S]*?-->/g, " ")
  s = s.replace(/<[^>]+>/g, TAG_BREAK)
  return s
    .split(TAG_BREAK)
    .map((part) => decodeEntities(part).replace(/\s+/g, " ").trim())
    .filter(Boolean)
}

// Normalise away the things that are presentation, not wording: curly vs
// straight quotes, dash style, non-breaking and repeated spaces, the space a
// tag boundary leaves inside "$ 97", and letter case.
export function normalise(text) {
  return text
    .replace(/[‘’ʼ]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/[  ]/g, " ")
    .replace(/·/g, "·")
    .replace(/\$\s+(\d)/g, "$$$1")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { "user-agent": "copy-compare" } })
  if (!res.ok) throw new Error(`${url} returned HTTP ${res.status}`)
  return res.text()
}

function phraseCounts(runs) {
  const counts = new Map()
  for (const run of runs) {
    const key = normalise(run)
    if (!key) continue
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return counts
}

// A run that production splits across tags ("Want a plan built completely
// around you?" + "Explore 1:1 coaching.") still counts as present if the
// prototype's own blob contains it, so compare against the blob before
// reporting anything as missing.
function report(label, missing, blob) {
  const real = missing.filter((phrase) => !blob.includes(phrase))
  const absorbed = missing.length - real.length
  console.log(`\n${label}: ${real.length} genuine, ${absorbed} absorbed into a longer run`)
  for (const phrase of real) {
    console.log(`   - "${phrase.length > 150 ? phrase.slice(0, 150) + "…" : phrase}"`)
  }
  return real
}

const [, , prodUrl, protoUrl, ...rest] = process.argv
if (!prodUrl || !protoUrl) {
  console.error("usage: node scripts/compare-copy.mjs <production-url> <prototype-url> [--additions=file]")
  process.exit(2)
}

// Phrases the prototype is allowed to add, declared in a file rather than
// buried in this script, so every intentional addition is reviewable in one
// place. Anything added but NOT listed there is reported as a copy change.
const additionsArg = rest.find((a) => a.startsWith("--additions="))
let declaredAdditions = []
if (additionsArg) {
  const file = additionsArg.slice("--additions=".length)
  declaredAdditions = (await import("node:fs")).readFileSync(file, "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => normalise(l))
}

const [prodHtml, protoHtml] = await Promise.all([fetchText(prodUrl), fetchText(protoUrl)])
const prodRuns = textRuns(prodHtml)
const protoRuns = textRuns(protoHtml)

const prodBlob = normalise(prodRuns.join(" "))
const protoBlob = normalise(protoRuns.join(" "))

const prodCounts = phraseCounts(prodRuns)
const protoCounts = phraseCounts(protoRuns)

const missingFromPrototype = [...prodCounts.keys()].filter((p) => !protoCounts.has(p))
const addedRaw = [...protoCounts.keys()].filter((p) => !prodCounts.has(p))
const chrome = addedRaw.filter((p) => PROTOTYPE_CHROME.includes(p))
const intentional = addedRaw.filter((p) => !PROTOTYPE_CHROME.includes(p) && declaredAdditions.includes(p))
const addedInPrototype = addedRaw.filter(
  (p) => !PROTOTYPE_CHROME.includes(p) && !declaredAdditions.includes(p)
)

console.log(`production : ${prodRuns.length} text runs, ${prodCounts.size} distinct`)
console.log(`prototype  : ${protoRuns.length} text runs, ${protoCounts.size} distinct`)

if (intentional.length > 0) {
  console.log(`\nintentional additions, declared and approved: ${intentional.length} phrase(s)`)
  for (const phrase of intentional) {
    console.log(`   + "${phrase.length > 110 ? phrase.slice(0, 110) + "\u2026" : phrase}"`)
  }
}

if (chrome.length > 0) {
  console.log(`\nexcluded as review chrome (not part of either design): ${chrome.map((c) => `"${c}"`).join(", ")}`)
}

const reallyMissing = report("MISSING FROM PROTOTYPE (production text not found)", missingFromPrototype, protoBlob)
const reallyAdded = report("ADDED IN PROTOTYPE (text production does not have)", addedInPrototype, prodBlob)

console.log("\n" + "=".repeat(64))
if (reallyMissing.length === 0 && reallyAdded.length === 0) {
  console.log("RESULT: identical copy. No wording was changed, added or dropped.")
  process.exit(0)
}
console.log(`RESULT: ${reallyMissing.length} missing, ${reallyAdded.length} added — review each above.`)
process.exit(1)
