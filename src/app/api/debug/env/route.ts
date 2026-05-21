import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  return NextResponse.json({
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? `set (${process.env.STRIPE_SECRET_KEY.slice(0, 7)}...)` : "MISSING",
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ? "set" : "MISSING",
    COGNITO_USER_POOL_ID: process.env.COGNITO_USER_POOL_ID ? "set" : "MISSING",
    COGNITO_AWS_ACCESS_KEY_ID: process.env.COGNITO_AWS_ACCESS_KEY_ID ? "set" : "MISSING",
    NODE_ENV: process.env.NODE_ENV,
  })
}
