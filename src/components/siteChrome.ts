// Which routes render the shared SiteHeader / SiteFooter.
//
// Every public page in the Direction D redesign carries its own navigation
// and footer inside PageShellD, so the shared chrome must stand down on
// those routes or the page gets two of each.
//
// These are matched exactly rather than by prefix, deliberately. "/" as a
// prefix matches the whole site, and "/coaching" as a prefix would also
// strip the chrome from /coaching/welcome and the two acceptance routes,
// which are client onboarding pages that are not part of this redesign.
const DIRECTION_D_PATHS = new Set([
  "/",
  "/about",
  "/courses",
  "/nutrition",
  "/coaching",
  "/faq",
  "/contact",
  "/free-guide",
  "/free-guide-nutrition",
  "/blog",
])

export function usesOwnChrome(pathname: string): boolean {
  if (DIRECTION_D_PATHS.has(pathname)) return true
  // Articles live under /blog/<slug> and use the same shell.
  if (pathname.startsWith("/blog/")) return true
  return false
}
