import type { Metadata } from "next"
import AdminLoginClient from "./page.client"

export const metadata: Metadata = {
  title: "Admin Login: Lisa Fit Method",
  robots: { index: false, follow: false },
}

export default function AdminLoginPage() {
  return <AdminLoginClient />
}
