// Both admin accounts act as one coach. Client conversations are stored under a
// thread id built from this key, so it must stay stable: changing it would hide
// every existing conversation unless the stored thread ids are migrated too.
// No imports, so browser pages can use it too.
export const COACH_THREAD_KEY = "lisa.p.mcpherson@gmail.com"

export function coachThreadId(clientEmail: string): string {
  return [clientEmail.toLowerCase(), COACH_THREAD_KEY].sort().join("_")
}
