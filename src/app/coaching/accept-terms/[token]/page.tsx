import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getWaiverToken } from "@/lib/authTokens"
import AcceptTermsClient from "./page.client"

export const metadata: Metadata = {
  title: "Accept Coaching Terms — Lisa Fit Method",
  robots: { index: false, follow: false },
}

export default async function AcceptTermsPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const record = await getWaiverToken(token).catch(() => null)
  if (!record || record.used || new Date(record.expiresAt) < new Date()) {
    notFound()
  }

  return <AcceptTermsClient token={token} email={record.email} />
}
