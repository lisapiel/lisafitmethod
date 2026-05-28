import { type ClientSchema, a, defineData } from "@aws-amplify/backend"

const schema = a.schema({
  Lead: a
    .model({
      email: a.string().required(),
      source: a.string(),
    })
    .authorization((allow) => [
      allow.publicApiKey().to(["create"]),
      allow.authenticated().to(["read", "delete"]),
    ]),
  ContactSubmission: a
    .model({
      name: a.string().required(),
      email: a.string().required(),
      message: a.string().required(),
      type: a.enum(["coaching", "contact"]),
      status: a.string(),
      notes: a.string(),
    })
    .authorization((allow) => [
      allow.publicApiKey().to(["create"]),
      allow.authenticated().to(["read", "update", "delete"]),
    ]),
  Purchase: a
    .model({
      email: a.string().required(),
      name: a.string(),
      stripePaymentIntentId: a.string().required(),
      purchasedAt: a.datetime().required(),
      promoCode: a.string(),
      amountPaidCents: a.integer(),
      discountPct: a.integer(),
      includesTracker: a.boolean(),
      source: a.string(),
    })
    .authorization((allow) => [
      allow.publicApiKey().to(["create"]),
      allow.authenticated().to(["read", "update", "delete"]),
    ]),
  MediaAsset: a
    .model({
      type: a.enum(["VIDEO", "PHOTO"]),
      title: a.string().required(),
      s3Key: a.string().required(),
      url: a.string(),
      assignedTo: a.string().required(),
      isPublished: a.boolean().required(),
      fileSize: a.integer(),
      mimeType: a.string(),
    })
    .authorization((allow) => [
      allow.publicApiKey().to(["read"]),
      allow.guest().to(["read"]),
      allow.authenticated().to(["create", "read", "update", "delete"]),
    ]),

  // ── Masterclass ────────────────────────────────────────────────────────────

  ExerciseVideo: a
    .model({
      slug: a.string().required(),
      name: a.string().required(),
      s3Key: a.string().required(),
      url: a.string().required(),
      durationSeconds: a.integer(),
      muscleGroups: a.string(),
      equipment: a.string(),
      tags: a.string(),
      isPublished: a.boolean().required(),
    })
    .authorization((allow) => [
      allow.authenticated().to(["create", "read", "update", "delete"]),
    ]),

  WorkoutBlock: a
    .model({
      title: a.string().required(),
      blockNumber: a.integer().required(),
      startDate: a.string().required(),
      days: a.string().required(),
      isPublished: a.boolean().required(),
    })
    .authorization((allow) => [
      allow.authenticated().to(["create", "read", "update", "delete"]),
    ]),

  QAndAEntry: a
    .model({
      userEmail: a.string().required(),
      question: a.string().required(),
      answer: a.string(),
      status: a.enum(["PENDING", "ANSWERED", "PUBLISHED"]),
      isPublic: a.boolean(),
      answeredAt: a.string(),
    })
    .authorization((allow) => [
      allow.publicApiKey().to(["create"]),
      allow.authenticated().to(["read", "update", "delete"]),
    ]),
})

export type Schema = ClientSchema<typeof schema>

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "identityPool",
    apiKeyAuthorizationMode: {
      expiresInDays: 365,
    },
  },
})
