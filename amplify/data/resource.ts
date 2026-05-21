import { type ClientSchema, a, defineData } from "@aws-amplify/backend"

const schema = a.schema({
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
