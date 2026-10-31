import type { CoachingApplication } from "@/lib/authTokens"
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
