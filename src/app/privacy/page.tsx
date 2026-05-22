/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Privacy Policy — Lisa Fit Method",
  description: "How Lisa Fit Method collects, uses, and protects your personal information.",
  robots: { index: true, follow: true },
}

const LAST_UPDATED = "May 23, 2026"
const CONTACT_EMAIL = "lisafitmethod.course@gmail.com"

export default function PrivacyPage() {
  return (
    <main style={{ background: "#faf8f5", color: "#1a1a1a", fontFamily: "var(--font-dm-sans), sans-serif" }}>
      <style>{`
        .legal-body h2 { font-family: var(--font-playfair), serif; font-size: 1.4rem; font-weight: 700; color: #1a1a1a; margin: 2.5rem 0 1rem; }
        .legal-body h3 { font-size: 1rem; font-weight: 600; color: #1a1a1a; margin: 1.75rem 0 0.5rem; }
        .legal-body p { font-size: 15px; line-height: 1.85; color: #4a4540; margin-bottom: 1rem; }
        .legal-body ul { margin: 0 0 1rem 1.5rem; }
        .legal-body li { font-size: 15px; line-height: 1.85; color: #4a4540; margin-bottom: 0.35rem; }
        .legal-body a { color: #a8895e; }
        @media (max-width: 768px) { .legal-hero { padding: 72px 28px 48px !important; } .legal-body-wrap { padding: 48px 28px 80px !important; } }
      `}</style>

      <section style={{ background: "#0a0a0a", padding: "100px 80px 60px" }} className="legal-hero">
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: "#c8a97e", marginBottom: 20 }}>Legal</p>
          <h1 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 900, color: "#f5f2ee", lineHeight: 1.1, marginBottom: 16 }}>
            Privacy Policy
          </h1>
          <p style={{ fontSize: 14, color: "rgba(245,242,238,0.4)" }}>Last updated: {LAST_UPDATED}</p>
        </div>
      </section>

      <section style={{ padding: "60px 80px 100px" }} className="legal-body-wrap">
        <div className="legal-body" style={{ maxWidth: 720, margin: "0 auto" }}>

          <p>Lisa Fit Method ("we," "us," or "our") operates the website lisafitmethod.com. This Privacy Policy explains what information we collect, how we use it, and your rights regarding your personal data. By using our site you agree to this policy.</p>

          <h2>1. Information We Collect</h2>

          <h3>Information you provide directly</h3>
          <ul>
            <li><strong>Contact form submissions</strong> — your name, email address, and message when you fill out the contact or coaching inquiry form.</li>
            <li><strong>Account registration</strong> — your email address when you purchase a course and create a member account.</li>
            <li><strong>Payment information</strong> — your card details are collected and processed directly by Stripe. We do not store your full card number or CVV on our servers.</li>
            <li><strong>Workout tracking data</strong> — if you use the workout logging feature available to course members, we collect the fitness data you enter (exercises, sets, reps, weights, and notes). This data is used solely to display your personal progress within the Site and is never shared or sold.</li>
          </ul>

          <h3>Information collected automatically</h3>
          <ul>
            <li><strong>Analytics</strong> — we use Google Analytics 4 (GA4) to understand how visitors use our site. GA4 may collect your IP address, browser type, device type, pages visited, and session duration. This data is aggregated and anonymized where possible.</li>
            <li><strong>Cookies</strong> — our site and third-party services (Google Analytics, Stripe) use cookies and similar technologies to function and to track usage. You may disable cookies in your browser settings, though some features may not work correctly.</li>
            <li><strong>Log data</strong> — our hosting provider (AWS Amplify) may collect standard server logs including your IP address, browser, and request timestamps.</li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <ul>
            <li>To deliver and manage your course access after purchase.</li>
            <li>To respond to your contact and coaching inquiry messages.</li>
            <li>To process payments via Stripe.</li>
            <li>To analyze site traffic and improve our content and user experience via GA4.</li>
            <li>To send transactional emails related to your purchase or account (e.g., account setup, course access).</li>
            <li>To comply with legal obligations.</li>
          </ul>
          <p>We do not sell your personal information to third parties. We do not use your data for advertising profiling beyond standard GA4 analytics.</p>

          <h2>3. How We Share Your Information</h2>
          <p>We share data only with service providers necessary to operate our business:</p>
          <ul>
            <li><strong>Stripe</strong> — payment processing. Stripe's privacy policy is available at stripe.com/privacy.</li>
            <li><strong>Google Analytics</strong> — site analytics. Subject to Google's privacy policy at policies.google.com/privacy.</li>
            <li><strong>AWS (Amazon Web Services)</strong> — hosting, authentication, and data storage. Subject to AWS's privacy policy at aws.amazon.com/privacy.</li>
            <li><strong>Resend</strong> — transactional email delivery. Subject to Resend's privacy policy at resend.com/legal/privacy-policy.</li>
          </ul>

          <h2>4. Data Retention</h2>
          <p>We retain your information for as long as necessary to provide our services and comply with legal requirements. Contact form submissions are retained for up to 2 years. Purchase records are retained for 7 years for financial compliance. You may request deletion of your data at any time by contacting us.</p>

          <h2>5. Your Rights</h2>
          <p>Depending on your location, you may have the following rights regarding your personal data:</p>
          <ul>
            <li><strong>Access</strong> — request a copy of the personal data we hold about you.</li>
            <li><strong>Correction</strong> — request that inaccurate data be corrected.</li>
            <li><strong>Deletion</strong> — request that your data be deleted, subject to legal retention requirements.</li>
            <li><strong>Objection</strong> — object to certain uses of your data, including analytics.</li>
            <li><strong>Portability</strong> — request your data in a portable format.</li>
          </ul>
          <p>To exercise any of these rights, email us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. We will respond within 30 days.</p>

          <h2>6. California Privacy Rights (CCPA)</h2>
          <p>California residents have additional rights under the California Consumer Privacy Act. We do not sell personal information. California residents may request disclosure of categories of personal information collected and the purposes for which they are used. Contact us at the email below to submit a request.</p>

          <h2>7. Do Not Track</h2>
          <p>Some browsers include a "Do Not Track" (DNT) feature that signals websites not to track your activity. Our Site does not currently respond to browser Do Not Track signals, as there is no universal industry standard for doing so. You may opt out of Google Analytics tracking at any time using the <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">Google Analytics Opt-out Browser Add-on</a>.</p>

          <h2>8. Children's Privacy</h2>
          <p>Our site is not directed at children under 13. We do not knowingly collect personal information from children under 13. If you believe we have inadvertently collected such information, please contact us and we will delete it promptly.</p>

          <h2>9. International Users</h2>
          <p>Our services are based in the United States. If you are accessing our site from outside the United States, your information will be transferred to and processed in the United States. By using our site, you consent to this transfer.</p>

          <h2>10. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. We will post any changes on this page with an updated date. Continued use of our site after changes constitutes your acceptance of the updated policy.</p>

          <h2>11. Contact Us</h2>
          <p>If you have questions about this Privacy Policy or your personal data, contact us at:</p>
          <p>
            Lisa Fit Method<br />
            Email: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a><br />
            Website: <a href="https://lisafitmethod.com">lisafitmethod.com</a>
          </p>

          <div style={{ marginTop: "3rem", paddingTop: "2rem", borderTop: "1px solid rgba(0,0,0,0.08)", display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
            <Link href="/terms" style={{ fontSize: 13, color: "#a8895e" }}>Terms of Use</Link>
            <Link href="/licensing" style={{ fontSize: 13, color: "#a8895e" }}>Licensing & Copyright</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
