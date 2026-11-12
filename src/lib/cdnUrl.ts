// Encodes each path segment on its own. Encoding the whole key turns "/" into
// "%2F", which breaks any video stored in a folder.
export function cdnUrl(base: string, key: string): string {
  return `${base}/${key.split("/").map(encodeURIComponent).join("/")}`
}

// Thumbnails were uploaded with apostrophes replaced by underscores
// ("World_s Greatest Stretch F.jpg") while exercise names and keys keep the
// apostrophe.
function underscored(raw: string): string {
  const url = new URL(raw)
  const parts = url.pathname.split("/")
  const file = decodeURIComponent(parts.pop() ?? "")
  url.pathname = [...parts, encodeURIComponent(file.replace(/['’]/g, "_"))].join("/")
  return url.toString()
}

function withSource(resized: string, source: string): string {
  const url = new URL(resized, "http://local")
  url.searchParams.set("url", source)
  return `${url.pathname}${url.search}`
}

// Retry once with the underscore spelling, then hide the broken image. A
// resized thumbnail that fails falls back to the original file, so a resizer
// problem can never leave a thumbnail missing that would otherwise load.
export function thumbFallback(e: { currentTarget: HTMLImageElement }) {
  const img = e.currentTarget
  const here = new URL(img.src, window.location.href)
  const source = here.pathname === "/_next/image" ? here.searchParams.get("url") : null
  const original = source ?? img.src
  const file = decodeURIComponent(new URL(original).pathname.split("/").pop() ?? "")
  const alt = /['’]/.test(file) ? underscored(original) : null
  if (!img.dataset.retried) {
    img.dataset.retried = "1"
    if (alt) {
      if (source) {
        if (img.srcset) img.srcset = img.srcset.split(",").map((c) => { const [u, d] = c.trim().split(/\s+/); return `${withSource(u, alt)} ${d}` }).join(", ")
        img.src = withSource(img.src, alt)
      } else {
        img.src = alt
      }
      return
    }
    if (source) {
      img.removeAttribute("srcset")
      img.src = original
      return
    }
  } else if (img.dataset.retried === "1" && source) {
    img.dataset.retried = "2"
    img.removeAttribute("srcset")
    img.src = source
    return
  }
  img.style.visibility = "hidden"
}
