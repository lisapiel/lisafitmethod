import type { Metadata } from "next"
import { AdminSecurityClient } from "./page.client"

export const metadata: Metadata = {
  title: "Security: Admin",
  robots: { index: false, follow: false },
}

export default function AdminSecurityPage() {
  return <AdminSecurityClient />
}
