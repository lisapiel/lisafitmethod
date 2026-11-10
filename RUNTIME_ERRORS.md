# Runtime Errors

Errors where the app ran but failed at runtime, and the rule that stops each
from recurring.

---

## Coach Nutrition target save surfaced "Couldn't reach the server" with no diagnostic

**Date:** 2026-11-10
**Area:** `src/components/coaching/admin/nutrition/api.ts`, `apiCore.ts`, `TargetForm.tsx`, `BackToStartForm.tsx`

Reported on iPhone: tapping "Review change" → "Save new target" surfaced the
generic error "Couldn't reach the server. Nothing was changed." The server
PATCH handler was proven clean end-to-end (reproduced with isolated test data
hitting live DynamoDB — the put/update path writes and the history record
round-trips successfully). The failure came from the client-side `adminJson`
helper:

- `fetchAuthSession()` from Amplify throws, not returns an empty session, when
  a token refresh fails over the network (common on iOS Safari after ITP has
  cleared storage, or during a transient refresh-token outage). The old
  `adminJson` had no catch around it, so Amplify's internal throw bubbled all
  the way to the form's `catch {}` block.
- The same catch also swallowed abort and plain `TypeError: Failed to fetch`
  with the same generic message, so the coach had no way to tell session
  expiry from a connectivity blip.
- There was no fetch timeout, so a Lambda cold start plus a stalled refresh
  could appear as "the server never answered."
- A one-off 401 (stale access token) was reported verbatim instead of being
  retried once with `forceRefresh: true` the way `useAdminFetch` already does
  for GETs.

**Fix:**
`adminJson` now returns a normalised `ApiResult<T>` for every infrastructure
failure (status 0 plus a specific `data.error` message) instead of throwing:
*Your session has expired. Sign in again to continue.* /
*The server took too long to respond. Check your connection and try again.* /
*Couldn't reach the server. Check your connection and try again.* On a 401
response it force-refreshes the token once and retries with the fresh one
before giving up. The pure core (`apiCore.ts`) is independent of Amplify and
has unit tests that cover every branch: session-expired, timeout, offline,
401-retry-success, 401-retry-still-401, server 500, and non-JSON bodies.
Target form and the back-to-start form now show the specific message instead
of a blanket "Couldn't reach the server."

**Rule:** any client helper that wraps an auth call plus `fetch` must catch
both independently and surface a message the user can act on. Mutation
helpers must match the GET helper's robustness (timeout + 401 force-refresh
retry) — the two cannot diverge or a "works when reading, fails when saving"
bug sneaks back in.
