"use client"

import { useMemo } from "react"
import { useParams } from "next/navigation"
import type { CoachingOverview } from "@/lib/coachingOverview"
import CheckInList from "@/components/coaching/admin/CheckInList"
import { useAdminFetch } from "@/components/coaching/admin/useAdminFetch"
import { OVERVIEW_PATH } from "@/components/coaching/admin/paths"

export default function ClientCheckInsPage() {
  const email = decodeURIComponent(useParams<{ email: string }>().email ?? "").toLowerCase()
  const { data } = useAdminFetch<CoachingOverview>(OVERVIEW_PATH)
  const names = useMemo(() => new Map((data?.clients ?? []).map((c) => [c.email, c.displayName])), [data])
  return <CheckInList names={names} clientEmail={email} />
}
