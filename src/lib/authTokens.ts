import { randomBytes } from "crypto"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, ScanCommand } from "@aws-sdk/lib-dynamodb"

const TABLE = "lfm-user-progress"

// Owner account — always has access to everything, excluded from customer analytics
export const ADMIN_EMAIL = "lisa.p.mcpherson@gmail.com"

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
  if (email.toLowerCase() === ADMIN_EMAIL) return true
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
  if (email.toLowerCase() === ADMIN_EMAIL) return true
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
  if (email.toLowerCase() === ADMIN_EMAIL) return true
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
  if (email.toLowerCase() === ADMIN_EMAIL) return true
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
  if (email.toLowerCase() === ADMIN_EMAIL) return true
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

export interface CoachingApplication {
  userId: string
  id: string
  email: string
  name: string
  goals: string
  currentFitnessLevel: string
  whyCoaching: string
  status: "PENDING" | "APPROVED" | "DECLINED" | "PAID"
  applicationDate: string
  reviewedAt?: string
  stripeCheckoutUrl?: string
  stripeSubscriptionId?: string
}

export async function submitCoachingApplication(data: {
  email: string
  name: string
  goals: string
  currentFitnessLevel: string
  whyCoaching: string
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
  status?: "ACTIVE" | "PAUSED" | "INACTIVE"
  currentProgramId?: string
  privateNotes?: string
  createdAt?: string
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
