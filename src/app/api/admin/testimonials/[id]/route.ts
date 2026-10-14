import { NextRequest, NextResponse } from "next/server"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, GetCommand, PutCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb"
import { verifyAdminRequest } from "@/lib/adminAuth"
import type { TestimonialRecord, TestimonialMetric } from "../route"

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

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { id } = await params
  const db = makeDb()
  const result = await db.send(
    new GetCommand({ TableName: TABLE, Key: { userId: `testimonial_${id}` } })
  )
  if (!result.Item) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ testimonial: result.Item })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { id } = await params
  const db = makeDb()

  const existing = await db.send(
    new GetCommand({ TableName: TABLE, Key: { userId: `testimonial_${id}` } })
  )
  if (!existing.Item) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = await req.json() as Partial<TestimonialRecord>
  const now = new Date().toISOString()

  const updated: TestimonialRecord = {
    id,
    clientName: body.clientName?.trim() ?? (existing.Item.clientName as string) ?? "",
    clientDescription: body.clientDescription?.trim() ?? (existing.Item.clientDescription as string) ?? "",
    type: body.type ?? (existing.Item.type as "transformation" | "experience") ?? "experience",
    headline: body.headline?.trim() ?? (existing.Item.headline as string) ?? "",
    writtenTestimonial: body.writtenTestimonial?.trim() ?? (existing.Item.writtenTestimonial as string) ?? "",
    featuredQuote: body.featuredQuote?.trim() ?? (existing.Item.featuredQuote as string) ?? "",
    metrics: body.metrics ?? (existing.Item.metrics as TestimonialMetric[]) ?? [],
    photoSlotBefore: body.photoSlotBefore ?? (existing.Item.photoSlotBefore as string) ?? "",
    photoSlotProgress: body.photoSlotProgress ?? (existing.Item.photoSlotProgress as string) ?? "",
    photoSlotPortrait: body.photoSlotPortrait ?? (existing.Item.photoSlotPortrait as string) ?? "",
    videoSlot: body.videoSlot ?? (existing.Item.videoSlot as string) ?? "",
    displayOrder: body.displayOrder ?? (existing.Item.displayOrder as number) ?? 0,
    status: body.status ?? (existing.Item.status as "draft" | "published") ?? "draft",
    createdAt: (existing.Item.createdAt as string) ?? now,
    updatedAt: now,
  }

  await db.send(
    new PutCommand({
      TableName: TABLE,
      Item: { userId: `testimonial_${id}`, ...updated },
    })
  )
  return NextResponse.json({ testimonial: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { id } = await params
  const db = makeDb()
  await db.send(
    new DeleteCommand({ TableName: TABLE, Key: { userId: `testimonial_${id}` } })
  )
  return NextResponse.json({ ok: true })
}
