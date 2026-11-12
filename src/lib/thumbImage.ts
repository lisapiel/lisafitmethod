import { RESIZE_QUALITY, RESIZE_WIDTHS, exerciseCdnBase } from "./imageSources"

const CDN = exerciseCdnBase(process.env.NEXT_PUBLIC_AMBRISA_CDN_URL)

export function resizedUrl(src: string, width: number): string {
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${RESIZE_QUALITY}`
}

function snap(px: number): number {
  return RESIZE_WIDTHS.find((w) => w >= px) ?? RESIZE_WIDTHS[RESIZE_WIDTHS.length - 1]
}

// `box` is the largest size the picture is drawn at, in CSS pixels. Each
// request is wide enough that a picture up to 16:9 still fills that box on
// 1x, 2x and 3x screens, so nothing is upscaled or drawn smaller than before.
// The resizer keeps the original shape; it never crops or stretches.
// Anything not on the exercise CDN is returned unchanged.
export function thumbSources(src: string, box: { w: number; h: number }, cdn: string | null = CDN): { src: string; srcSet?: string } {
  if (!src || !cdn || !src.startsWith(`${cdn}/`) || src.includes("?")) return { src }
  const need = Math.max(box.w, Math.ceil((box.h * 16) / 9))
  const [x1, x2, x3] = [1, 2, 3].map((d) => snap(need * d))
  return {
    src: resizedUrl(src, x2),
    srcSet: `${resizedUrl(src, x1)} 1x, ${resizedUrl(src, x2)} 2x, ${resizedUrl(src, x3)} 3x`,
  }
}
