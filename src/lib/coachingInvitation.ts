import { listCoachingApplications, type CoachingApplication } from "@/lib/authTokens"
import { resolveOwnerEmail } from "@/lib/accountLinks"
import type { SessionUser } from "@/lib/sessionUser"

// The account an approved application belongs to. Until someone links it, that
// is simply the address they applied under.
export function applicationOwnerEmail(application: CoachingApplication): string {
  return (application.ownerEmail ?? application.email).trim().toLowerCase()
}

// What the signed-in visitor is allowed to do with this invitation.
//
//   owner     — this is their invitation; they may accept and pay.
//   linkable  — a real account, but a different address from the one invited.
//               They hold the link, which was emailed to the applicant, and
//               they have authenticated. Those two together are what lets them
//               claim it; neither alone is enough, and names are never used.
//   foreign   — the invitation already belongs to a different account. Nothing
//               on offer, because claiming it would be a takeover.
export type InvitationAccess = "owner" | "linkable" | "foreign"

export async function resolveInvitationAccess(
  application: CoachingApplication,
  user: SessionUser,
  // Swappable so the rule can be exercised without the database.
  lookupOwner: (email: string) => Promise<string> = resolveOwnerEmail,
): Promise<InvitationAccess> {
  const owner = applicationOwnerEmail(application)
  const visitor = user.email.trim().toLowerCase()
  if (visitor === owner) return "owner"

  // An address already linked to the owning account counts as the owner.
  const visitorOwner = await lookupOwner(visitor)
  if (visitorOwner === owner) return "owner"

  // Already claimed by someone else — an explicit owner that is not this
  // visitor is settled, and is not re-assignable from the web.
  if (application.ownerEmail && application.ownerEmail.trim().toLowerCase() !== visitor) {
    return "foreign"
  }

  return "linkable"
}


export type InvitationSummary = {
  applicationId: string
  status: CoachingApplication["status"]
  applicantEmail: string
  approvedPriceInCents?: number
  approvedCommitmentType?: CoachingApplication["approvedCommitmentType"]
}

// The coaching application this account owns, if any.
//
// Ownership is checked first, then the applicant address, then any address
// linked to this account — so someone who applied under a second address sees
// their enrolment on the dashboard of the account they actually sign in to.
//
// Only one application is returned: whichever is furthest along, so a stray
// older application cannot mask a live one.
const STAGE: Record<string, number> = { PAID: 4, APPROVED: 3, PENDING: 2, DECLINED: 1 }

export async function findCoachingInvitationForAccount(
  email: string,
  linkedEmails: string[] = [],
  // Swappable so the selection rule can be exercised without the database.
  loadApplications: () => Promise<CoachingApplication[]> = listCoachingApplications,
): Promise<InvitationSummary | null> {
  const owner = email.trim().toLowerCase()
  const mine = new Set([owner, ...linkedEmails.map((e) => e.trim().toLowerCase())])

  let applications: CoachingApplication[]
  try {
    applications = await loadApplications()
  } catch {
    return null
  }

  const candidates = applications.filter((app) => {
    const explicitOwner = app.ownerEmail?.trim().toLowerCase()
    if (explicitOwner) return mine.has(explicitOwner)
    return mine.has(app.email.trim().toLowerCase())
  })
  if (candidates.length === 0) return null

  candidates.sort((a, b) => {
    const byStage = (STAGE[b.status] ?? 0) - (STAGE[a.status] ?? 0)
    if (byStage !== 0) return byStage
    return (b.applicationDate ?? "").localeCompare(a.applicationDate ?? "")
  })
  const best = candidates[0]
  if (best.status === "DECLINED") return null

  return {
    applicationId: best.id,
    status: best.status,
    applicantEmail: best.email,
    approvedPriceInCents: best.approvedPriceInCents,
    approvedCommitmentType: best.approvedCommitmentType,
  }
}
