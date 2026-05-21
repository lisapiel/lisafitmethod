# Payment & Auth Setup Guide

This guide walks through every step needed to go live with payments and member login. Complete these steps in order.

---

## Step 1 — Get your Stripe API keys

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com) and log in.
2. In the left sidebar, click **Developers → API keys**.
3. Copy the **Publishable key** (starts with `pk_live_...`).
4. Click **Reveal test key** to also get the **Secret key** (starts with `sk_live_...`). Keep this private.

---

## Step 2 — Get your Cognito User Pool details

After the Amplify backend has been deployed at least once:

1. Go to the [AWS Amplify console](https://console.aws.amazon.com/amplify).
2. Click on the **lisafitmethod** app.
3. In the left sidebar click **Backend environments → Deployed resources → Auth**.
4. Note the **User Pool ID** (looks like `us-east-1_XXXXXXXXX`).
5. Note the **App client ID** (a long string with no dashes).
6. Note the **AWS Region** (e.g. `us-east-1`).

---

## Step 3 — Create an IAM user for the webhook

The payment webhook needs permission to create Cognito accounts. Create a dedicated IAM user with minimal permissions:

1. Go to [IAM in the AWS console](https://console.aws.amazon.com/iam).
2. Click **Users → Create user**. Name it `lisafitmethod-webhook`.
3. On the permissions step, choose **Attach policies directly**.
4. Click **Create policy** and paste this JSON (replace `YOUR_REGION` and `YOUR_USER_POOL_ID`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cognito-idp:AdminCreateUser",
        "cognito-idp:AdminGetUser"
      ],
      "Resource": "arn:aws:cognito-idp:YOUR_REGION:*:userpool/YOUR_USER_POOL_ID"
    }
  ]
}
```

5. Name the policy `lisafitmethod-webhook-cognito` and save it.
6. Attach this policy to your new user and finish creating the user.
7. On the user's page, click **Security credentials → Create access key**.
8. Choose **Application running outside AWS**, then copy the **Access Key ID** and **Secret Access Key**.

---

## Step 4 — Add environment variables in Amplify

1. Go to the [Amplify console](https://console.aws.amazon.com/amplify), open the **lisafitmethod** app.
2. In the left sidebar click **App settings → Environment variables**.
3. Add each variable below (click **Add variable** for each):

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Your Stripe publishable key (`pk_live_...`) |
| `STRIPE_SECRET_KEY` | Your Stripe secret key (`sk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | Set this after Step 5 (below) |
| `NEXT_PUBLIC_COGNITO_USER_POOL_ID` | Your User Pool ID from Step 2 |
| `NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID` | Your App Client ID from Step 2 |
| `COGNITO_REGION` | Your AWS region (e.g. `us-east-1`) |
| `COGNITO_USER_POOL_ID` | Same as your User Pool ID |
| `COGNITO_AWS_ACCESS_KEY_ID` | Access Key ID from Step 3 |
| `COGNITO_AWS_SECRET_ACCESS_KEY` | Secret Access Key from Step 3 |

4. Click **Save**.

---

## Step 5 — Set up the Stripe webhook

1. In the Stripe dashboard, go to **Developers → Webhooks → Add endpoint**.
2. Set the endpoint URL to: `https://lisafitmethod.com/api/stripe/webhook`
3. Under **Events to send**, select: `payment_intent.succeeded`
4. Click **Add endpoint**.
5. Click the webhook you just created, then click **Reveal** next to **Signing secret**.
6. Copy the signing secret (starts with `whsec_...`).
7. Go back to Amplify environment variables and add:

| Variable | Value |
|---|---|
| `STRIPE_WEBHOOK_SECRET` | Your webhook signing secret (`whsec_...`) |

---

## Step 6 — Trigger a new Amplify build

After adding all environment variables:

1. In the Amplify console, click **Hosting → Deployments → Trigger deployment**.
2. Wait 2–5 minutes for the build to complete.
3. Test the full flow:
   - Go to lisafitmethod.com, click **Get Instant Access**
   - Complete a test purchase using Stripe test card `4242 4242 4242 4242`
   - Check your email for the Cognito welcome message
   - Log in at `/login` with the temporary password
   - Set a new password and confirm you land on the course

---

## Environment Variables Reference

```
# Stripe (payments)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Cognito (auth - client-side, safe to expose)
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXX
NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx

# Cognito (auth - server-side only, keep private)
COGNITO_REGION=us-east-1
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXX
COGNITO_AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
COGNITO_AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## Testing with Stripe test mode

Before going live, you can test the entire flow using Stripe test mode:
- Use publishable key `pk_test_...` and secret key `sk_test_...` instead of the live keys
- Test card: `4242 4242 4242 4242` · Any future expiry · Any 3-digit CVC
- Stripe will process the payment without charging anyone
- The webhook will still fire and create a real Cognito account

Switch to live keys (`pk_live_...` / `sk_live_...`) when you're ready to take real payments.
