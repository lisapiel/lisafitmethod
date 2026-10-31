import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb"

const TABLE = process.env.DYNAMODB_TABLE ?? "lfm-user-progress"

function makeDb() {
  return DynamoDBDocumentClient.from(
    new DynamoDBClient({
      region: process.env.COGNITO_REGION ?? "us-east-2",
      credentials: {
        accessKeyId: process.env.COGNITO_AWS_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.COGNITO_AWS_SECRET_ACCESS_KEY ?? "",
      },
    }),
  )
}

// One person, one Lisa Fit Method account — even when they reach us under a
// second address.
//
// Someone can buy a course on one email and later apply for coaching on
// another. Keying ownership on the address alone made those two people as far
// as the system was concerned, which is how a paying client ended up with
// courses on one login and coaching on a login that had never been issued a
// password.
//
// A link is only ever written when the person has proved both sides: they
// authenticated as the account that will own the record, and they held the
// invitation that was emailed to the other address. Names are never used, and
// nothing is linked automatically.
export type AccountAlias = {
  aliasEmail: string
  primaryEmail: string
  primarySub: string
  linkedAt: string
  method: "coaching-invitation" | "admin-correction"
  note?: string
}

const aliasKey = (email: string) => `account_alias_${email.trim().toLowerCase()}`
const linkKey = (sub: string) => `account_link_${sub}`

export async function getAccountAlias(email: string): Promise<AccountAlias | null> {
  if (!email) return null
  try {
    const db = makeDb()
    const result = await db.send(new GetCommand({ TableName: TABLE, Key: { userId: aliasKey(email) } }))
    const item = result.Item as (AccountAlias & { userId: string }) | undefined
    return item ? (item as AccountAlias) : null
  } catch {
    return null
  }
}

// The address that actually owns whatever this one points at. Unlinked
// addresses resolve to themselves, so every caller can route through this
// without caring whether a link exists.
export async function resolveOwnerEmail(email: string): Promise<string> {
  const lower = (email ?? "").trim().toLowerCase()
  if (!lower) return lower
  const alias = await getAccountAlias(lower)
  return alias?.primaryEmail?.toLowerCase() ?? lower
}

export async function linkEmailToAccount(input: {
  aliasEmail: string
  primaryEmail: string
  primarySub: string
  method: AccountAlias["method"]
  note?: string
}): Promise<AccountAlias> {
  const aliasEmail = input.aliasEmail.trim().toLowerCase()
  const primaryEmail = input.primaryEmail.trim().toLowerCase()
  if (!aliasEmail || !primaryEmail) throw new Error("linkEmailToAccount: both addresses are required")
  if (!input.primarySub) throw new Error("linkEmailToAccount: primarySub is required")
  if (aliasEmail === primaryEmail) throw new Error("linkEmailToAccount: addresses are identical")

  // Never re-point an address that already belongs to someone else. Changing
  // an existing link is an account takeover, so it has to be done by hand.
  const existing = await getAccountAlias(aliasEmail)
  if (existing && existing.primaryEmail.toLowerCase() !== primaryEmail) {
    throw new Error(`linkEmailToAccount: ${aliasEmail} is already linked to a different account`)
  }

  const alias: AccountAlias = {
    aliasEmail,
    primaryEmail,
    primarySub: input.primarySub,
    linkedAt: new Date().toISOString(),
    method: input.method,
    ...(input.note ? { note: input.note } : {}),
  }

  const db = makeDb()
  await db.send(new PutCommand({ TableName: TABLE, Item: { userId: aliasKey(aliasEmail), ...alias } }))

  // Mirror onto the owning account so the set of addresses a person reaches
  // us under can be read from the stable id rather than scanned for.
  await db.send(new UpdateCommand({
    TableName: TABLE,
    Key: { userId: linkKey(input.primarySub) },
    UpdateExpression:
      "SET primaryEmail = :p, sub = :s, aliasEmails = list_append(if_not_exists(aliasEmails, :empty), :one), updatedAt = :now",
    ExpressionAttributeValues: {
      ":p": primaryEmail,
      ":s": input.primarySub,
      ":one": [aliasEmail],
      ":empty": [] as string[],
      ":now": alias.linkedAt,
    },
  })).catch(() => { /* the alias record above is the authoritative one */ })

  return alias
}

export async function getAccountLink(sub: string): Promise<{ primaryEmail: string; aliasEmails: string[] } | null> {
  if (!sub) return null
  try {
    const db = makeDb()
    const result = await db.send(new GetCommand({ TableName: TABLE, Key: { userId: linkKey(sub) } }))
    if (!result.Item) return null
    return {
      primaryEmail: String(result.Item.primaryEmail ?? "").toLowerCase(),
      aliasEmails: (result.Item.aliasEmails as string[] | undefined) ?? [],
    }
  } catch {
    return null
  }
}
