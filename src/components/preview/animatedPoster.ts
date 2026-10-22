// Animated stand-ins for the four homepage clips.
//
// iOS Low Power Mode refuses to autoplay video at all, so the still frame is
// all a visitor sees until they touch the page. These short, muted, looping
// WebPs are what the still layer switches to in that case: an image, so the
// media autoplay policy does not apply to them, and the section still reads as
// footage rather than a frozen frame.
//
// Keyed by the video's basename, so swapping a clip in the admin for a
// different S3 key simply yields no animation rather than the wrong one.
const ANIMATED = new Set(["lp_trailer", "m1_goblet_squat", "m1_hip_hinge", "m2_rdl"])

export function animatedPosterFor(url: string | null | undefined): string | undefined {
  if (!url) return undefined
  const file = url.split("?")[0].split("/").pop()
  if (!file) return undefined
  const name = file.replace(/\.[a-z0-9]+$/i, "")
  return ANIMATED.has(name) ? `/posters/${name}.webp` : undefined
}
