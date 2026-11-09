# Logic Bugs

Bugs where the code ran without error but did the wrong thing, and the rule
that stops each from recurring.

---

## ToneShift was passed tone names instead of ground colours
**Date:** 2026-10-21
**Area:** `src/components/preview/d/FlowD.tsx`, the Direction D inner pages

`ToneShift` takes the ground colour either side of a transition. The new
inner pages passed the words `"dark"` and `"light"`. Nothing threw: the
gradient became `linear-gradient(to bottom, dark 0%, light 100%)`, which is
invalid and silently paints nothing, and the internal `isDark()` check
compared the word against `#0a0a0a` and decided both halves were light. Every
transition on those pages rendered as a stranded hairline in empty space
instead of a dissolve, and the navigation could sample the wrong tone while
crossing one.

**Fix:** `ToneShift` now accepts a tone name as well as a colour and resolves
it to the ground token.

**Rule:** when a prop takes a colour but the obvious thing to pass is a name,
accept both. A component that silently does nothing for a plausible input is
a trap — an invalid CSS value never raises.

---

## A Reveal wrapper placed a div inside a ul
**Date:** 2026-10-21
**Area:** `src/components/preview/d/Sections.tsx`

`Reveal` always renders a `div`, so wrapping each `<li>` in one produced
`ul > div > li`. TypeScript accepted it and the page looked fine.

**Rule:** `Reveal` renders a div. It cannot wrap a list item, a table row, or
any element whose parent restricts its children. Wrap the whole list instead.

---

## Reveal silently drops props it does not declare
**Date:** 2026-10-21
**Area:** `src/components/preview/d/GuideD.client.tsx`

`data-tone="dark"` was set on a `Reveal`. JSX allows hyphenated attributes
without type-checking them, and `Reveal` does not spread unknown props, so the
attribute vanished and the navigation did not invert over that dark panel.

**Rule:** `data-tone` must sit on a real element, never on `Reveal`.

---

## compare-copy ignored repeated flags and compared page titles
**Date:** 2026-10-21
**Area:** `scripts/compare-copy.mjs`

Two faults in the copy-fidelity tool itself, which is the thing the redesign's
"zero unapproved copy changes" guarantee rests on:

1. `readList` used `.find()`, so a second `--additions=` file was ignored
   without a word. The homepage check had been running without its own
   declaration list.
2. The tool strips `<head>` because a document title is not visible copy, but
   Next renders the title into the body, so titles were being compared anyway
   and had to be papered over with declaration lists.

**Rule:** a verification tool that silently ignores part of its input is worse
than no tool. When a flag can repeat, read all of it.

---

## Coaching lists read only the first page of the database
**Date:** 2026-11-07
**Area:** `src/lib/authTokens.ts` list functions, `api/admin/coaching/restart-requests`

Thirteen coaching list functions and the restart-requests route ran a single
DynamoDB Scan. A Scan stops after 1 MB of the table *before* the filter runs,
so once the table passed 1 MB (1.39 MB on 2026-11-07) records beyond the first
page silently vanished: 2 of 9 clients, 29 of 92 workout logs, 137 of 490
exercises and 5 of 19 programs were invisible in the app. Nothing errored.

**Fix:** every list now goes through `scanAll` in `src/lib/dynamoScan.ts`,
which follows `LastEvaluatedKey` to the end.

**Rule:** never call `ScanCommand` directly for a list. Use `scanAll`. A
filtered scan returning few or no items does not mean there are no more.

---

## Workout "complete" screen shown when the save failed
**Date:** 2026-11-07
**Area:** `src/app/my-coaching/workouts/[weekId]/[dayIndex]/page.client.tsx`

`finishWorkout` set `saved` whether or not the request succeeded, and a
network error threw past it. A client could see "Workout complete!" with
nothing stored. A retry would also have created a second log.

**Fix:** success is shown only when the server returns the stored log. Each
workout attempt carries a `submissionId` kept in the draft; the server derives
the record id from it with a conditional write, so retries and double taps
store one log and send one coach email.

**Rule:** never show success before the server confirms it, and make any
client-retried write idempotent.

---

## The coach's reply box rendered below the screen
**Date:** 2026-11-09
**Area:** `src/app/admin/coaching/clients/[email]/messages/page.tsx`

The message panel was a fixed `min(100dvh - 96px, 760px)` tall, but it sits
under the client workspace header (about 400px). The reply box at the bottom
of the panel landed below the fold on every device, so a short or empty
conversation looked like it had no way to reply or start a conversation. The
inbox also listed only existing threads, so a client who had never messaged
could not be reached from it. Tests passed because they checked the box
existed and sent coach messages through the API, never that a person could
see and use the box.

**Fix:** size the panel to the space actually left below its top edge, clear
of the phone bottom bar (`useFitToViewport`), and add "Message any client" to
the inbox. `e2e-messaging.mjs` checks on desktop, laptop and two iPhones that
the box is in the viewport and uncovered, then sends through the screen.

**Rule:** a browser test for any input a person must use asserts it is inside
the viewport and not covered (`elementFromPoint`), and performs the action
through the UI, not only the API.

---

## Progress showed the setup weight as the current check-in weight
**Date:** 2026-11-09
**Area:** `src/app/my-coaching/progress/page.client.tsx`, `src/app/my-coaching/page.client.tsx`, coach Progress tab

The panel titled "Weight from your check-ins" prepended the setup starting
weight as its first point, dated at sign-up, and ignored weights logged on the
Progress page. A client with no check-ins saw the setup value as "Current"
while their real logged weight appeared lower on the same page. Date-only
values were also parsed as UTC midnight, so they showed a day early in US
time zones.

**Fix:** one shared `buildWeightHistory` (check-ins plus logged weights,
validated and date-ordered) used by Home, Progress and the coach tab. The setup
weight is shown on its own labelled line and never counted as a weigh-in.
Change appears only with two or more weigh-ins. Date-only values are read as
the local calendar day.

**Rule:** every weight shown to a client comes from `buildWeightHistory`. A
profile value is never presented as a measurement, and date-only strings are
never passed straight to `new Date()`.
