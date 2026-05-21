import type { ResourcesConfig } from "aws-amplify"

// In CI, amplify_outputs.json is generated before next build via `npx ampx generate outputs`.
// Locally, run `npx ampx sandbox` to generate it.
// Falls back to env vars so the app still builds in environments without the file.
let amplifyConfig: ResourcesConfig

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const outputs = require("../../amplify_outputs.json")
  amplifyConfig = outputs as ResourcesConfig
} catch {
  amplifyConfig = {
    Auth: {
      Cognito: {
        userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID ?? "",
        userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID ?? "",
        loginWith: { email: true },
      },
    },
  }
}

export { amplifyConfig }
export type { Schema } from "../../amplify/data/resource"
