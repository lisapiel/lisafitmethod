import { confirmSignIn, type SignInOutput } from "aws-amplify/auth"
import { TOTP_ISSUER } from "@/lib/totp"

export type TotpSetup = { secret: string; uri: string }

// Only reached if an account ever has more than one second step (say SMS as
// well as an app). This site only uses the authenticator app, so pick it.
export async function chooseTotpIfAsked(result: SignInOutput): Promise<SignInOutput> {
  const step = result.nextStep
  if (step.signInStep !== "CONTINUE_SIGN_IN_WITH_MFA_SELECTION") return result
  if (!step.allowedMFATypes?.includes("TOTP")) return result
  return confirmSignIn({ challengeResponse: "TOTP" })
}

export function totpSetupFrom(result: SignInOutput, account: string): TotpSetup | null {
  const step = result.nextStep
  if (step.signInStep !== "CONTINUE_SIGN_IN_WITH_TOTP_SETUP") return null
  return {
    secret: step.totpSetupDetails.sharedSecret,
    uri: step.totpSetupDetails.getSetupUri(TOTP_ISSUER, account).toString(),
  }
}
