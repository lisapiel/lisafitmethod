// Encodes each path segment on its own. Encoding the whole key turns "/" into
// "%2F", which breaks any video stored in a folder.
export function cdnUrl(base: string, key: string): string {
  return `${base}/${key.split("/").map(encodeURIComponent).join("/")}`
}

// Thumbnails were uploaded with apostrophes replaced by underscores
// ("World_s Greatest Stretch F.jpg") while exercise names and keys keep the
// apostrophe. Retry once with that spelling, then hide the broken image.
export function thumbFallback(e: { currentTarget: HTMLImageElement }) {
  const img = e.currentTarget
  if (!img.dataset.retried) {
    const url = new URL(img.src, window.location.href)
    const parts = url.pathname.split("/")
    const file = decodeURIComponent(parts.pop() ?? "")
    const alt = file.replace(/['’]/g, "_")
    img.dataset.retried = "1"
    if (alt !== file) {
      url.pathname = [...parts, encodeURIComponent(alt)].join("/")
      img.src = url.toString()
      return
    }
  }
  img.style.visibility = "hidden"
}
