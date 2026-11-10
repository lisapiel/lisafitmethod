import type { Metadata } from "next"
import { redirect } from "next/navigation"
import PlanPageClient from "./page.client"
import { clientSessionEmail } from "@/lib/clientSession"
import { isAdminEmail } from "@/lib/authTokens"
import { adminMfaSatisfied } from "@/lib/adminBypass"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "90-Day Plan | Lisa Fit Method",
  description: "Your private 90-day business dashboard.",
  robots: { index: false, follow: false },
  manifest: "/my-plan-manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "My Plan",
  },
}

export default async function MyPlanPage() {
  const email = await clientSessionEmail()
  if (!email || !isAdminEmail(email) || !(await adminMfaSatisfied(email))) redirect("/account")
  return <PlanPageClient />
}
