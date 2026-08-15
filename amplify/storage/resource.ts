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
