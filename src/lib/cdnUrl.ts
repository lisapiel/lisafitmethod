// Encodes each path segment on its own. Encoding the whole key turns "/" into
// "%2F", which breaks any video stored in a folder.
export function cdnUrl(base: string, key: string): string {
  return `${base}/${key.split("/").map(encodeURIComponent).join("/")}`
}
