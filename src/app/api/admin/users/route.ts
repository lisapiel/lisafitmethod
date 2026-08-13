import { NextRequest, NextResponse } from "next/server"
import {
  CognitoIdentityProviderClient,
  GetUserCommand,
  ListUsersCommand,
} from "@aws-sdk/client-cognito-identity-provider"
import { isAdminEmail } from "@/lib/authTokens"

export const dynamic = "force-dynamic"

function makeCognito() {
  return new CognitoIdentityProviderClient({
    region: process.env.COGNITO_REGION ?? "us-east-2",
    credentials: {
      accessKeyId: process.env.COGNITO_AWS_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.COGNITO_AWS_SECRET_ACCESS_KEY ?? "",
    },
  })
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const token = auth.slice(7)

  // Verify token and confirm caller is admin
  try {
    const cognito = makeCognito()
    const result = await cognito.send(new GetUserCommand({ AccessToken: token }))
    const email = result.UserAttributes?.find((a) => a.Name === "email")?.Value
    if (!isAdminEmail(email ?? "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // List all users in the pool
  const cognito = makeCognito()
  const users: { email: string; createdAt: string; status: string }[] = []
  let paginationToken: string | undefined

  do {
    const result = await cognito.send(
      new ListUsersCommand({
        UserPoolId: process.env.COGNITO_USER_POOL_ID ?? "",
        Limit: 60,
        AttributesToGet: ["email"],
        ...(paginationToken ? { PaginationToken: paginationToken } : {}),
      })
    )

    for (const user of result.Users ?? []) {
      const email = user.Attributes?.find((a) => a.Name === "email")?.Value
      if (email && !isAdminEmail(email)) {
        users.push({
          email,
          createdAt: user.UserCreateDate?.toISOString() ?? "",
          status: user.UserStatus ?? "UNKNOWN",
        })
      }
    }

    paginationToken = result.PaginationToken
  } while (paginationToken)

  return NextResponse.json({ users })
}
