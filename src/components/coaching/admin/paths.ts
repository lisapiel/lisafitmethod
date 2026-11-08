export const OVERVIEW_PATH = "/api/admin/coaching/overview"
export const CHECK_INS_PATH = "/api/admin/coaching/check-ins"

// Screens rebuilt on the shared admin tokens. Everything else still renders
// its old dark styles, which phones show through the legacy light filter.
export function isNativeScreen(pathname: string) {
  if (pathname === "/admin/coaching" || pathname === "/admin/coaching/messages" || pathname === "/admin/coaching/check-ins" || pathname === "/admin/coaching/clients") return true
  if (/^\/admin\/coaching\/check-ins\/[^/]+$/.test(pathname)) return true
  return pathname.startsWith("/admin/coaching/clients/") && pathname !== "/admin/coaching/clients/new"
}
