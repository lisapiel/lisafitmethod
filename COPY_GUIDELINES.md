# Copy guidelines: client-facing text

These rules cover every word a coaching client reads in the platform: the client portal (`/my-coaching`), workout runner, check-ins, progress, food, messages, setup, and the automated emails and notifications sent to clients. Read them before you write or change any of that text.

## The voice

The platform should sound like Lisa, an experienced personal trainer, talking to her client. She speaks in the first person ("I", "me") wherever it fits. She is friendly, calm and professional. She explains things plainly and doesn't hype.

Lisa's own example of the tone:

> Since you're getting back into training, we'll ease into it this week. Do one less set than prescribed for your first three exercises, and choose weights that leave you about 3 reps before failure. Next week, you can return to the full number of sets while keeping about 2 reps in reserve. From week 3, we'll gradually push a little harder as long as everything feels good.

## Writing standards

- **No em dashes (—)** in any sentence the platform writes. Don't use en dashes (–) as sentence dashes either. Rewrite the sentence instead. Don't just swap in a hyphen or join two sentences with a comma. A number range such as "0.3–0.4 g" or "RPE 1–10" is fine.
- A lone dash used only as a "no value" placeholder in a narrow data cell or input may stay. Prefer words ("None yet", "Not logged") wherever there's room.
- Write complete, grammatical sentences. Keep them short and easy for a beginner.
- Friendly, professional and conversational. Not stiff, not corporate, not hype.
- No motivational clichés and no repeated encouragement ("Nice work." once is enough; three times on one screen is a bot).
- No "AI-polished" phrasing: no "not X, but Y" constructions, no colon reveals, no "worth noting", no scare quotes, no symbols standing in for words ("+", "=", "/", "~").
- Keep essential training terms (sets, reps, RPE, reps in reserve, warm-up). Explain them gently where a beginner could get lost.
- Say "I" and "me" for Lisa. Use "Lisa" only where a name is needed, such as a sender label or an email signature.
- Emojis rarely, and only tasteful ones.
- **Never change meaning.** Exercises, sets, reps, loads, intensity, progression, rest, safety or medical cautions, prices, dates and numbers stay exactly as they are.
- Keep labels and buttons about the same length so they still fit on a phone. Don't rename navigation labels (Home, Workouts, Food, Progress, Messages, Check-in) or core buttons (Log food, Save, Save sport day, Start workout, Send message) without Lisa's approval.

## Do and don't (real examples)

| Don't | Do |
| --- | --- |
| Your check-in is with Lisa. She'll send feedback soon. | Your check-in is with me. I'll send you feedback soon. |
| Anchor every meal with protein. Carbs, fats, and veg build around it. Aim for ~1g per lb of bodyweight across the day. | Build each meal around a source of protein, then add your carbs, fats and vegetables. Aim for about 1 g of protein per pound of body weight across the day. |
| Fat loss = weekly average slightly under target; muscle gain = slightly over. | If your goal is fat loss, keep your weekly average slightly under your target. If it's muscle gain, keep it slightly over. |
| Water + sleep are levers | Water and sleep count too |
| Fill in only what you measured. Blank fields are ignored. | Only fill in what you measured. You can leave the rest blank. |
| Could not do another rep. Failure. | You couldn't do another rep. This is failure. |
| Enter a valid age (16–100) | Please enter an age between 16 and 100. |
| Lisa is reviewing your check-in to set goals... Let her know. | I'm going through your check-in so your goals fit where you are now and where you want to go. If you already have specific goals in mind, tell me. |
| Payment confirmed — your coaching portal is now active. | Your payment is confirmed and your coaching portal is now active. |
| Your invitation itself doesn't expire — if you need another, just ask. | Your invitation itself doesn't expire, so if you need another link, just ask. |

## Don't touch

- Anything a client wrote: check-in answers, notes, messages, food entries.
- Historical records and stored data, including old messages and feedback already sent.
- Exercise names and program names stored in data.
- Legal text: privacy policy, terms, waiver wording, licensing.
- Public marketing pages (home, about, blog, coaching sales page, courses, free guides, FAQ, contact). Their copy is locked by `scripts/copy-baseline/` and checked by `node scripts/verify-copy.mjs`.
- The Log food note, which stays exactly: "Keep it simple! You can log your daily totals all at once at the end of the day, or add meals and snacks throughout the day. Whatever works best for you 😊"
- The Messages placeholder "Message me".
- Billing, payment and Stripe text (checkout, subscription, cancellation and refund emails) unless Lisa asks.

## How to check

The unit test `src/lib/copyStyle.test.ts` scans the client-facing folders for em dashes inside string literals and JSX text, and fails if it finds one. It runs with the rest of the tests:

```
npx tsx --test $(find src -name "*.test.ts")
```

For a quick manual look (this also lists code comments, which are fine):

```
grep -rn "—" src/app/my-coaching src/components/portal src/components/coaching/messages
```

If you add a new client-facing folder or email, add it to the list in `copyStyle.test.ts`. Keep its allowlist tiny, and give every entry a reason.
