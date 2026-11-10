import { formatTotpSecret } from "@/lib/totp"

const muted = "#888888"
const gold = "#c9a96e"

export function TotpSetupDetails({ secret, setupUri }: { secret: string; setupUri: string }) {
  return (
    <div style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: 13, lineHeight: 1.7, color: "#cfc6b6" }}>
      <ol style={{ paddingLeft: "1.2rem", margin: "0 0 1rem" }}>
        <li>Open your authenticator app (Google Authenticator, Microsoft Authenticator, 1Password or similar).</li>
        <li>Add a new account and choose to enter a setup key by hand.</li>
        <li>Use the account name Lisa Fit Method and the key below. Choose time based if the app asks.</li>
      </ol>
      <p style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: muted, margin: "0 0 0.4rem" }}>
        Setup key
      </p>
      <p
        data-testid="totp-secret"
        data-secret={secret}
        style={{
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: 16,
          letterSpacing: "0.08em",
          color: "#f0e6d3",
          background: "#0a0a0a",
          border: "1px solid #2a2a2a",
          padding: "0.75rem 1rem",
          margin: "0 0 0.75rem",
          wordBreak: "break-word",
          userSelect: "all",
        }}
      >
        {formatTotpSecret(secret)}
      </p>
      <p style={{ margin: 0 }}>
        On the phone that has your authenticator app, you can{" "}
        <a href={setupUri} data-testid="totp-setup-link" style={{ color: gold }}>
          open this link to add the account
        </a>{" "}
        instead of typing the key.
      </p>
    </div>
  )
}
