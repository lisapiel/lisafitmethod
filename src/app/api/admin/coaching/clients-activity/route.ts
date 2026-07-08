import { NextRequest, NextResponse } from "next/server"
import { verifyAdminRequest } from "@/lib/adminAuth"
import {
  listCoachingClientRecords,
  listWorkoutLogRecords,
  listCoachingCheckIns,
  listAllCoachingMessages,
  ADMIN_EMAIL,
} from "@/lib/authTokens"

export const dynamic = "force-dynamic"

type ActivityRow = {
  email: string
  lastWorkoutAt: string | null
  workoutsThisWeek: number
  pendingCheckIns: number
  unreadMessageCount: number
}

function startOfIsoWeek(d: Date): Date {
  const day = d.getDay() || 7 // Sun = 0 → treat as 7
  const monday = new Date(d)
  monday.setDate(d.getDate() - (day - 1))
  monday.setHours(0, 0, 0, 0)
  return monday
}

export async function GET(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const [clients, allLogs, allCheckIns, allMessages] = await Promise.all([
    listCoachingClientRecords(),
    listWorkoutLogRecords(),
    listCoachingCheckIns(),
    listAllCoachingMessages(),
  ])

  const weekStart = startOfIsoWeek(new Date()).toISOString()

  // Pre-group by client email for efficiency
  const logsByEmail = new Map<string, typeof allLogs>()
  for (const log of allLogs) {
    const k = log.clientEmail.toLowerCase()
    if (!logsByEmail.has(k)) logsByEmail.set(k, [])
    logsByEmail.get(k)!.push(log)
  }

  const checkInsByEmail = new Map<string, typeof allCheckIns>()
  for (const ci of allCheckIns) {
    const k = ci.clientEmail.toLowerCase()
    if (!checkInsByEmail.has(k)) checkInsByEmail.set(k, [])
    checkInsByEmail.get(k)!.push(ci)
  }

  // Unread = messages where toEmail is coach (Lisa) and no readAt
  const unreadByEmail = new Map<string, number>()
  for (const m of allMessages) {
    if (m.toEmail.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) continue
    if (m.readAt) continue
    const k = m.fromEmail.toLowerCase()
    unreadByEmail.set(k, (unreadByEmail.get(k) ?? 0) + 1)
  }

  const activity: ActivityRow[] = clients.map((c) => {
    const key = c.email.toLowerCase()
    const logs = logsByEmail.get(key) ?? []
    const checkIns = checkInsByEmail.get(key) ?? []
    return {
      email: c.email,
      lastWorkoutAt: logs.length > 0 ? logs[0].completedAt : null,
      workoutsThisWeek: logs.filter((l) => l.completedAt >= weekStart).length,
      pendingCheckIns: checkIns.filter((ci) => ci.status === "PENDING").length,
      unreadMessageCount: unreadByEmail.get(key) ?? 0,
    }
  })

  return NextResponse.json({ activity })
}
