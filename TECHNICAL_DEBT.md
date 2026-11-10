# Technical Debt

Active items only. Delete an entry once it is resolved.

---

## Admin two-factor: gaps left on purpose
**Added:** 2026-11-09
**Area:** `src/lib/adminAuth.ts`, `src/app/admin/security`, admin email lists

- **Security limitation (still open):** `ADMIN_MFA_REQUIRED` covers the admin area (every `/api/admin/*` route, admin server actions and admin server pages). It does NOT cover places where an admin email simply skips a client paywall: the access checks in `src/lib/authTokens.ts` (training, nutrition, tracker, masterclass, coaching), `src/lib/productGates.ts`, `src/app/my-coaching/layout.tsx`, `src/app/api/member/access/route.ts`, `src/app/account/page.tsx`, and `/my-plan` in `src/middleware.ts`. An admin account that has NOT set up two-factor can still open paid course content, the client portal for its own account and Lisa's private /my-plan page with only a password. From the code, none of these show other clients' records; the coach's view of clients is all under the admin area, which is covered.
  - **Why it is limited in practice:** once an admin account has set up two-factor, Cognito itself asks for the code at every sign-in, so a password alone gets nowhere on that account. The gap only matters for an admin account that isn't enrolled (for example, right after a lost-phone reset).
  - **Smallest safe fix:** make those bypasses ask the same question the admin area asks. Replace the bare `isAdminEmail(email)` bypass with a server check that uses the session's access token (`adminSessionEmail()` in `src/lib/adminAuth.ts`, which already applies the two-factor rule) in the six places above, so that with enforcement on an unenrolled admin is treated as an ordinary visitor there. Until then: keep both admin accounts enrolled and re-enrol immediately after any reset.
- No QR code on the setup screen. There is no QR library and adding one is a dependency change, so it shows the key in groups of four plus an `otpauth://` link.
- The admin email list is still copied in `src/app/admin/layout.tsx`, `src/middleware.ts` and the messages page instead of importing `ADMIN_EMAILS`.

**Impact:** low while both admin accounts are enrolled; real for an unenrolled admin account even with enforcement on.

**Plan:** route the admin bypasses through `checkAdminAccess` when enforcement is switched on for real; add a QR code if Lisa approves a small dependency.

---

## Direction D still lives under a "preview" path with a `pv-` class prefix
**Added:** 2026-10-21
**Area:** `src/components/preview/d/**`, the `pv-d-*` CSS classes

Direction D is now the live design of every public page, but its components
still sit under `src/components/preview/d` and every class is prefixed
`pv-d-`, which reads as "prototype" to anyone opening the repo.

**Impact:** low, cosmetic, but actively misleading. Someone could reasonably
assume these files are dead and delete them.

**Plan:** rename the folder to `src/components/design/` and the prefix to
`lfm-`. It is a large mechanical diff, so it was deliberately not done in the
same change as the launch.

---

## The unused prototype directions are still in the tree
**Added:** 2026-10-21
**Area:** `src/components/preview/a`, `.../b`, most of `.../c`

Directions A, B and C were review prototypes. Their routes are deleted and
nothing renders them, so they ship no code to visitors, but they are still
type-checked and linted.

**Careful:** `src/components/preview/c/productionCopy.ts` is NOT dead. It is
the single source of the homepage copy and is imported throughout Direction D.
Delete the rest only, never the whole `c` folder.

---

## Both free guides render their body only after hydration
**Added:** 2026-10-21
**Area:** `src/app/free-guide`, `src/app/free-guide-nutrition`

Both pages read `?unlocked=1` with `useSearchParams` inside a Suspense
boundary, so the statically prerendered HTML contains the page shell and
nothing else; the guide fills in on hydration. This predates the redesign —
the live site's HTML has contained none of the guide copy for as long as these
pages have existed — and the redesign deliberately kept the same structure.

**Impact:** two lead-capture pages have no indexable body copy.

**Plan:** read the parameter server-side from the route's `searchParams` prop
instead. It touches lead-capture behaviour, so it wants its own change and its
own test, not a drive-by fix.

---

## A stored activity level of 1.55 is ambiguous
**Added:** 2026-10-21
**Area:** `src/lib/nutrition.ts`, `canonicalActivityLevel`

1.55 was "moderate" on the pre-recalibration five-level scale and is "active"
on the current one. `canonicalActivityLevel` checks the current scale first, so
a stored 1.55 passes through as "active" and the `"1.55": 1.42` entry in
`LEGACY_ACTIVITY_MAP` can never fire. It is the only key that collides.

**Impact:** a client who picked "moderate" on the old scale and has not
re-saved their setup form since is being read as "active" — about 9% more TDEE.
Both readings are defensible and either one moves live client targets, so this
is a decision for Lisa, not a silent fix.

**Plan:** ask Lisa which reading she wants before changing anything.

---

## Testimonial and lead lists still read only the first database page
**Added:** 2026-11-07
**Area:** `api/testimonials`, `components/TestimonialsSection.tsx`, `admin/testimonials/**`, `api/admin/leads`, `api/free-guide`

The coaching lists now page through the whole table (`scanAll`), but these
seven scans were left alone because they belong to the frozen public site or
the separate `lfm-leads` table. The coaching table is already past 1 MB, so
testimonials past the first page can silently disappear.

**Impact:** medium once testimonials grow; the free-guide duplicate check can
miss existing leads.

**Plan:** swap each to `scanAll` (data reading only, nothing visible changes)
once Lisa approves touching those files.

---

## Every coaching list scans the whole table
**Added:** 2026-11-07
**Area:** `src/lib/authTokens.ts`

All coaching records share one table keyed by `userId` prefix, so each list
reads the entire table (two pages today) and filters. Correct now, but cost
and latency grow with the table. `scanAll` logs a warning past 20 pages.

**Impact:** low today (721 records).

**Plan:** add a secondary index on record type / client email and switch the
hot lists (workout logs, nutrition logs, messages) to Query.

## Coach training history for one client is slow
**Added:** 2026-11-09
**Area:** admin client Workouts tab, `src/app/api/admin/coaching/clients/[email]/` workout history

The coach's training history for a single client lists every workout log by
scanning the whole table and filtering by client. On the local test database
(a slow emulator, with large synthetic seed data) the request took about 13
seconds. Production is much faster, but this grows with every logged workout.

**Impact:** the coach Workouts tab can show "Loading" for a while as data
grows. Results are correct; only speed is affected. Tests wait for the content
to appear rather than relying on a fixed delay.

**Plan:** same fix as the entry above (a secondary index so this becomes a
Query for one client), plus measure the real production timing first.
