# Product boundaries: coaching first

Lisa Fit Method is Lisa's personal coaching business. Its software supports her coaching: programs, accountability, check-ins and feedback. It is not a nutrition technology product, and it must not grow into one. Ambrisa is Lisa's separate fitness and nutrition technology business, and the two stay clearly apart.

This is a product-development boundary for everyone building the site, people and AI agents alike. It is not legal advice and does not replace a legal review of the two businesses.

Read it together with `PRODUCT.md`, especially the scope of practice: Lisa is a NASM Certified Personal Trainer, not a Registered Dietitian, and nutrition content is general education.

## What the coaching software does

- **Training:** delivers Lisa's programs and records workouts, including sport days.
- **Food logging:** clients log food by typing their own numbers: calories (required), and protein, carbs, fat and a short description (optional), with a date and an optional meal label.
- **Arithmetic only:** totals and averages are plain sums and averages of what clients entered. Unknown values stay unknown and are never counted as zero.
- **Showing progress:** progress against targets that Lisa sets or confirms, with rings, simple charts and weight trends.
- **Helping Lisa coach:** gives her a clear view of each client (nutrition, weight, training, recovery, check-ins) so she can coach.
- **Lisa's own decisions:** her assessments, target changes and program changes are always made, confirmed and recorded by Lisa herself.

## What it deliberately does not do

These are excluded to keep the coaching business focused and to avoid overlap with Ambrisa:

- Food recognition, photo or meal analysis.
- Estimating calories or macros from food descriptions, by any method.
- Chatbot or conversational food logging.
- Food databases, food search or barcode scanning.
- Saved-meal libraries or meal templates.
- Automated meal plans.
- Automated nutrition coaching, dietary recommendations or target changes.
- Client-facing AI wording, or presenting Lisa Fit Method as an automated nutrition platform.

## Grey areas to flag before building

Some features look harmless but edge toward a nutrition product. Raise them with Lisa before building, even when no AI is involved:

- Automatic calorie target formulas. The existing automatic target is a starting point that Lisa reviews; it should not become a recommendation engine.
- Pattern detection beyond simple counts, for example scoring diets or predicting outcomes.
- Turning free text into nutrition numbers, including the one-off recovery of old reports from Messages. That recovery stays a coach-controlled, manual tool for history only.
- Re-log shortcuts or "recent meals", which drift toward saved-meal libraries.
- Anything that would let the platform run without Lisa: automated feedback, automated check-in replies or automated program changes.

When in doubt, ask Lisa. Removing AI wording does not remove the overlap; what matters is what the feature does.
