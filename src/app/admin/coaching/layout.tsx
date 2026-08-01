import type { Viewport } from "next"
import CoachingAdminShell from "./CoachingAdminShell.client"

// Lock the viewport for the coaching admin so mobile browsers render at
// device width instead of shrinking a desktop-width page into a tiny,
// unreadable, pinch-to-zoom canvas.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#faf8f5",
}

export default function CoachingAdminLayout({ children }: { children: React.ReactNode }) {
  return <CoachingAdminShell>{children}</CoachingAdminShell>
}
