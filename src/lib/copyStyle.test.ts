import { test } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import ts from "typescript"

// Client-facing copy follows COPY_GUIDELINES.md: no em dashes in anything a
// client reads. This scans string literals and JSX text only, so code
// comments can keep whatever punctuation they like.
const EM_DASH = "—"

const CLIENT_FACING = [
  "src/app/my-coaching",
  "src/components/portal",
  "src/components/coaching/messages",
  "src/components/coaching/LogFoodModal.client.tsx",
  "src/components/coaching/NutritionComposer.client.tsx",
  "src/app/coaching/accept-terms",
  "src/lib/coachingRecords.ts",
  "src/app/api/admin/coaching/applications",
  "src/app/api/admin/coaching/restart-requests",
  "src/app/api/admin/coaching/send-waiver-link",
  "src/app/api/admin/coaching/check-ins",
  "src/app/api/coaching/accept-terms",
  "src/app/api/coaching/invite-setup",
]

// grant-access and backfill-payment send payment-confirmation emails. They are
// billing code and are reworded separately, with Lisa's go-ahead, not in a copy pass.

// Keep this tiny. Each entry needs a reason.
const ALLOWED = new Set([
  // A lone dash is the "no value yet" placeholder in narrow set, RPE and goal inputs. It is not a sentence.
  `"${EM_DASH}"`,
  `${EM_DASH}`,
  // The Stripe product name on the coaching checkout. Billing is outside the copy rules.
  `"1:1 Coaching ${EM_DASH} Lisa Fit Method"`,
])

const TEXT_KINDS = new Set([
  ts.SyntaxKind.StringLiteral,
  ts.SyntaxKind.NoSubstitutionTemplateLiteral,
  ts.SyntaxKind.TemplateHead,
  ts.SyntaxKind.TemplateMiddle,
  ts.SyntaxKind.TemplateTail,
  ts.SyntaxKind.JsxText,
])

function sourceFiles(target: string): string[] {
  const full = path.join(process.cwd(), target)
  if (!fs.existsSync(full)) throw new Error(`Copy scan path is missing: ${target}`)
  if (fs.statSync(full).isFile()) return [full]
  return fs.readdirSync(full, { recursive: true, encoding: "utf8" })
    .filter((f) => /\.tsx?$/.test(f) && !f.endsWith(".test.ts"))
    .map((f) => path.join(full, f))
}

function emDashesIn(file: string): string[] {
  const text = fs.readFileSync(file, "utf8")
  if (!text.includes(EM_DASH)) return []
  const kind = file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, kind)
  const found: string[] = []
  const visit = (node: ts.Node) => {
    if (TEXT_KINDS.has(node.kind)) {
      const literal = node.getText(source).trim()
      if (literal.includes(EM_DASH) && !ALLOWED.has(literal)) {
        const { line } = source.getLineAndCharacterOfPosition(node.getStart(source))
        found.push(`${path.relative(process.cwd(), file)}:${line + 1}  ${literal.slice(0, 100)}`)
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  return found
}

test("client-facing copy has no em dashes", () => {
  const files = CLIENT_FACING.flatMap(sourceFiles)
  assert.ok(files.length > 20, "the scan should cover the client portal")
  const found = files.flatMap(emDashesIn)
  assert.deepEqual(found, [], `Rewrite these without an em dash (see COPY_GUIDELINES.md):\n${found.join("\n")}`)
})
