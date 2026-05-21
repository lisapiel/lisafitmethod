import type { Metadata } from "next"
import UploadPageClient from "./page.client"

export const metadata: Metadata = {
  title: "Upload — Admin",
  robots: { index: false, follow: false },
}

interface Props {
  searchParams: Promise<{ slot?: string; type?: string }>
}

export default async function UploadPage({ searchParams }: Props) {
  const { slot, type } = await searchParams
  return <UploadPageClient slot={slot ?? ""} type={(type as "VIDEO" | "PHOTO") ?? "VIDEO"} />
}
