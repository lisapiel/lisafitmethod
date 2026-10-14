import { NextRequest, NextResponse } from "next/server"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, ScanCommand, PutCommand } from "@aws-sdk/lib-dynamodb"
import { verifyAdminRequest } from "@/lib/adminAuth"
import type { TestimonialRecord } from "@/app/api/admin/testimonials/route"

export const dynamic = "force-dynamic"

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

const GINO_ID = "gino"
const GABRIELA_ID = "gabriela"

const GINO: TestimonialRecord = {
  id: GINO_ID,
  clientName: "Gino",
  clientDescription: "Online Coaching Client",
  type: "transformation",
  headline: "From random workouts to a routine that sticks.",
  // Verbatim excerpt from Gino's message — the portion that avoids the unconfirmed timeframe.
  // The featuredQuote is his exact words.
  writtenTestimonial:
    "I'm at ~210, down 30 pounds, waist is a 34 (pushing 33), and I'm five days into Phase III training almost every day. I'm logging every meal, hitting 150g+ protein most days, and my recovery and cardio are way better than when we started. My back squats went from 90 lbs to 225 lbs.",
  featuredQuote:
    "Biggest change honestly is that it's a routine now, not a grind. The structure you built is what made it stick.",
  metrics: [
    { value: "~30 lb", label: "lost" },
    { value: "4 inches", label: "off waist" },
    { value: "90 → 225 lb", label: "back squat" },
  ],
  photoSlotBefore: "testimonial_gino_before",
  photoSlotProgress: "testimonial_gino_progress",
  photoSlotPortrait: "",
  videoSlot: "testimonial_gino",
  displayOrder: 1,
  status: "draft",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

const GABRIELA: TestimonialRecord = {
  id: GABRIELA_ID,
  clientName: "Gabriela",
  clientDescription: "Training Client",
  type: "experience",
  headline: "",
  // Written message (verbatim): "I especially love how you demo the movements and can track everything."
  // Voice message excerpt (lightly cleaned of transcription filler, meaning preserved verbatim):
  writtenTestimonial:
    "I especially love how you demo the movements and can track everything. I just quit CrossFit for good so I'm going to be using it a whole lot more.",
  // Verbatim excerpt from her voice message, cleaned of transcription artifacts only:
  featuredQuote:
    "I really love the workout. It's kicking my butt and I've been sore all week. I'm learning a lot of these machines — and it's so cool to do this knowing that you created it. It just makes me that much more motivated and excited. This is exactly what I needed.",
  metrics: [],
  photoSlotBefore: "",
  photoSlotProgress: "",
  photoSlotPortrait: "testimonial_gaby_portrait",
  videoSlot: "",
  displayOrder: 2,
  status: "draft",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

export async function POST(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const db = makeDb()

  // Check if any testimonials already exist
  const existing = await db.send(
    new ScanCommand({
      TableName: TABLE,
      FilterExpression: "begins_with(userId, :prefix)",
      ExpressionAttributeValues: { ":prefix": "testimonial_" },
      Select: "COUNT",
    })
  )

  if ((existing.Count ?? 0) > 0) {
    return NextResponse.json({ seeded: false, message: "Testimonials already exist — no changes made." })
  }

  // Create both records
  await db.send(new PutCommand({ TableName: TABLE, Item: { userId: `testimonial_${GINO_ID}`, ...GINO } }))
  await db.send(new PutCommand({ TableName: TABLE, Item: { userId: `testimonial_${GABRIELA_ID}`, ...GABRIELA } }))

  return NextResponse.json({ seeded: true, created: [GINO_ID, GABRIELA_ID] }, { status: 201 })
}
