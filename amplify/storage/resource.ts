import { defineStorage } from "@aws-amplify/backend"

export const storage = defineStorage({
  name: "lisafitmediastore",
  access: (allow) => ({
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
