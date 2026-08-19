import { randomBytes } from "crypto"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, ScanCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb"

const TABLE = process.env.DYNAMODB_TABLE ?? "lfm-user-progress"

// Primary admin account (used as canonical coach identity in message threads and access grants)
export const ADMIN_EMAIL = "lisa.p.mcpherson@gmail.com"
// All admin accounts — both pass every isAdmin/verifyAdmin check
export const ADMIN_EMAILS = ["lisa.p.mcpherson@gmail.com", "contact@lisafitmethod.com"] as const
export function isAdminEmail(email: string): boolean {
  const lower = email.toLowerCase()
  return lower === "lisa.p.mcpherson@gmail.com" || lower === "contact@lisafitmethod.com"
}

export interface AuthToken {
  email: string
  type: "setup" | "reset"
  expiresAt: string
  used: boolean
}

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

export function generateAuthToken(): string {
  return randomBytes(32).toString("hex")
}

export async function storeAuthToken(
  token: string,
  email: string,
  type: "setup" | "reset"
): Promise<void> {
  const db = makeDb()
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
  await db.send(
    new PutCommand({
      TableName: TABLE,
      Item: { userId: `setpw_token__${token}`, email, type, expiresAt, used: false },
    })
  )
}

export async function getAuthToken(token: string): Promise<AuthToken | null> {
  try {
    const db = makeDb()
    const result = await db.send(
      new GetCommand({ TableName: TABLE, Key: { userId: `setpw_token__${token}` } })
    )
    if (!result.Item) return null
    return result.Item as AuthToken
  } catch {
    return null
  }
}

export async function markAuthTokenUsed(token: string): Promise<void> {
  const db = makeDb()
  await db.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { userId: `setpw_token__${token}` },
      UpdateExpression: "SET #used = :true",
      ExpressionAttributeNames: { "#used": "used" },
      ExpressionAttributeValues: { ":true": true },
    })
  )
}

export async function grantTrackerAccess(email: string): Promise<void> {
  const db = makeDb()
  await db.send(
    new PutCommand({
      TableName: TABLE,
      Item: { userId: `tracker_access_${email.toLowerCase()}`, grantedAt: new Date().toISOString() },
    })
  )
}

export async function hasTrackerAccess(email: string): Promise<boolean> {
  if (isAdminEmail(email)) return true
  try {
    const db = makeDb()
    const result = await db.send(
      new GetCommand({ TableName: TABLE, Key: { userId: `tracker_access_${email.toLowerCase()}` } })
    )
    return !!result.Item
  } catch {
    return false
  }
}

export async function grantTrainingAccess(email: string): Promise<void> {
  const db = makeDb()
  await db.send(
    new PutCommand({
      TableName: TABLE,
      Item: { userId: `training_access_${email.toLowerCase()}`, grantedAt: new Date().toISOString() },
    })
  )
}

export async function hasTrainingAccess(email: string): Promise<boolean> {
  if (isAdminEmail(email)) return true
  try {
    const db = makeDb()
    const result = await db.send(
      new GetCommand({ TableName: TABLE, Key: { userId: `training_access_${email.toLowerCase()}` } })
    )
    return !!result.Item
  } catch {
    return false
  }
}

export async function grantNutritionAccess(email: string): Promise<void> {
  const db = makeDb()
  await db.send(
    new PutCommand({
      TableName: TABLE,
      Item: { userId: `nutrition_access_${email.toLowerCase()}`, grantedAt: new Date().toISOString() },
    })
  )
}

export async function hasNutritionAccess(email: string): Promise<boolean> {
  if (isAdminEmail(email)) return true
  try {
    const db = makeDb()
    const result = await db.send(
      new GetCommand({ TableName: TABLE, Key: { userId: `nutrition_access_${email.toLowerCase()}` } })
    )
    return !!result.Item
  } catch {
    return false
  }
}

export interface MasterclassAccess {
  active: boolean
  stripeSubscriptionId: string
  plan: "monthly" | "6month" | "annual"
  currentPeriodEnd: string
}

export async function grantMasterclassAccess(
  email: string,
  stripeSubscriptionId: string,
  plan: "monthly" | "6month" | "annual",
  currentPeriodEnd: string
): Promise<void> {
  const db = makeDb()
  await db.send(
    new PutCommand({
      TableName: TABLE,
      Item: {
        userId: `masterclass_access_${email.toLowerCase()}`,
        active: true,
        stripeSubscriptionId,
        plan,
        currentPeriodEnd,
        grantedAt: new Date().toISOString(),
      },
    })
  )
}

export async function renewMasterclassAccess(
  email: string,
  currentPeriodEnd: string
): Promise<void> {
  const db = makeDb()
  await db.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { userId: `masterclass_access_${email.toLowerCase()}` },
      UpdateExpression: "SET active = :true, currentPeriodEnd = :end",
      ExpressionAttributeValues: { ":true": true, ":end": currentPeriodEnd },
    })
  )
}

export async function revokeMasterclassAccess(email: string): Promise<void> {
  const db = makeDb()
  await db.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { userId: `masterclass_access_${email.toLowerCase()}` },
      UpdateExpression: "SET active = :false",
      ExpressionAttributeValues: { ":false": false },
    })
  )
}

export async function hasMasterclassAccess(email: string): Promise<boolean> {
  if (isAdminEmail(email)) return true
  try {
    const db = makeDb()
    const result = await db.send(
      new GetCommand({ TableName: TABLE, Key: { userId: `masterclass_access_${email.toLowerCase()}` } })
    )
    if (!result.Item) return false
    const access = result.Item as MasterclassAccess & { userId: string }
    if (!access.active) return false
    return new Date(access.currentPeriodEnd) > new Date()
  } catch {
    return false
  }
}

export async function grantCoachingAccess(email: string, plan?: string, startDate?: string): Promise<void> {
  const db = makeDb()
  await db.send(
    new PutCommand({
      TableName: TABLE,
      Item: {
        userId: `coaching_access_${email.toLowerCase()}`,
        active: true,
        plan: plan ?? "coaching",
        startDate: startDate ?? new Date().toISOString().split("T")[0],
        grantedAt: new Date().toISOString(),
      },
    })
  )
}

export async function hasCoachingAccess(email: string): Promise<boolean> {
  if (isAdminEmail(email)) return true
  try {
    const db = makeDb()
    const result = await db.send(
      new GetCommand({ TableName: TABLE, Key: { userId: `coaching_access_${email.toLowerCase()}` } })
    )
    if (!result.Item) return false
    return result.Item.active === true
  } catch {
    return false
  }
}

// Raw active-coaching check with NO admin auto-grant. Use this anywhere the
// question is "is this person actually paying for coaching right now?" —
// specifically for coaching-client promotional pricing eligibility and for
// the drawer's My Products Active/Available split. Admin capability must
// never trigger the coaching-client price.
export async function ownsCoachingRaw(email: string): Promise<boolean> {
  try {
    const db = makeDb()
    const result = await db.send(
      new GetCommand({ TableName: TABLE, Key: { userId: `coaching_access_${email.toLowerCase()}` } })
    )
    if (!result.Item) return false
    return result.Item.active === true
  } catch {
    return false
  }
}

// Raw ownership checks for the three separately sold one-time products.
// These bypass the admin auto-grant so the duplicate-purchase gate on the
// PaymentIntent routes doesn't accidentally block an admin from testing
// checkouts or, conversely, over-report ownership. A user "owns" the product
// once their access record exists — same semantics the drawer's Active
// split already uses via /api/member/access.
export async function ownsTrainingRaw(email: string): Promise<boolean> {
  try {
    const db = makeDb()
    const result = await db.send(
      new GetCommand({ TableName: TABLE, Key: { userId: `training_access_${email.toLowerCase()}` } })
    )
    return !!result.Item
  } catch {
    return false
  }
}
export async function ownsNutritionRaw(email: string): Promise<boolean> {
  try {
    const db = makeDb()
    const result = await db.send(
      new GetCommand({ TableName: TABLE, Key: { userId: `nutrition_access_${email.toLowerCase()}` } })
    )
    return !!result.Item
  } catch {
    return false
  }
}
export async function ownsTrackerRaw(email: string): Promise<boolean> {
  try {
    const db = makeDb()
    const result = await db.send(
      new GetCommand({ TableName: TABLE, Key: { userId: `tracker_access_${email.toLowerCase()}` } })
    )
    return !!result.Item
  } catch {
    return false
  }
}

export async function revokeCoachingAccess(email: string): Promise<void> {
  const db = makeDb()
  await db.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { userId: `coaching_access_${email.toLowerCase()}` },
      UpdateExpression: "SET active = :false",
      ExpressionAttributeValues: { ":false": false },
    })
  )
}

// ── Coaching applications ─────────────────────────────────────────────────────

export type CommitmentType = "THREE_MONTH_MINIMUM" | "MONTH_TO_MONTH"

export interface CoachingApplication {
  userId: string
  id: string
  email: string
  name: string
  // Legacy fields kept for backward compat with older applications
  goals: string
  currentFitnessLevel: string
  whyCoaching: string
  // Extended fields (new applications)
  trainingExperience?: string
  primaryGoal?: string
  whyNow?: string
  daysPerWeek?: string
  equipment?: string
  injuries?: string
  coursesCompleted?: string
  coachingOption?: string
  whyLisa?: string
  // Refined form fields (July 2026)
  whatHaveYouTried?: string
  investmentReadiness?: string
  startTiming?: string
  status: "PENDING" | "APPROVED" | "DECLINED" | "PAID"
  applicationDate: string
  reviewedAt?: string
  stripeCheckoutUrl?: string
  stripeSubscriptionId?: string
  // Admin-approved business terms (set at approval, authoritative over applicant self-report)
  approvedPriceInCents?: number
  approvedCommitmentType?: CommitmentType
}

export async function submitCoachingApplication(data: {
  email: string
  name: string
  goals: string
  currentFitnessLevel: string
  whyCoaching: string
  trainingExperience?: string
  primaryGoal?: string
  whyNow?: string
  daysPerWeek?: string
  equipment?: string
  injuries?: string
  coursesCompleted?: string
  coachingOption?: string
  whyLisa?: string
  whatHaveYouTried?: string
  investmentReadiness?: string
  startTiming?: string
}): Promise<string> {
  const db = makeDb()
  const id = randomBytes(16).toString("hex")
  const item: CoachingApplication = {
    userId: `coaching_app_${id}`,
    id,
    email: data.email.trim().toLowerCase(),
    name: data.name.trim(),
    goals: data.goals.trim(),
    currentFitnessLevel: data.currentFitnessLevel.trim(),
    whyCoaching: data.whyCoaching.trim(),
    trainingExperience: data.trainingExperience?.trim(),
    primaryGoal: data.primaryGoal?.trim(),
    whyNow: data.whyNow?.trim(),
    daysPerWeek: data.daysPerWeek?.trim(),
    equipment: data.equipment?.trim(),
    injuries: data.injuries?.trim(),
    coursesCompleted: data.coursesCompleted?.trim(),
    coachingOption: data.coachingOption?.trim(),
    whyLisa: data.whyLisa?.trim(),
    whatHaveYouTried: data.whatHaveYouTried?.trim(),
    investmentReadiness: data.investmentReadiness?.trim(),
    startTiming: data.startTiming?.trim(),
    status: "PENDING",
    applicationDate: new Date().toISOString(),
  }
  await db.send(new PutCommand({ TableName: TABLE, Item: item }))
  return id
}

export async function listCoachingApplications(): Promise<CoachingApplication[]> {
  const db = makeDb()
  const result = await db.send(
    new ScanCommand({
      TableName: TABLE,
      FilterExpression: "begins_with(userId, :prefix)",
      ExpressionAttributeValues: { ":prefix": "coaching_app_" },
    })
  )
  return ((result.Items ?? []) as CoachingApplication[]).sort(
    (a, b) => b.applicationDate.localeCompare(a.applicationDate)
  )
}

export async function getCoachingApplication(id: string): Promise<CoachingApplication | null> {
  const db = makeDb()
  const result = await db.send(
    new GetCommand({ TableName: TABLE, Key: { userId: `coaching_app_${id}` } })
  )
  return result.Item ? (result.Item as CoachingApplication) : null
}

export async function updateCoachingApplication(id: string, updates: Partial<CoachingApplication>): Promise<void> {
  const db = makeDb()
  const sets: string[] = []
  const values: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(updates)) {
    if (k === "userId" || k === "id") continue
    sets.push(`#${k} = :${k}`)
    values[`:${k}`] = v
  }
  if (sets.length === 0) return
  const names: Record<string, string> = {}
  for (const k of Object.keys(updates)) {
    if (k === "userId" || k === "id") continue
    names[`#${k}`] = k
  }
  await db.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { userId: `coaching_app_${id}` },
      UpdateExpression: `SET ${sets.join(", ")}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
    })
  )
}

// ── Coaching settings (monthly price) ────────────────────────────────────────

export async function getCoachingSettings(): Promise<{ priceInCents: number }> {
  const db = makeDb()
  const result = await db.send(
    new GetCommand({ TableName: TABLE, Key: { userId: "coaching_settings" } })
  )
  return { priceInCents: result.Item?.priceInCents ?? 0 }
}

export async function setCoachingSettings(priceInCents: number): Promise<void> {
  const db = makeDb()
  await db.send(
    new PutCommand({
      TableName: TABLE,
      Item: { userId: "coaching_settings", priceInCents, updatedAt: new Date().toISOString() },
    })
  )
}

// ── Coaching Client Records ────────────────────────────────────────────────────

export interface CoachingClientRecord {
  email: string
  displayName: string
  phone?: string
  goal?: string
  startDate?: string
  weightUnit?: "LBS" | "KG"
  status?: "PENDING_PAYMENT" | "ACTIVE" | "PAUSED" | "INACTIVE"
  currentProgramId?: string
  privateNotes?: string
  coachMessage?: string         // Coach-authored personal note shown on the client home page
  coachMessageUpdatedAt?: string
  startingWeight?: number       // For goal progress reference
  createdAt?: string
  // Nutrition profile (set via /my-coaching/setup, editable by client)
  heightInches?: number
  age?: number
  sex?: "male" | "female"
  activityLevel?: number        // Current scale: 1.20 / 1.35 / 1.50 / 1.65 / 1.80. Legacy: 1.375 / 1.55 / 1.725 / 1.9 (still valid — remapped to nearest new value by the setup form).
  nutritionGoal?: "fat-loss" | "recomp" | "maintain" | "muscle-gain"
  // Optional coach-set macro override (takes precedence over auto-computed values)
  customMacros?: {
    calories?: number
    protein?: number
    carbs?: number
    fat?: number
    updatedAt: string
  }
  // Approved business terms — set at admin approval; never derived from price
  approvedPriceInCents?: number
  commitmentType?: CommitmentType
  commitmentMonths?: number
  stripeSubscriptionId?: string
  subscriptionStartDate?: string
  // Scheduling a non-renewal / cancellation
  cancellationScheduledAt?: string
  cancellationEffectiveDate?: string
  cancellationReason?: string
  cancellationFeedback?: string
  // True for clients created before the commitment field was introduced;
  // cancellation self-service is disabled until admin confirms their terms
  commitmentNeedsConfirmation?: boolean
}

export async function createCoachingClientRecord(data: CoachingClientRecord): Promise<void> {
  const db = makeDb()
  await db.send(
    new PutCommand({
      TableName: TABLE,
      Item: {
        userId: `coaching_client_${data.email.toLowerCase()}`,
        ...data,
        email: data.email.toLowerCase(),
        status: data.status ?? "ACTIVE",
        createdAt: data.createdAt ?? new Date().toISOString(),
      },
    })
  )
}

export async function getCoachingClientRecord(email: string): Promise<CoachingClientRecord | null> {
  const db = makeDb()
  const result = await db.send(
    new GetCommand({ TableName: TABLE, Key: { userId: `coaching_client_${email.toLowerCase()}` } })
  )
  if (!result.Item) return null
  return result.Item as CoachingClientRecord
}

export async function updateCoachingClientRecord(email: string, updates: Partial<CoachingClientRecord>): Promise<void> {
  const db = makeDb()
  const sets: string[] = []
  const values: Record<string, unknown> = {}
  const names: Record<string, string> = {}
  for (const [k, v] of Object.entries(updates)) {
    if (k === "email") continue
    sets.push(`#${k} = :${k}`)
    values[`:${k}`] = v
    names[`#${k}`] = k
  }
  if (sets.length === 0) return
  await db.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { userId: `coaching_client_${email.toLowerCase()}` },
      UpdateExpression: `SET ${sets.join(", ")}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
    })
  )
}

export async function listCoachingClientRecords(): Promise<CoachingClientRecord[]> {
  const db = makeDb()
  const result = await db.send(
    new ScanCommand({
      TableName: TABLE,
      FilterExpression: "begins_with(userId, :prefix)",
      ExpressionAttributeValues: { ":prefix": "coaching_client_" },
    })
  )
  return ((result.Items ?? []) as (CoachingClientRecord & { userId: string })[])
    .map((item) => item as CoachingClientRecord)
    .sort((a, b) => (a.displayName ?? "").localeCompare(b.displayName ?? ""))
}

// ── Coaching Messages ─────────────────────────────────────────────────────────

// Message kind. Absent/undefined = plain text (unchanged behavior for every
// existing record on disk). Nutrition submissions carry a specific kind so
// the UI can render a labelled block on both sides.
export type CoachingMessageKind = "nutrition-meal" | "nutrition-day" | "nutrition-question"

export interface CoachingMessageRecord {
  id: string
  threadId: string
  fromEmail: string
  toEmail: string
  body: string
  sentAt: string
  readAt?: string
  kind?: CoachingMessageKind
  // Comma-separated S3 keys for attached images. Same convention as
  // ClientProgressSnapshot.photoS3Keys — served via the public CDN.
  attachmentS3Keys?: string
}

export async function createCoachingMessage(data: Omit<CoachingMessageRecord, "id">): Promise<CoachingMessageRecord> {
  const db = makeDb()
  const id = randomBytes(16).toString("hex")
  // Undefined properties are stripped so we never write a `kind: undefined`
  // or `attachmentS3Keys: undefined` attribute onto a record that would
  // otherwise not carry that field.
  const record: CoachingMessageRecord = { id, ...data }
  const item: Record<string, unknown> = { userId: `coaching_msg_${data.threadId}_${data.sentAt}_${id}` }
  for (const [k, v] of Object.entries(record)) {
    if (v !== undefined) item[k] = v
  }
  await db.send(new PutCommand({ TableName: TABLE, Item: item }))
  return record
}

export async function listCoachingMessages(threadId: string): Promise<CoachingMessageRecord[]> {
  const db = makeDb()
  const result = await db.send(
    new ScanCommand({
      TableName: TABLE,
      FilterExpression: "begins_with(userId, :prefix)",
      ExpressionAttributeValues: { ":prefix": `coaching_msg_${threadId}_` },
    })
  )
  return ((result.Items ?? []) as CoachingMessageRecord[])
    .sort((a, b) => a.sentAt.localeCompare(b.sentAt))
}

export async function listAllCoachingMessages(): Promise<CoachingMessageRecord[]> {
  const db = makeDb()
  const result = await db.send(
    new ScanCommand({
      TableName: TABLE,
      FilterExpression: "begins_with(userId, :prefix)",
      ExpressionAttributeValues: { ":prefix": "coaching_msg_" },
    })
  )
  return ((result.Items ?? []) as CoachingMessageRecord[])
    .sort((a, b) => a.sentAt.localeCompare(b.sentAt))
}

export async function markCoachingMessagesRead(threadId: string, toEmail: string): Promise<void> {
  const db = makeDb()
  const messages = await listCoachingMessages(threadId)
  const now = new Date().toISOString()
  const unread = messages.filter((m) => m.toEmail.toLowerCase() === toEmail.toLowerCase() && !m.readAt)
  await Promise.all(
    unread.map((m) =>
      db.send(
        new UpdateCommand({
          TableName: TABLE,
          Key: { userId: `coaching_msg_${m.threadId}_${m.sentAt}_${m.id}` },
          UpdateExpression: "SET readAt = :readAt",
          ExpressionAttributeValues: { ":readAt": now },
        })
      )
    )
  )
}

// ── Coaching Check-Ins ────────────────────────────────────────────────────────

export interface CoachingCheckInRecord {
  id: string
  clientEmail: string
  submittedAt: string
  status: "PENDING" | "REVIEWED"
  // Marks the check-in as the redesigned schema. Absent/undefined = legacy
  // (pre-v2) submission — the admin review UI renders those with the old
  // fields intact and never rewrites them.
  schemaVersion?: number

  // ── Progress (shared across schema versions) ──────────────────────────────
  weight?: number
  weightUnit?: "LBS" | "KG"
  // Optional body measurements captured during the check-in.
  // Stored as JSON string: Array<{ label, value, unit }>
  measurementSnapshot?: string

  // ── Legacy 1–5 ratings — kept for backward compat on historical records.
  //    NEW (v2) check-ins do NOT write these.
  sleepQuality?: number
  energyLevel?: number
  hungerLevel?: number
  stressLevel?: number
  digestion?: number
  trainingPerformance?: number
  nutritionAdherence?: number
  workoutConsistency?: number
  wins?: string
  struggles?: string
  questionsForCoach?: string
  additionalNotes?: string

  // ── v2: Training ──────────────────────────────────────────────────────────
  // Read-only snapshot of what the platform observed at submission time.
  // Derived from workout logs — never written back to any workout record.
  workoutsCompleted?: number
  workoutsPlanned?: number   // absent if the current program doesn't provide a reliable weekly denominator
  trainingRating?: number    // 1–5
  trainingWins?: string
  trainingChallenges?: string

  // ── v2: Attention flags ───────────────────────────────────────────────────
  painReported?: boolean
  painNotes?: string

  // ── v2: Form review request + attached videos ─────────────────────────────
  formReviewRequested?: boolean
  // JSON string: Array<{ exercise: string, note: string, videoKeys: string[] }>
  // Video keys live under the private media/coaching-form-reviews/* prefix.
  formReviews?: string

  // ── v2: Recovery ──────────────────────────────────────────────────────────
  // Sleep/energy/stress reuse the legacy fields above; recoveryRating is new.
  recoveryRating?: number   // 1–5, soreness/recovery

  // ── v2: Nutrition ─────────────────────────────────────────────────────────
  nutritionStatus?: "on-track" | "mostly-on-track" | "mixed" | "struggled" | "not-focusing"
  nutritionHelp?: string

  // ── v2: Weekly reflection ────────────────────────────────────────────────
  weeklyWin?: string
  weeklyChallenge?: string
  // Comma-separated list of adjustment areas the client wants Lisa to consider:
  //   "exercises" | "volume-intensity" | "schedule" | "nutrition" | "recovery" | "other" | "none"
  adjustmentAreas?: string
  adjustmentNotes?: string
  questionForLisa?: string

  // ── Coach review (unchanged) ─────────────────────────────────────────────
  coachFeedback?: string
  reviewedAt?: string
}

export async function createCoachingCheckIn(data: Omit<CoachingCheckInRecord, "id">): Promise<CoachingCheckInRecord> {
  const db = makeDb()
  const id = randomBytes(16).toString("hex")
  const record: CoachingCheckInRecord = { id, ...data }
  // Strip undefined properties so a v2 check-in doesn't write
  // `hungerLevel: undefined` (and similar) onto its DynamoDB item.
  const item: Record<string, unknown> = { userId: `coaching_checkin_${id}` }
  for (const [k, v] of Object.entries(record)) {
    if (v !== undefined) item[k] = v
  }
  await db.send(new PutCommand({ TableName: TABLE, Item: item }))
  return record
}

export async function getCoachingCheckIn(id: string): Promise<CoachingCheckInRecord | null> {
  const db = makeDb()
  const result = await db.send(
    new GetCommand({ TableName: TABLE, Key: { userId: `coaching_checkin_${id}` } })
  )
  if (!result.Item) return null
  return result.Item as CoachingCheckInRecord
}

export async function listCoachingCheckIns(clientEmail?: string): Promise<CoachingCheckInRecord[]> {
  const db = makeDb()
  const params = clientEmail
    ? {
        TableName: TABLE,
        FilterExpression: "begins_with(userId, :prefix) AND clientEmail = :email",
        ExpressionAttributeValues: { ":prefix": "coaching_checkin_", ":email": clientEmail.toLowerCase() },
      }
    : {
        TableName: TABLE,
        FilterExpression: "begins_with(userId, :prefix)",
        ExpressionAttributeValues: { ":prefix": "coaching_checkin_" },
      }
  const result = await db.send(new ScanCommand(params))
  return ((result.Items ?? []) as CoachingCheckInRecord[])
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
}

export async function updateCoachingCheckIn(id: string, updates: Partial<CoachingCheckInRecord>): Promise<void> {
  const db = makeDb()
  const sets: string[] = []
  const values: Record<string, unknown> = {}
  const names: Record<string, string> = {}
  for (const [k, v] of Object.entries(updates)) {
    if (k === "id") continue
    sets.push(`#${k} = :${k}`)
    values[`:${k}`] = v
    names[`#${k}`] = k
  }
  if (sets.length === 0) return
  await db.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { userId: `coaching_checkin_${id}` },
      UpdateExpression: `SET ${sets.join(", ")}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
    })
  )
}

// ── Generic helpers ───────────────────────────────────────────────────────────

function buildUpdateExpression(updates: Record<string, unknown>): {
  expression: string
  names: Record<string, string>
  values: Record<string, unknown>
} | null {
  const sets: string[] = []
  const values: Record<string, unknown> = {}
  const names: Record<string, string> = {}
  for (const [k, v] of Object.entries(updates)) {
    if (k === "id") continue
    sets.push(`#${k} = :${k}`)
    values[`:${k}`] = v
    names[`#${k}`] = k
  }
  if (sets.length === 0) return null
  return { expression: `SET ${sets.join(", ")}`, names, values }
}

// ── Exercises ─────────────────────────────────────────────────────────────────

export interface ExerciseRecord {
  id: string
  name: string
  videoS3Key?: string
  thumbnailS3Key?: string
  primaryMuscle?: string
  secondaryMuscles?: string
  equipment?: string
  category?: string
  difficulty?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED"
  movementPattern?: string
  coachingCues?: string
  commonMistakes?: string
  setup?: string
  execution?: string
  notes?: string
  substitutions?: string
  status?: "ACTIVE" | "INACTIVE"
  createdAt?: string
}

export async function createExerciseRecord(data: Omit<ExerciseRecord, "id" | "createdAt"> & { id?: string }): Promise<ExerciseRecord> {
  const db = makeDb()
  const id = data.id ?? randomBytes(16).toString("hex")
  const record: ExerciseRecord = {
    ...data,
    id,
    status: data.status ?? "ACTIVE",
    createdAt: new Date().toISOString(),
  }
  await db.send(
    new PutCommand({
      TableName: TABLE,
      Item: { userId: `coaching_exercise_${id}`, ...record },
    })
  )
  return record
}

export async function getExerciseRecord(id: string): Promise<ExerciseRecord | null> {
  const db = makeDb()
  const result = await db.send(
    new GetCommand({ TableName: TABLE, Key: { userId: `coaching_exercise_${id}` } })
  )
  if (!result.Item) return null
  return result.Item as ExerciseRecord
}

export async function listExerciseRecords(): Promise<ExerciseRecord[]> {
  const db = makeDb()
  const result = await db.send(
    new ScanCommand({
      TableName: TABLE,
      FilterExpression: "begins_with(userId, :prefix)",
      ExpressionAttributeValues: { ":prefix": "coaching_exercise_" },
    })
  )
  return ((result.Items ?? []) as ExerciseRecord[])
    .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""))
}

export async function updateExerciseRecord(id: string, updates: Partial<ExerciseRecord>): Promise<void> {
  const db = makeDb()
  const expr = buildUpdateExpression(updates)
  if (!expr) return
  await db.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { userId: `coaching_exercise_${id}` },
      UpdateExpression: expr.expression,
      ExpressionAttributeNames: expr.names,
      ExpressionAttributeValues: expr.values,
    })
  )
}

// ── Programs ──────────────────────────────────────────────────────────────────

export interface CoachingProgramRecord {
  id: string
  name: string
  clientEmail?: string
  isTemplate?: boolean
  status?: "DRAFT" | "ACTIVE" | "COMPLETED" | "ARCHIVED"
  weeks: string // JSON string
  notes?: string
  createdAt?: string
  updatedAt?: string
}

export async function createProgramRecord(data: Omit<CoachingProgramRecord, "id" | "createdAt"> & { id?: string }): Promise<CoachingProgramRecord> {
  const db = makeDb()
  const id = data.id ?? randomBytes(16).toString("hex")
  const now = new Date().toISOString()
  const record: CoachingProgramRecord = {
    ...data,
    id,
    status: data.status ?? "DRAFT",
    createdAt: now,
    updatedAt: now,
  }
  await db.send(
    new PutCommand({
      TableName: TABLE,
      Item: { userId: `coaching_program_${id}`, ...record },
    })
  )
  return record
}

export async function getProgramRecord(id: string): Promise<CoachingProgramRecord | null> {
  const db = makeDb()
  const result = await db.send(
    new GetCommand({ TableName: TABLE, Key: { userId: `coaching_program_${id}` } })
  )
  if (!result.Item) return null
  return result.Item as CoachingProgramRecord
}

export async function listProgramRecords(): Promise<CoachingProgramRecord[]> {
  const db = makeDb()
  const result = await db.send(
    new ScanCommand({
      TableName: TABLE,
      FilterExpression: "begins_with(userId, :prefix)",
      ExpressionAttributeValues: { ":prefix": "coaching_program_" },
    })
  )
  return ((result.Items ?? []) as CoachingProgramRecord[])
    .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""))
}

export async function updateProgramRecord(id: string, updates: Partial<CoachingProgramRecord>): Promise<void> {
  const db = makeDb()
  const expr = buildUpdateExpression({ ...updates, updatedAt: new Date().toISOString() })
  if (!expr) return
  await db.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { userId: `coaching_program_${id}` },
      UpdateExpression: expr.expression,
      ExpressionAttributeNames: expr.names,
      ExpressionAttributeValues: expr.values,
    })
  )
}

// ── Workouts (saved single-workout templates for program composition) ────────

export interface CoachingWorkoutTemplateRecord {
  id: string
  name: string
  description?: string
  category?: string         // e.g. "Lower Body", "Push", "Pull"
  exercises: string         // JSON array same shape as program day exercises
  createdAt?: string
  updatedAt?: string
}

export async function createWorkoutTemplate(data: Omit<CoachingWorkoutTemplateRecord, "id" | "createdAt" | "updatedAt"> & { id?: string }): Promise<CoachingWorkoutTemplateRecord> {
  const db = makeDb()
  const id = data.id ?? randomBytes(16).toString("hex")
  const now = new Date().toISOString()
  const record: CoachingWorkoutTemplateRecord = { ...data, id, createdAt: now, updatedAt: now }
  await db.send(
    new PutCommand({
      TableName: TABLE,
      Item: { userId: `coaching_workout_${id}`, ...record },
    })
  )
  return record
}

export async function getWorkoutTemplate(id: string): Promise<CoachingWorkoutTemplateRecord | null> {
  const db = makeDb()
  const result = await db.send(
    new GetCommand({ TableName: TABLE, Key: { userId: `coaching_workout_${id}` } })
  )
  if (!result.Item) return null
  return result.Item as CoachingWorkoutTemplateRecord
}

export async function listWorkoutTemplates(): Promise<CoachingWorkoutTemplateRecord[]> {
  const db = makeDb()
  const result = await db.send(
    new ScanCommand({
      TableName: TABLE,
      FilterExpression: "begins_with(userId, :prefix)",
      ExpressionAttributeValues: { ":prefix": "coaching_workout_" },
    })
  )
  return ((result.Items ?? []) as CoachingWorkoutTemplateRecord[])
    .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""))
}

export async function updateWorkoutTemplate(id: string, updates: Partial<CoachingWorkoutTemplateRecord>): Promise<void> {
  const db = makeDb()
  const expr = buildUpdateExpression({ ...updates, updatedAt: new Date().toISOString() })
  if (!expr) return
  await db.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { userId: `coaching_workout_${id}` },
      UpdateExpression: expr.expression,
      ExpressionAttributeNames: expr.names,
      ExpressionAttributeValues: expr.values,
    })
  )
}

export async function deleteWorkoutTemplate(id: string): Promise<void> {
  const db = makeDb()
  await db.send(
    new DeleteCommand({
      TableName: TABLE,
      Key: { userId: `coaching_workout_${id}` },
    })
  )
}

// ── Workout Logs ──────────────────────────────────────────────────────────────

export interface CoachingWorkoutLogRecord {
  id: string
  clientEmail: string
  programId: string
  weekNumber: number
  dayLabel: string
  completedAt: string
  setData: string // JSON
  overallRpe?: number
  energyLevel?: number
  clientNotes?: string
  coachFeedback?: string
  coachFeedbackAt?: string
}

export async function getWorkoutLogRecord(id: string): Promise<CoachingWorkoutLogRecord | null> {
  const db = makeDb()
  const result = await db.send(
    new GetCommand({ TableName: TABLE, Key: { userId: `coaching_workoutlog_${id}` } })
  )
  if (!result.Item) return null
  return result.Item as CoachingWorkoutLogRecord
}

export async function updateWorkoutLogRecord(id: string, updates: Partial<CoachingWorkoutLogRecord>): Promise<void> {
  const db = makeDb()
  const sets: string[] = []
  const values: Record<string, unknown> = {}
  const names: Record<string, string> = {}
  for (const [k, v] of Object.entries(updates)) {
    if (k === "id") continue
    sets.push(`#${k} = :${k}`)
    values[`:${k}`] = v
    names[`#${k}`] = k
  }
  if (sets.length === 0) return
  await db.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { userId: `coaching_workoutlog_${id}` },
      UpdateExpression: `SET ${sets.join(", ")}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
    })
  )
}

export async function createWorkoutLogRecord(data: Omit<CoachingWorkoutLogRecord, "id">): Promise<CoachingWorkoutLogRecord> {
  const db = makeDb()
  const id = randomBytes(16).toString("hex")
  const record: CoachingWorkoutLogRecord = { id, ...data }
  await db.send(
    new PutCommand({
      TableName: TABLE,
      Item: { userId: `coaching_workoutlog_${id}`, ...record },
    })
  )
  return record
}

export async function listWorkoutLogRecords(clientEmail?: string): Promise<CoachingWorkoutLogRecord[]> {
  const db = makeDb()
  const params = clientEmail
    ? {
        TableName: TABLE,
        FilterExpression: "begins_with(userId, :prefix) AND clientEmail = :email",
        ExpressionAttributeValues: { ":prefix": "coaching_workoutlog_", ":email": clientEmail.toLowerCase() },
      }
    : {
        TableName: TABLE,
        FilterExpression: "begins_with(userId, :prefix)",
        ExpressionAttributeValues: { ":prefix": "coaching_workoutlog_" },
      }
  const result = await db.send(new ScanCommand(params))
  return ((result.Items ?? []) as CoachingWorkoutLogRecord[])
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
}

// ── Progress Snapshots ────────────────────────────────────────────────────────

export interface ProgressSnapshotRecord {
  id: string
  clientEmail: string
  snapshotDate: string
  weight?: number
  weightUnit?: "LBS" | "KG"
  waist?: number
  hips?: number
  glutes?: number
  chest?: number
  arm?: number
  thigh?: number
  customMeasurements?: string
  photoS3Keys?: string
  notes?: string
}

export async function createSnapshotRecord(data: Omit<ProgressSnapshotRecord, "id">): Promise<ProgressSnapshotRecord> {
  const db = makeDb()
  const id = randomBytes(16).toString("hex")
  const record: ProgressSnapshotRecord = { id, ...data }
  await db.send(
    new PutCommand({
      TableName: TABLE,
      Item: { userId: `coaching_snapshot_${id}`, ...record },
    })
  )
  return record
}

export async function listSnapshotRecords(clientEmail?: string): Promise<ProgressSnapshotRecord[]> {
  const db = makeDb()
  const params = clientEmail
    ? {
        TableName: TABLE,
        FilterExpression: "begins_with(userId, :prefix) AND clientEmail = :email",
        ExpressionAttributeValues: { ":prefix": "coaching_snapshot_", ":email": clientEmail.toLowerCase() },
      }
    : {
        TableName: TABLE,
        FilterExpression: "begins_with(userId, :prefix)",
        ExpressionAttributeValues: { ":prefix": "coaching_snapshot_" },
      }
  const result = await db.send(new ScanCommand(params))
  return ((result.Items ?? []) as ProgressSnapshotRecord[])
    .sort((a, b) => b.snapshotDate.localeCompare(a.snapshotDate))
}

// ── Goals ─────────────────────────────────────────────────────────────────────

export interface CoachingGoalRecord {
  id: string
  clientEmail: string
  type: string                  // "body-composition" | "strength" | "habit" | "custom"
  label?: string
  startDate?: string
  targetDate?: string
  startValue?: number
  targetValue?: number
  currentValue?: number
  unit?: string                 // e.g. "lbs", "kg", "in", "g/day", "reps"
  notes?: string
  status?: "ON_TRACK" | "NEEDS_ATTENTION" | "ACHIEVED"
  createdAt?: string
}

export async function createGoalRecord(data: Omit<CoachingGoalRecord, "id">): Promise<CoachingGoalRecord> {
  const db = makeDb()
  const id = randomBytes(16).toString("hex")
  const record: CoachingGoalRecord = { id, ...data }
  await db.send(
    new PutCommand({
      TableName: TABLE,
      Item: { userId: `coaching_goal_${id}`, ...record },
    })
  )
  return record
}

export async function listGoalRecords(clientEmail?: string): Promise<CoachingGoalRecord[]> {
  const db = makeDb()
  const params = clientEmail
    ? {
        TableName: TABLE,
        FilterExpression: "begins_with(userId, :prefix) AND clientEmail = :email",
        ExpressionAttributeValues: { ":prefix": "coaching_goal_", ":email": clientEmail.toLowerCase() },
      }
    : {
        TableName: TABLE,
        FilterExpression: "begins_with(userId, :prefix)",
        ExpressionAttributeValues: { ":prefix": "coaching_goal_" },
      }
  const result = await db.send(new ScanCommand(params))
  return (result.Items ?? []) as CoachingGoalRecord[]
}

export async function updateGoalRecord(id: string, updates: Partial<CoachingGoalRecord>): Promise<void> {
  const db = makeDb()
  const expr = buildUpdateExpression(updates)
  if (!expr) return
  await db.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { userId: `coaching_goal_${id}` },
      UpdateExpression: expr.expression,
      ExpressionAttributeNames: expr.names,
      ExpressionAttributeValues: expr.values,
    })
  )
}

// ── Coach Tasks ───────────────────────────────────────────────────────────────

export interface CoachTaskRecord {
  id: string
  title: string
  clientEmail?: string
  dueDate?: string
  completedAt?: string
  priority?: "HIGH" | "MEDIUM" | "LOW"
  notes?: string
  createdAt?: string
}

export async function createTaskRecord(data: Omit<CoachTaskRecord, "id" | "createdAt">): Promise<CoachTaskRecord> {
  const db = makeDb()
  const id = randomBytes(16).toString("hex")
  const record: CoachTaskRecord = { id, createdAt: new Date().toISOString(), ...data }
  await db.send(
    new PutCommand({
      TableName: TABLE,
      Item: { userId: `coaching_task_${id}`, ...record },
    })
  )
  return record
}

export async function listTaskRecords(): Promise<CoachTaskRecord[]> {
  const db = makeDb()
  const result = await db.send(
    new ScanCommand({
      TableName: TABLE,
      FilterExpression: "begins_with(userId, :prefix)",
      ExpressionAttributeValues: { ":prefix": "coaching_task_" },
    })
  )
  return ((result.Items ?? []) as CoachTaskRecord[])
    .sort((a) => (a.completedAt ? 1 : -1))
}

export async function updateTaskRecord(id: string, updates: Partial<CoachTaskRecord>): Promise<void> {
  const db = makeDb()
  const expr = buildUpdateExpression(updates)
  if (!expr) return
  await db.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { userId: `coaching_task_${id}` },
      UpdateExpression: expr.expression,
      ExpressionAttributeNames: expr.names,
      ExpressionAttributeValues: expr.values,
    })
  )
}

export async function deleteTaskRecord(id: string): Promise<void> {
  const db = makeDb()
  await db.send(
    new DeleteCommand({
      TableName: TABLE,
      Key: { userId: `coaching_task_${id}` },
    })
  )
}

// ── Hard delete a coaching client + all their coaching data ─────────────────

export interface DeleteClientResult {
  clientRecord: boolean
  accessGrant: boolean
  workoutLogs: number
  checkIns: number
  snapshots: number
  goals: number
  messages: number
}

export async function deleteCoachingClientCascade(email: string): Promise<DeleteClientResult> {
  const db = makeDb()
  const lower = email.toLowerCase()
  const result: DeleteClientResult = {
    clientRecord: false, accessGrant: false,
    workoutLogs: 0, checkIns: 0, snapshots: 0, goals: 0, messages: 0,
  }

  // 1. Client record
  try {
    await db.send(new DeleteCommand({ TableName: TABLE, Key: { userId: `coaching_client_${lower}` } }))
    result.clientRecord = true
  } catch (e) { console.error("delete client record failed", e) }

  // 2. Access grant
  try {
    await db.send(new DeleteCommand({ TableName: TABLE, Key: { userId: `coaching_access_${lower}` } }))
    result.accessGrant = true
  } catch (e) { console.error("delete access grant failed", e) }

  // 3. Workout logs
  const logs = await listWorkoutLogRecords(lower)
  for (const log of logs) {
    try {
      await db.send(new DeleteCommand({ TableName: TABLE, Key: { userId: `coaching_workoutlog_${log.id}` } }))
      result.workoutLogs += 1
    } catch (e) { console.error("delete workout log failed", log.id, e) }
  }

  // 4. Check-ins
  const checkIns = await listCoachingCheckIns(lower)
  for (const ci of checkIns) {
    try {
      await db.send(new DeleteCommand({ TableName: TABLE, Key: { userId: `coaching_checkin_${ci.id}` } }))
      result.checkIns += 1
    } catch (e) { console.error("delete check-in failed", ci.id, e) }
  }

  // 5. Progress snapshots
  const snapshots = await listSnapshotRecords(lower)
  for (const s of snapshots) {
    try {
      await db.send(new DeleteCommand({ TableName: TABLE, Key: { userId: `coaching_snapshot_${s.id}` } }))
      result.snapshots += 1
    } catch (e) { console.error("delete snapshot failed", s.id, e) }
  }

  // 6. Goals
  const goals = await listGoalRecords(lower)
  for (const g of goals) {
    try {
      await db.send(new DeleteCommand({ TableName: TABLE, Key: { userId: `coaching_goal_${g.id}` } }))
      result.goals += 1
    } catch (e) { console.error("delete goal failed", g.id, e) }
  }

  // 7. Messages — thread is deterministic: sorted [client, coach].join("_")
  const COACH_EMAIL = "lisa.p.mcpherson@gmail.com"
  const threadId = [lower, COACH_EMAIL].sort().join("_")
  const messages = await listCoachingMessages(threadId)
  for (const m of messages) {
    try {
      await db.send(new DeleteCommand({ TableName: TABLE, Key: { userId: `coaching_msg_${m.threadId}_${m.sentAt}_${m.id}` } }))
      result.messages += 1
    } catch (e) { console.error("delete message failed", m.id, e) }
  }

  return result
}

// ── Bundle purchase tracking (for bundle → coaching credit) ─────────────────

export const BUNDLE_CREDIT_CENTS = 13700 // $137
export const BUNDLE_CREDIT_DAYS = 90     // credit valid for 90 days after purchase

export interface BundlePurchaseRecord {
  email: string
  purchasedAt: string
  paymentIntentId: string
  bundleCreditUsedAt?: string
  usedForCoachingSubscriptionId?: string
}

export async function recordBundlePurchase(email: string, paymentIntentId: string): Promise<void> {
  const db = makeDb()
  const lower = email.toLowerCase()
  // Do not overwrite if a record already exists (idempotent — first purchase wins for credit tracking)
  const existing = await db.send(new GetCommand({ TableName: TABLE, Key: { userId: `bundle_purchase_${lower}` } }))
  if (existing.Item) return
  const record: BundlePurchaseRecord = {
    email: lower,
    purchasedAt: new Date().toISOString(),
    paymentIntentId,
  }
  await db.send(new PutCommand({
    TableName: TABLE,
    Item: { userId: `bundle_purchase_${lower}`, ...record },
  }))
}

export async function getBundlePurchase(email: string): Promise<BundlePurchaseRecord | null> {
  const db = makeDb()
  const result = await db.send(new GetCommand({
    TableName: TABLE, Key: { userId: `bundle_purchase_${email.toLowerCase()}` },
  }))
  if (!result.Item) return null
  return result.Item as BundlePurchaseRecord
}

export type BundleCredit = { available: boolean; amountCents: number; expiresAt: string | null; purchasedAt: string | null }

export async function getBundleCredit(email: string): Promise<BundleCredit> {
  const record = await getBundlePurchase(email)
  if (!record) return { available: false, amountCents: BUNDLE_CREDIT_CENTS, expiresAt: null, purchasedAt: null }
  if (record.bundleCreditUsedAt) return { available: false, amountCents: BUNDLE_CREDIT_CENTS, expiresAt: null, purchasedAt: record.purchasedAt }
  const expiresAt = new Date(new Date(record.purchasedAt).getTime() + BUNDLE_CREDIT_DAYS * 86_400_000).toISOString()
  const expired = expiresAt < new Date().toISOString()
  return {
    available: !expired,
    amountCents: BUNDLE_CREDIT_CENTS,
    expiresAt,
    purchasedAt: record.purchasedAt,
  }
}

export async function markBundleCreditUsed(email: string, subscriptionId: string): Promise<void> {
  const db = makeDb()
  const lower = email.toLowerCase()
  await db.send(new UpdateCommand({
    TableName: TABLE,
    Key: { userId: `bundle_purchase_${lower}` },
    UpdateExpression: "SET bundleCreditUsedAt = :at, usedForCoachingSubscriptionId = :sub",
    ExpressionAttributeValues: { ":at": new Date().toISOString(), ":sub": subscriptionId },
  }))
}

// ── Terms & liability-waiver version tracking + acceptance log ──────────────
//
// TERMS_VERSION and LIABILITY_WAIVER_VERSION are version slugs pinned to the
// substantive text of the corresponding legal documents at any given moment.
// Bump these values whenever the actual legal wording changes so acceptance
// records can be traced back to the exact version the customer saw.
//
// Bump policy: format `YYYY-MM-DD[-suffix]`. Cosmetic edits (typos, styling)
// do not require a bump. Substantive edits — refund rules, cancellation
// rights, liability language, arbitration terms, scope of the waiver — MUST
// bump the version and archive the previous copy (git tag `terms-{version}`).
export const TERMS_VERSION = "2026-08-12-v2"
export const LIABILITY_WAIVER_VERSION = "2026-08-12"

export type AcceptanceKind = "course-purchase" | "coaching-subscription"

export interface TermsAcceptanceRecord {
  id: string
  acceptedAt: string
  kind: AcceptanceKind
  customerEmail: string
  termsVersion: string
  // Populated for coaching acceptances; undefined for course purchases
  liabilityWaiverVersion?: string
  // Product identifier — "training" | "nutrition" | "bundle" | "tracker" | "coaching"
  product: string
  // Coaching tier text as shown to the customer (e.g. "3-month coaching — $397/month")
  coachingOption?: string
  // Amount charged (cents). For coaching, recurringAmountCents mirrors this.
  amountCents?: number
  recurringAmountCents?: number
  // Stripe identifiers so we can cross-reference with Stripe records
  stripePaymentIntentId?: string
  stripeCheckoutSessionId?: string
  stripeSubscriptionId?: string
  applicationId?: string
  // Optional network context if it was available in the request flow
  ipAddress?: string
  userAgent?: string
  // Short label of the terms document link the customer saw (e.g. "/terms")
  termsUrl?: string
  liabilityWaiverUrl?: string
}

export async function recordTermsAcceptance(
  data: Omit<TermsAcceptanceRecord, "id" | "acceptedAt"> & { id?: string; acceptedAt?: string }
): Promise<TermsAcceptanceRecord> {
  const db = makeDb()
  const id = data.id ?? randomBytes(16).toString("hex")
  const record: TermsAcceptanceRecord = {
    ...data,
    id,
    acceptedAt: data.acceptedAt ?? new Date().toISOString(),
    customerEmail: data.customerEmail.toLowerCase(),
  }
  await db.send(new PutCommand({
    TableName: TABLE,
    Item: { userId: `terms_acceptance_${id}`, ...record },
  }))
  return record
}

export async function listAcceptancesForEmail(email: string): Promise<TermsAcceptanceRecord[]> {
  const db = makeDb()
  const result = await db.send(new ScanCommand({
    TableName: TABLE,
    FilterExpression: "begins_with(userId, :prefix) AND customerEmail = :email",
    ExpressionAttributeValues: {
      ":prefix": "terms_acceptance_",
      ":email": email.toLowerCase(),
    },
  }))
  return ((result.Items ?? []) as TermsAcceptanceRecord[])
    .sort((a, b) => b.acceptedAt.localeCompare(a.acceptedAt))
}

// ── Coaching-access version stamping ─────────────────────────────────────────
// Versions are stored directly on the coaching_access_ record so the layout
// can check them with a single GET (the same record already read by
// hasCoachingAccess) rather than doing an expensive Scan.

export async function getCoachingAccessVersions(email: string): Promise<{
  acceptedTermsVersion?: string
  acceptedWaiverVersion?: string
} | null> {
  try {
    const db = makeDb()
    const result = await db.send(
      new GetCommand({ TableName: TABLE, Key: { userId: `coaching_access_${email.toLowerCase()}` } })
    )
    if (!result.Item) return null
    return {
      acceptedTermsVersion: result.Item.acceptedTermsVersion as string | undefined,
      acceptedWaiverVersion: result.Item.acceptedWaiverVersion as string | undefined,
    }
  } catch {
    return null
  }
}

export async function stampCoachingAccessVersions(
  email: string,
  termsVersion: string,
  waiverVersion: string
): Promise<void> {
  const db = makeDb()
  await db.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { userId: `coaching_access_${email.toLowerCase()}` },
      UpdateExpression: "SET acceptedTermsVersion = :tv, acceptedWaiverVersion = :wv",
      ExpressionAttributeValues: { ":tv": termsVersion, ":wv": waiverVersion },
    })
  )
}

// ── Waiver-acceptance tokens (one-time links, e.g. for clients who paid ──────
// without completing the acceptance interstitial)

export interface WaiverToken {
  email: string
  expiresAt: string
  used: boolean
}

export function generateWaiverToken(): string {
  return randomBytes(32).toString("hex")
}

export async function storeWaiverToken(token: string, email: string): Promise<void> {
  const db = makeDb()
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
  await db.send(
    new PutCommand({
      TableName: TABLE,
      Item: {
        userId: `waiver_token_${token}`,
        email: email.toLowerCase(),
        expiresAt,
        used: false,
      },
    })
  )
}

export async function getWaiverToken(token: string): Promise<WaiverToken | null> {
  try {
    const db = makeDb()
    const result = await db.send(
      new GetCommand({ TableName: TABLE, Key: { userId: `waiver_token_${token}` } })
    )
    if (!result.Item) return null
    return {
      email: result.Item.email as string,
      expiresAt: result.Item.expiresAt as string,
      used: result.Item.used as boolean,
    }
  } catch {
    return null
  }
}

export async function markWaiverTokenUsed(token: string): Promise<void> {
  const db = makeDb()
  await db.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { userId: `waiver_token_${token}` },
      UpdateExpression: "SET #used = :true",
      ExpressionAttributeNames: { "#used": "used" },
      ExpressionAttributeValues: { ":true": true },
    })
  )
}
