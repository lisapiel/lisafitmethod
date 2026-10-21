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
