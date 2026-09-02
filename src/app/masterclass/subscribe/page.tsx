import type { Metadata } from "next"
import SubscribeClient from "./page.client"
import { assertMasterclassPublicVisible } from "@/lib/productGates"

// Do not statically pre-render — the visibility gate needs to check the
// current session on every request so admins + real Masterclass owners
// aren't served a cached "redirect" response.
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Join Masterclass | Lisa Fit Method",
  description: "Monthly programming. Real exercise videos. New block every month.",
}

export default async function SubscribePage() {
  // Hide from non-admin, non-owner visitors while the launch flag is off.
  await assertMasterclassPublicVisible()
  return <SubscribeClient />
}
