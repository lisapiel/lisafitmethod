import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  UsernameExistsException,
} from "@aws-sdk/client-cognito-identity-provider"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "")

const cognito = new CognitoIdentityProviderClient({
  region: process.env.COGNITO_REGION ?? "us-east-1",
  credentials: {
    accessKeyId: process.env.COGNITO_AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.COGNITO_AWS_SECRET_ACCESS_KEY ?? "",
  },
})

async function createCognitoUser(email: string) {
  await cognito.send(
    new AdminCreateUserCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID ?? "",
      Username: email,
      UserAttributes: [
        { Name: "email", Value: email },
        { Name: "email_verified", Value: "true" },
      ],
      DesiredDeliveryMediums: ["EMAIL"],
      // Cognito sends its built-in welcome email with a temporary password
    })
  )
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature") ?? ""

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET ?? ""
    )
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object as Stripe.PaymentIntent
    const email = intent.metadata?.customerEmail

    if (email) {
      try {
        await createCognitoUser(email)
      } catch (error) {
        // User already exists — they may have purchased again; that's fine
        if (!(error instanceof UsernameExistsException)) {
          console.error("Cognito user creation failed:", error)
          return NextResponse.json({ error: "Account setup failed" }, { status: 500 })
        }
      }
    }
  }

  return NextResponse.json({ received: true })
}
