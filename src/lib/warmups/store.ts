import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb"
import { listCoachingApplications, listExerciseRecords } from "@/lib/authTokens"
import { indexLibrary, type LibraryIndex } from "./engine"
import { effectiveOptions, suggestFromIntake, type ProfileSuggestion, type WarmupProfile } from "./profile"
import type { WarmupOptions } from "./engine"

const TABLE = process.env.DYNAMODB_TABLE ?? "lfm-user-progress"

function makeDb() {
  return DynamoDBDocumentClient.from(new DynamoDBClient({
    region: process.env.COGNITO_REGION ?? "us-east-2",
    credentials: {
      accessKeyId: process.env.COGNITO_AWS_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.COGNITO_AWS_SECRET_ACCESS_KEY ?? "",
    },
  }))
}

const key = (email: string) => ({ userId: `coaching_warmup_profile_${email.toLowerCase()}` })

export async function getWarmupProfile(email: string): Promise<WarmupProfile | null> {
  const r = await makeDb().send(new GetCommand({ TableName: TABLE, Key: key(email) }))
  if (!r.Item) return null
  const { beginner, bands, backSafe, foamRoller, updatedAt } = r.Item as WarmupProfile
  return { beginner, bands, backSafe, foamRoller, updatedAt }
}

export async function putWarmupProfile(email: string, profile: WarmupProfile): Promise<WarmupProfile> {
  const clean: WarmupProfile = { updatedAt: new Date().toISOString() }
  for (const k of ["beginner", "bands", "backSafe", "foamRoller"] as const) {
    if (typeof profile[k] === "boolean") clean[k] = profile[k]
  }
  await makeDb().send(new PutCommand({ TableName: TABLE, Item: { ...key(email), email: email.toLowerCase(), ...clean } }))
  return clean
}

export async function suggestionForClient(email: string): Promise<ProfileSuggestion> {
  const lower = email.toLowerCase()
  const apps = (await listCoachingApplications()).filter((a) =>
    a.email?.toLowerCase() === lower || (a as { ownerEmail?: string }).ownerEmail?.toLowerCase() === lower)
  return suggestFromIntake(apps[0] ?? null)
}

export async function clientWarmupSettings(email: string): Promise<{ profile: WarmupProfile | null; suggestion: ProfileSuggestion; options: WarmupOptions }> {
  const [profile, suggestion] = await Promise.all([getWarmupProfile(email), suggestionForClient(email)])
  return { profile, suggestion, options: effectiveOptions(profile, suggestion) }
}

export async function loadLibraryIndex(): Promise<LibraryIndex> {
  return indexLibrary(await listExerciseRecords())
}
