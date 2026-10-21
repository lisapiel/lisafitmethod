# Technical Debt

Active items only. Delete an entry once it is resolved.

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
