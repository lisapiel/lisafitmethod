// Coaching records added for the redesign: recovered food reports, target
// change history and check-in assessments. All additive: no existing record is
// migrated, and older app versions simply ignore these record types.
import { randomBytes } from "crypto"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb"
import { scanAll } from "./dynamoScan"
import { sortNewestFirst, type StartingWeightChangeRecord } from "./startingWeight"

const TABLE = process.env.DYNAMODB_TABLE ?? "lfm-user-progress"

function makeDb() {
  return DynamoDBDocumentClient.from(
    new DynamoDBClient({
      region: process.env.COGNITO_REGION ?? "us-east-2",
      credentials: {
        accessKeyId: process.env.COGNITO_AWS_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.COGNITO_AWS_SECRET_ACCESS_KEY ?? "",
      },
    })
  )
}

const strip = <T extends Record<string, unknown>>(o: T): T => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as T

// ── Recovered food reports ──────────────────────────────────────────────────
// One record per message, so a message can only be recovered once. The food
// entry it creates is an ordinary nutrition_log (source "message-estimate");
// undo deletes that entry, so every app version totals correctly.

export interface NutritionRecoveryRecord {
  messageId: string
  clientEmail: string
  date: string
  calories: number
  protein?: number
  carbs?: number
  fat?: number
  logId?: string
  status: "active" | "undone"
  confirmedBy: string
  confirmedAt: string
  undoneBy?: string
  undoneAt?: string
  undoReason?: string
  clientFlag?: { note: string; at: string }
}

export async function getRecovery(messageId: string): Promise<NutritionRecoveryRecord | null> {
  const r = await makeDb().send(new GetCommand({ TableName: TABLE, Key: { userId: `nutrition_recovery_${messageId}` } }))
  return (r.Item as NutritionRecoveryRecord) ?? null
}

export async function listRecoveries(clientEmail: string): Promise<NutritionRecoveryRecord[]> {
  const items = await scanAll(makeDb(), {
    TableName: TABLE,
    FilterExpression: "begins_with(userId, :p) AND clientEmail = :e",
    ExpressionAttributeValues: { ":p": "nutrition_recovery_", ":e": clientEmail.toLowerCase() },
  })
  return (items as NutritionRecoveryRecord[]).sort((a, b) => b.confirmedAt.localeCompare(a.confirmedAt))
}

// Creates the recovery record only if none exists for this message yet.
export async function createRecovery(rec: NutritionRecoveryRecord): Promise<boolean> {
  try {
    await makeDb().send(new PutCommand({
      TableName: TABLE,
      Item: strip({ userId: `nutrition_recovery_${rec.messageId}`, ...rec }),
      ConditionExpression: "attribute_not_exists(userId) OR #s = :undone",
      ExpressionAttributeNames: { "#s": "status" },
      ExpressionAttributeValues: { ":undone": "undone" },
    }))
    return true
  } catch (e) {
    if ((e as { name?: string }).name === "ConditionalCheckFailedException") return false
    throw e
  }
}

export async function updateRecovery(messageId: string, fields: Partial<NutritionRecoveryRecord>): Promise<void> {
  const f = strip(fields as Record<string, unknown>)
  const keys = Object.keys(f)
  if (keys.length === 0) return
  await makeDb().send(new UpdateCommand({
    TableName: TABLE,
    Key: { userId: `nutrition_recovery_${messageId}` },
    UpdateExpression: `SET ${keys.map((k) => `#${k} = :${k}`).join(", ")}`,
    ExpressionAttributeNames: Object.fromEntries(keys.map((k) => [`#${k}`, k])),
    ExpressionAttributeValues: Object.fromEntries(keys.map((k) => [`:${k}`, f[k]])),
    ConditionExpression: "attribute_exists(userId)",
  }))
}

export async function deleteRecoveryRecord(messageId: string): Promise<void> {
  await makeDb().send(new DeleteCommand({ TableName: TABLE, Key: { userId: `nutrition_recovery_${messageId}` } }))
}

// ── Target change history ───────────────────────────────────────────────────

export interface MacroValues { calories: number; protein: number; carbs: number; fat: number }

export interface TargetChangeRecord {
  id: string
  clientEmail: string
  changedAt: string
  changedBy: string
  kind: "set-custom" | "back-to-automatic"
  previous: MacroValues & { automatic: boolean }
  next: MacroValues & { automatic: boolean }
  reason: string
  context?: string
  checkInId?: string
}

export async function putTargetChange(rec: Omit<TargetChangeRecord, "id">): Promise<TargetChangeRecord> {
  const id = randomBytes(12).toString("hex")
  const full = { id, ...rec }
  await makeDb().send(new PutCommand({ TableName: TABLE, Item: strip({ userId: `nutrition_target_change_${id}`, ...full }) }))
  return full
}

export async function deleteTargetChange(id: string): Promise<void> {
  await makeDb().send(new DeleteCommand({ TableName: TABLE, Key: { userId: `nutrition_target_change_${id}` } }))
}

export async function listTargetChanges(clientEmail: string): Promise<TargetChangeRecord[]> {
  const items = await scanAll(makeDb(), {
    TableName: TABLE,
    FilterExpression: "begins_with(userId, :p) AND clientEmail = :e",
    ExpressionAttributeValues: { ":p": "nutrition_target_change_", ":e": clientEmail.toLowerCase() },
  })
  return (items as TargetChangeRecord[]).sort((a, b) => b.changedAt.localeCompare(a.changedAt))
}

// ── Starting weight corrections ─────────────────────────────────────────────

export async function putStartingWeightChange(rec: Omit<StartingWeightChangeRecord, "id">): Promise<StartingWeightChangeRecord> {
  const id = randomBytes(12).toString("hex")
  const full = { id, ...rec }
  await makeDb().send(new PutCommand({ TableName: TABLE, Item: strip({ userId: `starting_weight_change_${id}`, ...full }) }))
  return full
}

export async function deleteStartingWeightChange(id: string): Promise<void> {
  await makeDb().send(new DeleteCommand({ TableName: TABLE, Key: { userId: `starting_weight_change_${id}` } }))
}

export async function listStartingWeightChanges(clientEmail: string): Promise<StartingWeightChangeRecord[]> {
  const items = await scanAll(makeDb(), {
    TableName: TABLE,
    FilterExpression: "begins_with(userId, :p) AND clientEmail = :e",
    ExpressionAttributeValues: { ":p": "starting_weight_change_", ":e": clientEmail.toLowerCase() },
  })
  return sortNewestFirst(items as StartingWeightChangeRecord[])
}

// ── Check-in assessments ────────────────────────────────────────────────────

export interface AssessmentShared {
  wentWell: string
  toImprove: string
  changes: string
  priorities: string[]
}

export interface AssessmentRecord extends AssessmentShared {
  checkInId: string
  clientEmail: string
  privateNote: string
  status: "draft" | "sent"
  version: number
  createdAt: string
  updatedAt: string
  sentAt?: string
  sentBy?: string
  priorityChecks?: Record<string, string>
  emailRequested?: boolean
  emailedVersion?: number
  emailedAt?: string
  messageId?: string
  versions?: Array<AssessmentShared & { version: number; sentAt: string }>
  snapshot?: Record<string, unknown>
}

export async function getAssessment(checkInId: string): Promise<AssessmentRecord | null> {
  const r = await makeDb().send(new GetCommand({ TableName: TABLE, Key: { userId: `coaching_assessment_${checkInId}` } }))
  return (r.Item as AssessmentRecord) ?? null
}

export async function putAssessment(rec: AssessmentRecord): Promise<void> {
  await makeDb().send(new PutCommand({ TableName: TABLE, Item: strip({ userId: `coaching_assessment_${rec.checkInId}`, ...rec } as Record<string, unknown>) }))
}

export async function listAssessmentsForClient(clientEmail: string): Promise<AssessmentRecord[]> {
  const items = await scanAll(makeDb(), {
    TableName: TABLE,
    FilterExpression: "begins_with(userId, :p) AND clientEmail = :e",
    ExpressionAttributeValues: { ":p": "coaching_assessment_", ":e": clientEmail.toLowerCase() },
  })
  return (items as AssessmentRecord[]).sort((a, b) => (b.sentAt ?? b.updatedAt).localeCompare(a.sentAt ?? a.updatedAt))
}

export async function setPriorityChecks(checkInId: string, checks: Record<string, string>): Promise<void> {
  await makeDb().send(new UpdateCommand({
    TableName: TABLE,
    Key: { userId: `coaching_assessment_${checkInId}` },
    UpdateExpression: "SET priorityChecks = :c",
    ConditionExpression: "attribute_exists(userId) AND #s = :sent",
    ExpressionAttributeNames: { "#s": "status" },
    ExpressionAttributeValues: { ":c": checks, ":sent": "sent" },
  }))
}

// The ONLY shape of an assessment a client may ever receive. The private note,
// drafts and internal fields never pass through here.
export type ClientAssessment = AssessmentShared & { checkInId: string; sentAt: string; version: number; priorityChecks: Record<string, string> }

export function toClientAssessment(a: AssessmentRecord | null): ClientAssessment | null {
  if (!a || a.status !== "sent" || !a.sentAt) return null
  return {
    checkInId: a.checkInId,
    wentWell: a.wentWell,
    toImprove: a.toImprove,
    changes: a.changes,
    priorities: a.priorities ?? [],
    sentAt: a.sentAt,
    version: a.version,
    priorityChecks: a.priorityChecks ?? {},
  }
}

// Plain-text copy kept in the check-in's existing coachFeedback field so older
// screens still show the feedback. Shared parts only.
export function assessmentPlainText(s: AssessmentShared): string {
  return [
    s.wentWell && `What's going well\n${s.wentWell}`,
    s.toImprove && `What to improve\n${s.toImprove}`,
    s.changes && `What we're changing\n${s.changes}`,
    s.priorities.length > 0 && `Priorities this week\n${s.priorities.map((p, i) => `${i + 1}. ${p}`).join("\n")}`,
  ].filter(Boolean).join("\n\n")
}

const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
const para = (t: string) => esc(t).replace(/\n/g, "<br />")

// Branded email built from the shared parts only (it cannot see a private note).
export function assessmentEmailHtml(s: AssessmentShared, firstName: string, link: string): string {
  const section = (title: string, body: string) => body.trim()
    ? `<tr><td style="padding:0 0 18px;"><p style="margin:0 0 6px;font-family:Georgia,serif;font-size:17px;font-weight:700;color:#1a1a1a;">${title}</p><p style="margin:0;font-size:15px;line-height:1.6;color:#3a3633;">${para(body)}</p></td></tr>`
    : ""
  const list = s.priorities.length
    ? `<tr><td style="padding:0 0 18px;"><p style="margin:0 0 6px;font-family:Georgia,serif;font-size:17px;font-weight:700;color:#1a1a1a;">Your priorities this week</p><ol style="margin:0;padding-left:20px;font-size:15px;line-height:1.7;color:#3a3633;">${s.priorities.map((p) => `<li>${esc(p)}</li>`).join("")}</ol></td></tr>`
    : ""
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>Your week, from Lisa</title></head>
<body style="margin:0;padding:0;background-color:#f0ebe4;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0ebe4;padding:40px 20px;"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:4px;">
<tr><td style="background:#0a0a0a;padding:24px 32px;"><p style="margin:0;font-family:Georgia,serif;font-size:20px;color:#f5f2ee;">Lisa Fit Method</p></td></tr>
<tr><td style="padding:32px 32px 8px;"><p style="margin:0 0 6px;font-family:Georgia,serif;font-size:24px;color:#1a1a1a;">Hi ${esc(firstName || "there")},</p><p style="margin:0 0 22px;font-size:15px;line-height:1.6;color:#3a3633;">I've gone through your check-in. Here's my feedback for the week ahead.</p></td></tr>
<tr><td style="padding:0 32px;"><table width="100%" cellpadding="0" cellspacing="0">${section("What's going well", s.wentWell)}${section("What to improve", s.toImprove)}${section("What we're changing", s.changes)}${list}</table></td></tr>
<tr><td style="padding:4px 32px 32px;"><table cellpadding="0" cellspacing="0"><tr><td style="background:#c8a97e;border-radius:2px;"><a href="${esc(link)}" style="display:inline-block;padding:12px 22px;font-size:14px;font-weight:700;color:#0a0a0a;text-decoration:none;">Open your week</a></td></tr></table>
<p style="margin:22px 0 0;font-size:15px;line-height:1.6;color:#3a3633;">Talk soon,<br />Lisa</p></td></tr>
</table></td></tr></table></body></html>`
}

// Emails never repeat: the first send emails only if Lisa ticked the box, an
// edit never emails by itself, and "Email this update" sends at most once per
// version.
export function shouldEmailAssessment(a: Pick<AssessmentRecord, "emailRequested" | "emailedVersion" | "version">, explicitUpdate: boolean): boolean {
  if (a.emailedVersion === a.version) return false
  if (explicitUpdate) return true
  return a.emailRequested === true && a.emailedVersion == null
}
