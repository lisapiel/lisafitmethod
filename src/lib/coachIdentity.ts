import { isAdminEmail } from "@/lib/authTokens"

export { COACH_THREAD_KEY, coachThreadId } from "@/lib/coachThreadKey"

export function isCoachSender(email: string): boolean {
  return isAdminEmail(email)
}

export function checkInFeedbackPrefix(submittedAt: string): string {
  const submittedDate = new Date(submittedAt).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  })
  return `Feedback on your check-in from ${submittedDate}:`
}
