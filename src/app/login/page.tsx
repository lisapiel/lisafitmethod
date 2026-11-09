import { Suspense } from "react"
import type { Metadata } from "next"
import { LoginClient } from "./page.client"

export const metadata: Metadata = {
  title: "Log in | Lisa Fit Method",
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginClient />
    </Suspense>
  )
}
