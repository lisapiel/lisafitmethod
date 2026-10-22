// Run something on the first real user gesture in the document.
//
// iOS refuses video autoplay outright in Low Power Mode, and in several
// other states, no matter what the markup says. What it does allow is
// playback started from a user gesture — and one gesture anywhere unlocks
// media for the whole document, which is why a video that will not start on
// a cold load starts after the visitor taps a link and comes back: a Next
// app is one document, so that tap already counted.
//
// This lets a refused video quietly start the moment the visitor touches the
// page, instead of sitting on its still frame until they tap the video
// itself. Nothing is rendered and nothing moves.
const listeners = new Set<() => void>()
let armed = false
let fired = false

const EVENTS = ["pointerdown", "touchend", "click", "keydown"] as const

function handle() {
  fired = true
  for (const fn of listeners) fn()
  listeners.clear()
  for (const type of EVENTS) document.removeEventListener(type, handle)
  armed = false
}

export function onFirstGesture(fn: () => void): () => void {
  if (typeof document === "undefined") return () => {}
  // A gesture has already happened in this document, so media is unlocked
  // and the caller can go straight away.
  if (fired) {
    fn()
    return () => {}
  }
  listeners.add(fn)
  if (!armed) {
    armed = true
    for (const type of EVENTS) document.addEventListener(type, handle, { passive: true })
  }
  return () => listeners.delete(fn)
}
