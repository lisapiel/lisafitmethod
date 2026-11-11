# Client media offboarding (manual)

When a client leaves coaching, Lisa offers to delete their private coaching media. This is manual and on request only. There are no automatic deletion or expiry rules, by design (decision of 2026-11-11; revisit when form-review storage approaches about 25 GB).

## What can be deleted

All in the media bucket `amplify-lisafitmethod-lis-lisafitmediastorebucket2-kgef6soixdov` (us-east-2), in folders named after the client's Cognito user ID (the "sub"):

| Media | Folder |
|---|---|
| Form-review videos | `media/coaching-form-reviews/<sub>/` |
| Progress photos (once that feature ships) | `media/coaching-progress-photos/<sub>/` |
| Meal photos sent in messages (offer if relevant) | `media/nutrition-messages/<sub>/` |

Records of payments, Terms acceptance and invoices are not part of this. The privacy policy (section 4) keeps purchase records for 7 years, and deletion requests are "subject to legal retention requirements".

## Steps

1. **Offer it.** When a client leaves, Lisa can say, in her own words, that they're welcome to ask her to delete their progress photos and form-review videos.
2. **Get the request in writing.** Ask the client to confirm through private messages or email, so there's a record.
3. **Find the client's sub.** Look up their login in the production Cognito user pool (`us-east-2_ZEtKHys8f`): Users, then the client's email, then the `sub` attribute.
4. **Check before deleting.** List the folder and confirm it holds only that client's files.
5. **Delete every version.** The bucket has versioning turned on, so an ordinary delete only hides a file and the older copy stays. Delete every version and delete marker under the folder. This is an AWS write, so it needs Lisa's explicit approval each time.
6. **Confirm and record.** Check the folder now lists no versions. Reply to the client confirming the deletion and note the date.

## Not covered here

- The client's check-in answers, workout logs and messages in the database. Delete those only on a specific request and as a separate, approved step.
- Their login. Deleting it is a separate decision, and the production pool has deletion protection on.
