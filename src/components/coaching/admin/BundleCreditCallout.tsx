import type { CommitmentType } from "@/lib/authTokens"
import { CREDIT_BLOCK_TEXT, formatCents, planBundleCredit, type CreditFacts, type CreditPlan } from "@/lib/bundleCredit"

export type ListCreditFacts = { facts: CreditFacts; storedChoice: boolean | null } | null | undefined

const gold = "#c9a96e"
const green = "#5c9e6a"
const border = "#2a2a2a"
const cream = "#f0e6d3"
const muted = "#888"

export function priceCentsFrom(priceStr: string | undefined): number | null {
  const n = parseFloat(priceStr ?? "")
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : null
}

// Runs the shared credit rules on the list's facts with whatever Lisa has
// picked so far. The approval screen re-checks against Stripe.
export function listCreditPlan(credit: ListCreditFacts, commitment: CommitmentType | null, priceCents: number | null, applyChoice?: boolean | null): CreditPlan | null {
  if (!credit) return null
  return planBundleCredit({
    ...credit.facts,
    now: new Date().toISOString(),
    commitmentType: commitment,
    priceCents,
    applyChoice: applyChoice !== undefined ? applyChoice : credit.storedChoice,
  })
}

function formatDay(day: string): string {
  return new Date(`${day}T12:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}

const box = { padding: "10px 14px", marginBottom: 10, fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", letterSpacing: "0.04em" } as const

export function BundleCreditCallout({ credit, isPending, commitment, priceCents }: {
  credit: ListCreditFacts
  isPending: boolean
  commitment: CommitmentType | null
  priceCents: number | null
}) {
  const base = listCreditPlan(credit, null, null)
  const payment = credit?.facts.payment
  if (!base || !payment || payment.state === "none") {
    return <div style={{ ...box, background: "#111", border: `1px solid ${border}`, color: muted }}>No bundle purchase on file</div>
  }

  const usage = credit.facts.usage
  if (usage.usedAt) {
    return (
      <div style={{ ...box, background: "#1a1512", border: `1px solid ${border}`, color: muted }}>
        Bundle credit already used
        {base.purchasedAt && <span style={{ color: "#555" }}> · Purchased {formatDate(base.purchasedAt)}</span>}
        <span style={{ color: "#555" }}> · Used {formatDate(usage.usedAt)}{usage.usedAmountCents ? ` (${formatCents(usage.usedAmountCents)})` : ""}</span>
      </div>
    )
  }

  if (payment.state === "unverified") {
    return (
      <div style={{ ...box, background: "#1a1512", border: `1px solid ${gold}`, color: cream }}>
        Bundle purchase on file{base.purchasedAt ? ` from ${formatDate(base.purchasedAt)}` : ""}. The amount needs checking with Stripe. The approval screen does that before anything is sent.
      </div>
    )
  }

  if (!base.eligible) {
    return (
      <div style={{ ...box, background: "#1a1512", border: `1px solid ${border}`, color: muted }}>
        Bundle purchased{base.purchasedAt ? ` ${formatDate(base.purchasedAt)}` : ""} · No credit: {base.blocks.map((b) => CREDIT_BLOCK_TEXT[b]).join(" ")}
      </div>
    )
  }

  const selected = listCreditPlan(credit, commitment, priceCents)
  const willApply = isPending && !!selected?.apply && selected.appliedCents > 0
  const action = !isPending
    ? "Applies to 3-month coaching only · not yet used"
    : commitment === "MONTH_TO_MONTH"
      ? "Not applied. Month-to-month coaching isn't eligible"
      : commitment !== "THREE_MONTH_MINIMUM"
        ? "Select the 3-month commitment to apply this credit"
        : !selected || selected.firstMonthCents === null
          ? "Enter a price to see the first month"
          : selected.apply
            ? `Comes off the first month: the client pays ${formatCents(selected.firstMonthCents)} for month one`
            : "Custom price, so the credit is off unless you turn it on when you approve"

  return (
    <div style={{
      ...box,
      background: willApply ? "rgba(92,158,106,0.10)" : "rgba(201,169,110,0.10)",
      border: `1px solid ${willApply ? green : gold}`,
      borderLeft: `4px solid ${willApply ? green : gold}`,
      letterSpacing: undefined,
    }}>
      <p style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: willApply ? "#7bc48c" : gold, margin: "0 0 4px" }}>
        {formatCents(base.eligibleCreditCents)} bundle credit {isPending ? "available" : "on file"}
      </p>
      <p style={{ fontSize: "0.68rem", color: cream, margin: "0 0 2px", lineHeight: 1.55 }}>
        Purchased {base.purchasedAt ? formatDate(base.purchasedAt) : "(date unknown)"} · Applied within the {base.windowDays}-day window{base.applyBy ? ` (it closes ${formatDay(base.applyBy)})` : ""} · 3-month coaching only
      </p>
      <p style={{ fontSize: "0.65rem", color: willApply ? "#7bc48c" : "#c78e5a", margin: 0, fontWeight: 600, letterSpacing: "0.04em" }}>
        {action}
      </p>
    </div>
  )
}
