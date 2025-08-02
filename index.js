import { encode } from "node:querystring";
import { fromIni } from "@aws-sdk/credential-provider-ini";
import open from "open";
import { parseArgs } from "node:util";

const main = async () => {
  const { positionals: [profile] } = parseArgs({
    strict: true,
    allowPositionals: true,
    args: process.argv.slice(2)
  })

  if (!profile) {
    throw new Error('Missing profile argument. Usage: swain-aws-console <profile>')
  }

  const identity = await fromIni({ profile })();

  const response = await fetch(
    `https://signin.aws.amazon.com/federation?${encode({
      Action: "getSigninToken",
      DurationSeconds: 43200,
      Session: JSON.stringify({
        sessionId: identity.accessKeyId,
        sessionKey: identity.secretAccessKey,
        sessionToken: identity.sessionToken,
      }),
    })}`,
  ).then((res) => res.json());

  const loginUrl = `https://signin.aws.amazon.com/federation?${encode(
    {
      Action: "login",
      Destination: "https://us-east-1.console.aws.amazon.com/",
      SigninToken: response.SigninToken,
      Issuer: "https://example.com",
    },
  )}`;

  await open(loginUrl, { wait: false });
};

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
