import { createHash } from "crypto"
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb"
import type { CoachingWorkoutLogRecord } from "./authTokens"

export interface WorkoutLogSender {
  send(command: PutCommand | GetCommand): Promise<{ Item?: Record<string, unknown> }>
}

const SUBMISSION_ID = /^[A-Za-z0-9-]{8,64}$/

export function isValidSubmissionId(value: unknown): value is string {
  return typeof value === "string" && SUBMISSION_ID.test(value)
}

// Scoped to the client so one account's submission id can never address
// another account's record.
export function workoutLogIdFor(clientEmail: string, submissionId: string): string {
  return createHash("sha256").update(`${clientEmail.toLowerCase()}:${submissionId}`).digest("hex").slice(0, 32)
}

function isConditionalCheckFailed(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { name?: string }).name === "ConditionalCheckFailedException"
}

// A retry, double tap or lost reply resends the same submission id. The first
// write wins; later ones return the stored record with created=false so the
// caller can skip side effects such as the coach notification.
export async function saveWorkoutLogOnce(
  db: WorkoutLogSender,
  table: string,
  data: Omit<CoachingWorkoutLogRecord, "id">,
  submissionId: string,
): Promise<{ record: CoachingWorkoutLogRecord; created: boolean }> {
  const id = workoutLogIdFor(data.clientEmail, submissionId)
  const record: CoachingWorkoutLogRecord = { id, ...data }
  const key = `coaching_workoutlog_${id}`
  try {
    await db.send(new PutCommand({
      TableName: table,
      Item: { userId: key, ...record },
      ConditionExpression: "attribute_not_exists(userId)",
    }))
    return { record, created: true }
  } catch (err) {
    if (!isConditionalCheckFailed(err)) throw err
    const existing = await db.send(new GetCommand({ TableName: table, Key: { userId: key }, ConsistentRead: true }))
    const stored = existing.Item as (CoachingWorkoutLogRecord & { userId: string }) | undefined
    if (!stored || stored.clientEmail !== data.clientEmail) throw err
    const { userId: _userId, ...rest } = stored
    void _userId
    return { record: rest, created: false }
  }
}
