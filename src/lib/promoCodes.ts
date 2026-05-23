import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb"

const TABLE = "lfm-user-progress"
const PROMO_KEY = "__promo_codes__"

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

export async function getPromoCodes(): Promise<Record<string, number>> {
  try {
    const db = makeDb()
    const result = await db.send(new GetCommand({ TableName: TABLE, Key: { userId: PROMO_KEY } }))
    if (!result.Item?.codes) return {}
    return result.Item.codes as Record<string, number>
  } catch {
    return {}
  }
}

export async function savePromoCodes(codes: Record<string, number>): Promise<void> {
  const db = makeDb()
  await db.send(
    new PutCommand({
      TableName: TABLE,
      Item: { userId: PROMO_KEY, codes, updatedAt: new Date().toISOString() },
    })
  )
}
