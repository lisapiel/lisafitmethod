import { defineStorage } from "@aws-amplify/backend"

export const storage = defineStorage({
  name: "lisafitmediastore",
  access: (allow) => ({
    // Client-submitted nutrition photos + food-log screenshots.
    // Authenticated only — no guest read. Files under this prefix are served
    // exclusively via short-lived signed URLs (aws-amplify/storage getUrl),
    // never via the public CloudFront distribution. This rule is listed BEFORE
    // the broader "media/*" rule so it wins for this specific prefix.
    "media/nutrition-messages/*": [
      allow.authenticated.to(["read", "write", "delete"]),
    ],
    // Client-submitted form-review videos attached to a weekly check-in.
    // Same privacy model as nutrition-messages: authenticated only, served
    // via signed URLs, never through the public CDN. The live S3 bucket
    // policy (three explicit allows for blog/photos/videos) already denies
    // guest read on any other media/* prefix, so this prefix inherits
    // private-by-default at the S3 layer.
    "media/coaching-form-reviews/*": [
      allow.authenticated.to(["read", "write", "delete"]),
    ],
    "media/videos/*": [
      allow.guest.to(["read"]),
      allow.authenticated.to(["read", "write", "delete"]),
    ],
    "media/photos/*": [
      allow.guest.to(["read"]),
      allow.authenticated.to(["read", "write", "delete"]),
    ],
    "media/*": [
      allow.guest.to(["read"]),
      allow.authenticated.to(["read", "write", "delete"]),
    ],
  }),
})
