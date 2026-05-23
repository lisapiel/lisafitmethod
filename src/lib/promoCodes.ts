import { SSMClient, GetParameterCommand, PutParameterCommand } from "@aws-sdk/client-ssm"

const SSM_PARAM = "/lisafitmethod/promo-codes"

function makeSsm() {
  return new SSMClient({
    region: process.env.COGNITO_REGION ?? "us-east-2",
    credentials: {
      accessKeyId: process.env.COGNITO_AWS_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.COGNITO_AWS_SECRET_ACCESS_KEY ?? "",
    },
  })
}

export async function getPromoCodes(): Promise<Record<string, number>> {
  try {
    const res = await makeSsm().send(new GetParameterCommand({ Name: SSM_PARAM }))
    return JSON.parse(res.Parameter?.Value ?? "{}")
  } catch (e: unknown) {
    if ((e as { name?: string }).name === "ParameterNotFound") return {}
    throw e
  }
}

export async function savePromoCodes(codes: Record<string, number>): Promise<void> {
  await makeSsm().send(
    new PutParameterCommand({ Name: SSM_PARAM, Value: JSON.stringify(codes), Type: "String", Overwrite: true })
  )
}
