import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb"
import { scanAll } from "@/lib/dynamoScan"
import { isAdminEmail } from "@/lib/authTokens"
import { buildOverview, OVERVIEW_ATTRIBUTES, OVERVIEW_PREFIXES, type CoachingOverview } from "@/lib/coachingOverview"

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

// One pass over the table instead of one full scan per record type: every
// scan reads the whole table before filtering, so the old dashboard paid for
// six to ten full reads per page load.
export async function loadCoachingOverview(now = new Date()): Promise<CoachingOverview> {
  const names: Record<string, string> = {}
  OVERVIEW_ATTRIBUTES.forEach((a, i) => { names[`#a${i}`] = a })
  const values: Record<string, string> = {}
  OVERVIEW_PREFIXES.forEach((p, i) => { values[`:p${i}`] = p })
  const items = await scanAll<Record<string, unknown>>(makeDb(), {
    TableName: TABLE,
    FilterExpression: OVERVIEW_PREFIXES.map((_, i) => `begins_with(#a0, :p${i})`).join(" OR "),
    ProjectionExpression: Object.keys(names).join(", "),
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
  })
  return buildOverview(items, { now, isCoach: isAdminEmail })
}
