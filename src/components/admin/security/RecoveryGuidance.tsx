import { bodyStyle, cardStyle, headingStyle } from "./styles"

export function RecoveryGuidance() {
  return (
    <section style={cardStyle} aria-labelledby="mfa-recovery-heading">
      <h2 id="mfa-recovery-heading" style={headingStyle}>Keep a way back in</h2>
      <ul style={{ ...bodyStyle, paddingLeft: "1.2rem" }}>
        <li>Set up two-factor on both admin accounts, lisa.p.mcpherson@gmail.com and contact@lisafitmethod.com, and use a different phone or device for each one. Then losing one device never locks you out of the admin area.</li>
        <li>If you lose the device for one account, sign in with the other admin account and carry on as normal.</li>
        <li>If you can&apos;t get into either account, the two-factor setting for an account can be reset in AWS. The exact steps are in docs/admin-mfa-recovery.md in the website code.</li>
        <li>Moving to a new phone? Turn two-factor off below while you still have the old phone, then set it up again on the new one.</li>
      </ul>
    </section>
  )
}
