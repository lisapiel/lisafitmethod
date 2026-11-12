# Logic Bugs

Bugs where the code ran without error but did the wrong thing, and the rule
that stops each from recurring.

---

## "Keep my coaching" left the cancellation on the client record
**Date:** 2026-11-12 (found in review; fix on `feat/billing-cancel-rca`, not yet live)
**Area:** `src/app/api/coaching/reactivate/route.ts`, `src/lib/authTokens.ts`

After a paying client scheduled a cancellation and then chose "Keep my
coaching", Stripe's cancellation was removed, but the route cleared the client
record by setting the cancellation fields to `undefined`.
`updateCoachingClientRecord` skips undefined values, so nothing was removed.
On the next visit the account page could again show "Cancellation scheduled"
while Stripe kept renewing, and the client had no way to cancel from the page.

**Fix:** `clearCoachingCancellation` removes the fields with a DynamoDB
`REMOVE`, and the billing record's confirmed cancellation is cleared too
(`clearPaidCancel`). The page reads "scheduled" from Stripe, not from the
old record field.

**Rule:** never clear a stored field by passing `undefined` to
`updateCoachingClientRecord`; use a `REMOVE` helper. When a page shows billing
state, take it from Stripe or the billing record, not a copy that can go stale.

## The client's weekly food averages were judged against today's target
**Date:** 2026-11-12
**Area:** `src/components/portal/FoodWeek.tsx` (before), `src/lib/nutritionAnalytics.ts`

The Food page's "Last 7 days" boxes divided the weekly calorie and protein
averages by the client's current target. If Lisa changed the target during
the week, days logged under the old target were scored against the new one.
For example, five days averaging 1,978 kcal under targets that averaged 1,970
showed as 107% and over target against a new 1,850.

**Fix:** `averagesAgainstTargets` pairs each average with the mean of the
per-day `targetAtLog` snapshots over exactly the days behind that average.
For a macro, those are only the days where it was logged. The weekly view says
when targets changed. Averages themselves still come from `summarizePeriod`.

**Rule:** any comparison of past intake with a target uses the target
snapshotted on those days (`DailyTotals.target`), never the current target alone.

## Stripe webhook acknowledged failures and repeated work
**Date:** 2026-11-11
**Area:** `src/app/api/stripe/webhook/route.ts`, `src/lib/stripeEventLedger.ts`, `src/lib/sendOrThrow.ts`, `src/lib/entitlementAudit.ts`, `src/lib/bundleCreditWebhook.ts`

Several steps caught their own errors and the webhook still answered 200, so
Stripe never retried them: cancellation revokes, marking an application paid,
the bundle purchase record, credit release for an expired checkout, and the
dispute credit sync. No code read Resend's result, and Resend reports most
failures in the result rather than throwing, so a failed welcome or
set-password email counted as sent. There was no record of handled event ids,
so a repeated delivery re-sent emails. Cancellation stored the time the webhook
ran as the effective date. A late cancellation of an old subscription could end
a restarted client's access. Payment-failed emails read the subscription from
one payload location only (`invoice.subscription`). The live endpoint uses API
version `2026-04-22.dahlia`, where that field no longer exists, so every
`invoice.payment_failed` event was acknowledged and ignored. Neither the
client's payment-problem email nor the admin alert was ever sent (confirmed
2026-11-12 against the endpoint settings). A lost dispute whose charge could not
be fetched was treated as "no charge".

Making failures retryable exposed retry hazards, also fixed: nutrition and
masterclass provisioning treated any existing login as ready, so a retry after
a failed welcome would send an email with no set-password link; a coaching
retry stopped at "already active" and never sent the welcome; a repeated refund
revocation overwrote its audit row with an empty previous grant.

**Fix:** an event ledger (`stripe_event_<id>`) runs each event once, releases
it on failure and is retried before giving up on "done", with an admin alert if
it never records. Customer emails throw on a Resend error and are sent at most
once per event. State-changing failures return 500. Cancellation uses Stripe's
`ended_at`, ignores a subscription other than the one on file, and payment
failures use the shared invoice lookup. Provisioning checks for a CONFIRMED
login, coaching keeps a `welcomeEmailPending` marker until the welcome is sent,
and the revocation audit row is write-once.

**Rule:** a webhook answers 2xx only when every state change it is responsible
for has happened. Every external send has its result checked. Any step that can
run twice on a retry must be safe to run twice, and that is tested.

---

## The check-in sent clients away and lost their answers
**Date:** 2026-11-10
**Area:** `src/app/my-coaching/check-in/page.client.tsx`, `src/lib/checkInDraft.ts`

The Nutrition step had a link to the food log. Following it (or tapping any
tab, reloading, or the phone closing the app) threw away every answer, because
the check-in lived only in React state. Separately, the clean-up effect that
revoked video preview URLs ran on every change to the form reviews, so typing a
note revoked the previews of videos still in the form.

**Fix:** the link is gone. The in-progress check-in autosaves to localStorage
under `lfm:check-in-draft:v1:<email>:<last check-in submittedAt or "first">`,
including uploaded form-review video keys, restores with a short note, clears
after a successful submit, and drops drafts from older periods. A
`beforeunload` warning covers reloads and closing the tab while answers are
unsent. Previews are revoked only on unmount.

**Rule:** a multi-step form that takes more than a minute keeps a local draft,
and never links out of itself mid-flow. Cleanup effects that free resources run
on unmount, not on every state change.

---

## Bundle credit was a fixed $137, marked used without being applied, and could be faked
**Date:** 2026-11-10
**Area:** `src/lib/bundleCredit*.ts`, `src/lib/coachingCheckout.ts`, `src/app/api/stripe/webhook/route.ts`, `src/lib/customerHistory.ts`

The coaching credit was always $137, even when a promo code or a refund meant
the buyer paid less. It was marked used on every coaching activation, so a
month-to-month client, a custom-price client or a failed coupon still burned
it, and the unconditional update created a fake `bundle_purchase_<email>`
record for coaching clients who never bought the bundle, which the customer
history then showed as a purchase. Two applications could each carry a coupon,
and the approval screen subtracted $137 whatever the commitment.

**Fix:** the rules live in one pure module (`bundleCredit.ts`) used by the
form, admin screens, checkout and webhook. The credit is the net amount kept
(paid less refunds, lost dispute = refunded), only on the 3-month option, only
for a first coaching payment, capped at that payment. Checkout holds it for one
application with a conditional write before creating the coupon; only a paid
invoice whose bundle coupon actually took money off marks it used. Records
without a PaymentIntent id are not purchases, and no write creates one except
the bundle payment webhook. Custom prices need Lisa's explicit tick.

**Rule:** a credit or entitlement is marked consumed only by the event that
proves it was consumed (the paid invoice), never by a step that merely
expects it to be. Writes to an existing record must require it to exist.

---

## Setup saved an activity level that isn't one of the options
**Date:** 2026-11-09
**Area:** `src/app/my-coaching/setup/page.client.tsx`, `src/app/api/coaching/setup/route.ts`

The setup page started the activity level at 1.35, a value from the old scale
that is none of the five current options. Nothing looked selected, and a
client who didn't tap one saved 1.35 without choosing, which the calculator
then read as Lightly Active. The API accepted any number from 1.2 to 1.9.

**Fix:** nothing is preselected and the client must pick an option before
saving. The API accepts only the five current values for a new save (legacy
stored values still read through `canonicalActivityLevel`). Once goal and
activity are saved, setup can't change them; the client sends a request and
the coach reviews it (`src/lib/profileRequests.ts`).

**Rule:** a default for a choice that changes someone's numbers must be one of
the options shown, or there must be no default at all. Validate against the
option list, not a numeric range.

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

---

## Setup showed an editable starting weight that was never saved
**Date:** 2026-11-09
**Area:** `src/app/my-coaching/setup/page.client.tsx`, `src/app/api/coaching/setup/route.ts`

Setup saves the typed weight as `startingWeight` only the first time. The page
still pre-filled the box with the saved value and let the client change it, so
an edit went through as a normal save and was silently dropped. Nobody,
including the coach, had a way to correct a wrong starting weight.

**Fix:** once a starting weight exists, setup shows it read-only with a note
to message Lisa, and doesn't send a weight. The API ignores a different weight
from a stale page and returns `startingWeightKept: true`, and the page says so
instead of moving on. Lisa corrects starting weights from the coach Nutrition
tab, with a required reason and a `starting_weight_change_<id>` history.

**Rule:** a form never offers an edit the server will ignore. If a value is
write-once for the client, show it read-only and name who can change it.
