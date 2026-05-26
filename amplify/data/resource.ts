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
      stripePaymentIntentId: a.string().required(),
      purchasedAt: a.datetime().required(),
    })
    .authorization((allow) => [allow.authenticated()]),
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
