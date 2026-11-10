# Admin two-factor: setup and recovery

Two-factor sign-in for the admin area uses an authenticator app (Google Authenticator, Microsoft Authenticator, 1Password and similar). It is set up per account at **/admin/security** (the Security link in the admin menu).

## How it fits together

There are two separate switches.

1. **The Cognito user pool's MFA setting** (AWS console, Cognito, user pool, Sign-in, Multi-factor authentication). This must be **Optional** with **Authenticator apps** ticked before anyone can set up two-factor. With Optional, anyone who hasn't set it up signs in exactly as before. Clients are never asked for a code unless they set one up themselves, which the site gives them no way to do.
2. **`ADMIN_MFA_REQUIRED`** (Amplify environment variable). Off unless it is exactly `true`. When it is `true`, an admin account that hasn't set up two-factor can still sign in, but every admin page and admin API refuses it and the admin area sends it to /admin/security with the message "Turn on two-factor to use the admin area." The /admin/security page and its status API stay open so the account can set up two-factor there. Clients are not affected by this switch at all.

Leave `ADMIN_MFA_REQUIRED` unset until both admin accounts have two-factor set up and have each signed in with a code at least once.

## Setting up two-factor (each admin account)

1. Install an authenticator app on the phone for this account (Google Authenticator, Microsoft Authenticator or 1Password). Use a different phone for each admin account.
2. Sign in at lisafitmethod.com/admin/login and open **Security** in the admin menu.
3. Choose **Set up two-factor**. In the app, add an account and choose **Enter a setup key** (there is no QR code). Type the key shown, in groups of four, with time-based codes. On a phone you can tap the link instead.
4. Type the 6-digit code the app shows and choose **Turn on two-factor**. The page then says two-factor is on.
5. Choose **Sign Out**, then sign in again. After your password, the page asks for a code. Enter the current one from the app. You should land in the admin area.
6. Repeat with the other admin account on the other phone.

## Known limitation

Even with `ADMIN_MFA_REQUIRED=true`, an admin account that has not set up two-factor can still open the client-side pages that admins are let into for free (course content, the client portal for that account, /my-plan) with just a password. It cannot open the admin area or any client's records. Keep both admin accounts enrolled, and set two-factor up again straight after any reset. See TECHNICAL_DEBT.md for the planned fix.

## Before turning anything on

- Set up two-factor on **both** admin accounts, `lisa.p.mcpherson@gmail.com` and `contact@lisafitmethod.com`.
- Use a **different phone or device** for each account. If one device is lost, the other account still gets into the admin area.
- Keep this document somewhere you can reach without the admin area.

## Lost the device for one admin account

1. Sign in at /admin/login with the **other** admin account and use the admin area as normal.
2. To get the first account working again, either set up the authenticator app again on a new device after resetting it (below), or ask someone with AWS access to run the reset command for you.

## Lost access to both accounts, or need to reset one account

This clears the authenticator app from one account. The account then signs in with just its password, and can set up two-factor again at /admin/security.

You need AWS CLI access with permission to manage the user pool. Run it in Terminal:

```
aws cognito-idp admin-set-user-mfa-preference \
  --user-pool-id <pool> \
  --username <email> \
  --software-token-mfa-settings Enabled=false,PreferredMfa=false
```

- `<pool>` is the live user pool ID. It is the value of `COGNITO_USER_POOL_ID` (and `NEXT_PUBLIC_COGNITO_USER_POOL_ID`) in the Amplify console under App settings, Environment variables. The region is `us-east-2`; add `--region us-east-2` if your AWS CLI defaults to another region.
- `<email>` is the admin account's email, for example `contact@lisafitmethod.com`. The pool signs people in by email, so the email works as the username.

To check it worked:

```
aws cognito-idp admin-get-user --user-pool-id <pool> --username <email>
```

The output should no longer list `SOFTWARE_TOKEN_MFA` under `UserMFASettingList`.

If `ADMIN_MFA_REQUIRED` is `true`, that account can sign in after the reset but is sent straight to /admin/security until it sets up two-factor again. That is expected.

## Switching enforcement off quickly

1. In the Amplify console, open the app, then App settings, Environment variables.
2. Change `ADMIN_MFA_REQUIRED` to anything other than `true` (for example `false`), or delete it.
3. **Redeploy.** Amplify only hands environment variables to the website while it builds. The build writes them into the server's settings file (see `amplify.yml`), so changing the value in the console does nothing until a new build runs. Go to the main branch in Amplify Hosting and choose **Redeploy this version**, or push any commit to `main`. A build takes about 2 to 5 minutes.

Once the new build is live, every admin account gets into the admin area with or without two-factor, exactly as before this feature existed. Two-factor still applies at sign-in for accounts that have it set up, because that part is controlled by Cognito, not by this switch.

## Switching two-factor off completely

To stop Cognito asking anyone for a code at sign-in:

1. Reset each enrolled account with the command above.
2. Then, if you want, set the user pool's MFA back to Off in the Cognito console. Cognito will not let you turn it Off while it is set to Required, so go via Optional.

## Turning two-factor off for your own account

At /admin/security, choose "Turn off two-factor". It asks for your password and a current code and signs you in again with them before switching it off, so it can't be done from a session someone else left open. If `ADMIN_MFA_REQUIRED` is `true`, the account loses access to the admin area until two-factor is set up again.
