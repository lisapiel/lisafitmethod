# Terms of Use: bundle coaching credit (draft for Lisa)

This is a draft only. Nothing on the live Terms page has changed. It covers
the "Complete Foundations Bundle coaching credit" section of
`src/app/terms/page.tsx` and nothing else; every other line of the Terms stays
as it is.

## Current section (verbatim, as live)

```tsx
          <h3>Complete Foundations Bundle coaching credit</h3>
          <p>Purchasers of the Complete Foundations Bundle may apply a $137 coaching credit toward their first coaching payment, subject to the following:</p>
          <ul>
            <li>To claim the credit, your coaching application must be submitted within 90 days of your bundle purchase date. You are not required to begin coaching within those 90 days; only the application must be submitted within that window. Holding this credit does not guarantee acceptance into 1:1 coaching.</li>
            <li>If your application is accepted, the $137 credit is applied toward your first monthly coaching payment.</li>
            <li>The credit has no cash value and is non-transferable.</li>
            <li>The credit may not be combined with another promotional coaching credit or discount unless Lisa Fit Method expressly permits it.</li>
          </ul>
```

Note: the current Terms do not say the credit is for the 3-month option only,
although the site copy and the code have always said so.

## Proposed replacement

Replace `[EFFECTIVE DATE]` with the date the updated Terms are published, in
the same "Month D, YYYY" form as `LAST_UPDATED`.

```tsx
          <h3>Complete Foundations Bundle coaching credit</h3>
          <p>Purchasers of the Complete Foundations Bundle may receive a coaching credit toward their first coaching payment, subject to the following:</p>
          <ul>
            <li>The credit equals the amount you actually paid for the Complete Foundations Bundle, less any amount refunded to you. If the bundle payment is fully refunded, or is reversed through a payment dispute, no credit is available.</li>
            <li>To claim the credit, your coaching application must be submitted within 30 days of your bundle purchase date. You are not required to begin coaching within those 30 days; only the application must be submitted within that window. Holding this credit does not guarantee acceptance into 1:1 coaching.</li>
            <li>If you purchased the Complete Foundations Bundle before [EFFECTIVE DATE], you keep the 90-day application window that applied when you purchased it.</li>
            <li>The credit applies only to the 3-month commitment option. It does not apply to month-to-month coaching.</li>
            <li>If your application is accepted, the credit is applied once, to the first monthly payment of your 3-month coaching, and never for more than the amount of that payment. Any part of the credit larger than that payment is not carried forward.</li>
            <li>The credit applies to your first coaching enrollment only. It does not apply to a renewal, a restart after coaching has ended, or a change to an existing coaching price.</li>
            <li>If Lisa Fit Method offers you a custom coaching price, the credit is not combined with that price automatically. Lisa Fit Method will confirm before you pay whether the credit applies.</li>
            <li>The credit has no cash value and is non-transferable.</li>
            <li>The credit may not be combined with another promotional coaching credit or discount unless Lisa Fit Method expressly permits it.</li>
          </ul>
```

## What else changes when this is published

All on the same day, in one deploy:

1. `src/app/terms/page.tsx`: the section above, and `LAST_UPDATED` set to the
   publication date.
2. `src/lib/authTokens.ts`: bump `TERMS_VERSION` from `"2026-08-12-v2"` to the
   publication date, for example `"2027-01-15"`, and tag the old copy
   `terms-2026-08-12-v2` as the bump policy in that file requires.
   **Side effect:** `src/app/my-coaching/layout.tsx` compares each client's
   accepted version with `TERMS_VERSION`, so every current coaching client is
   asked to re-accept the Terms the next time they open the portal. If Lisa
   would rather not ask current clients to re-accept for a change that only
   affects new bundle buyers, that gate needs a decision before the bump.
3. `src/lib/bundleCredit.ts`: set `BUNDLE_CREDIT_30_DAY_CUTOVER` to the same
   publication date (midnight New York time, as an ISO instant). Until then it
   is a placeholder in 2099, so every purchase keeps 90 days.
4. Ship the public wording commit ("Describe the bundle credit as what you
   paid…") in the same deploy, so the site and the Terms say the same thing.
