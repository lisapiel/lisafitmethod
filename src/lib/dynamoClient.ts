import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb"

// One DynamoDB client per server instance, so requests reuse the same open
// connections instead of starting a new secure connection every call. It
// holds no per-user state: every call still names its own key or filter.
let shared: DynamoDBDocumentClient | null = null

export function sharedDocClient(): DynamoDBDocumentClient {
  if (!shared) {
    shared = DynamoDBDocumentClient.from(
      new DynamoDBClient({
        region: process.env.COGNITO_REGION ?? "us-east-2",
        credentials: {
          accessKeyId: process.env.COGNITO_AWS_ACCESS_KEY_ID ?? "",
          secretAccessKey: process.env.COGNITO_AWS_SECRET_ACCESS_KEY ?? "",
        },
      }),
    )
  }
  return shared
}
