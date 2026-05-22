"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function WeeklyLogClient() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/training-foundations/tracker")
  }, [router])
  return null
}
