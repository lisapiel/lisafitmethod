/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Terms of Use — Lisa Fit Method",
  description: "Terms and conditions governing use of lisafitmethod.com and purchase of Training Foundations.",
  robots: { index: true, follow: true },
}

const LAST_UPDATED = "May 22, 2026"
const CONTACT_EMAIL = "lisafitmethod.course@gmail.com"

export default function TermsPage() {
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
            Terms of Use
          </h1>
          <p style={{ fontSize: 14, color: "rgba(245,242,238,0.4)" }}>Last updated: {LAST_UPDATED}</p>
        </div>
      </section>

      <section style={{ padding: "60px 80px 100px" }} className="legal-body-wrap">
        <div className="legal-body" style={{ maxWidth: 720, margin: "0 auto" }}>

          <p>Please read these Terms of Use carefully before using lisafitmethod.com (the "Site") or purchasing any products or services offered by Lisa Fit Method ("we," "us," or "our"). By accessing or using the Site, you agree to be bound by these Terms.</p>

          <h2>1. Acceptance of Terms</h2>
          <p>By accessing this Site, creating an account, or purchasing any product, you represent that you are at least 18 years of age and agree to comply with these Terms. If you do not agree, you may not use the Site.</p>

          <h2>2. Use of the Site</h2>
          <p>You agree to use this Site only for lawful purposes and in a manner that does not infringe the rights of others. You may not:</p>
          <ul>
            <li>Copy, reproduce, distribute, or create derivative works from Site content without our written permission.</li>
            <li>Use automated tools (bots, scrapers) to access or collect data from the Site.</li>
            <li>Attempt to gain unauthorized access to any part of the Site or its infrastructure.</li>
            <li>Impersonate Lisa McPherson, Lisa Fit Method, or any other person or entity.</li>
            <li>Use the Site to send unsolicited communications or spam.</li>
          </ul>

          <h2>3. Course Purchase and Access</h2>

          <h3>Digital product delivery</h3>
          <p>Training Foundations is a digital course delivered via the Site. Upon successful payment, you will receive access credentials by email to access course materials through your member account at lisafitmethod.com/training-foundations.</p>

          <h3>License to course content</h3>
          <p>Your purchase grants you a personal, non-exclusive, non-transferable license to access and use the course content for your own personal, non-commercial use. You may not:</p>
          <ul>
            <li>Share, resell, sublicense, or otherwise distribute course content to any third party.</li>
            <li>Screenshot, record, download, or copy course videos, materials, or programs for distribution.</li>
            <li>Use course content to create competing products or services.</li>
            <li>Share your login credentials with others.</li>
          </ul>

          <h3>No refund policy</h3>
          <p>Because Training Foundations is a digital product with immediate access upon purchase, all sales are final. We do not offer refunds. If you experience a technical issue preventing access to course content, contact us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and we will work to resolve it promptly.</p>

          <h3>Access duration</h3>
          <p>Your course access is ongoing for as long as we operate the platform. We will provide reasonable advance notice if we discontinue a product or service.</p>

          <h2>4. Health and Fitness Disclaimer</h2>
          <p><strong>Important: Please read this section carefully.</strong></p>
          <p>The information and programs provided on this Site, including Training Foundations and all blog content, are for informational and educational purposes only. They are not a substitute for professional medical advice, diagnosis, or treatment.</p>
          <ul>
            <li>Consult your physician or a qualified healthcare provider before starting any new exercise program, particularly if you have a medical condition, injury, or are pregnant.</li>
            <li>Exercise involves inherent risks. You assume full responsibility for any injury, loss, or damage that may result from your use of our programs.</li>
            <li>Results vary based on individual effort, genetics, experience, and other factors. We make no guarantees regarding specific fitness outcomes.</li>
            <li>Lisa McPherson is a certified personal trainer, not a physician, physical therapist, or registered dietitian. Nothing on this Site constitutes medical advice.</li>
          </ul>

          <h2>5. Intellectual Property</h2>
          <p>All content on this Site — including text, images, video, graphics, logos, program design, and code — is the property of Lisa Fit Method or its content suppliers and is protected by United States and international copyright laws. See our <Link href="/licensing">Licensing & Copyright Policy</Link> for details.</p>

          <h2>6. Coaching Services</h2>
          <p>Coaching services offered through this Site are subject to a separate coaching agreement provided upon acceptance of a coaching application. Submission of a coaching inquiry does not guarantee acceptance. Lisa McPherson reserves the right to accept or decline any coaching application at her sole discretion.</p>

          <h2>7. Third-Party Links and Services</h2>
          <p>This Site may contain links to third-party websites or services. We are not responsible for the content, privacy practices, or terms of any third-party site. Links do not constitute endorsement.</p>

          <h2>8. Disclaimer of Warranties</h2>
          <p>The Site and its content are provided "as is" without warranties of any kind, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement. We do not warrant that the Site will be error-free, uninterrupted, or free of viruses or other harmful components.</p>

          <h2>9. Limitation of Liability</h2>
          <p>To the maximum extent permitted by law, Lisa Fit Method shall not be liable for any indirect, incidental, special, consequential, or punitive damages — including loss of profits, data, or goodwill — arising from your use of (or inability to use) the Site or its content, even if we have been advised of the possibility of such damages. Our total liability to you for any claim shall not exceed the amount you paid for the relevant product or service.</p>

          <h2>10. Indemnification</h2>
          <p>You agree to indemnify and hold harmless Lisa Fit Method, its owner, and affiliates from any claims, losses, liabilities, damages, and expenses (including legal fees) arising from your violation of these Terms or your use of the Site.</p>

          <h2>11. Governing Law</h2>
          <p>These Terms are governed by the laws of the United States and the state where Lisa Fit Method is principally located, without regard to conflict of law principles. Any disputes shall be resolved in the appropriate courts of that jurisdiction.</p>

          <h2>12. Changes to These Terms</h2>
          <p>We may update these Terms at any time. Continued use of the Site after changes constitutes acceptance. We will post any material changes on this page with an updated date.</p>

          <h2>13. Contact</h2>
          <p>
            Lisa Fit Method<br />
            Email: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a><br />
            Website: <a href="https://lisafitmethod.com">lisafitmethod.com</a>
          </p>

          <div style={{ marginTop: "3rem", paddingTop: "2rem", borderTop: "1px solid rgba(0,0,0,0.08)", display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
            <Link href="/privacy" style={{ fontSize: 13, color: "#a8895e" }}>Privacy Policy</Link>
            <Link href="/licensing" style={{ fontSize: 13, color: "#a8895e" }}>Licensing & Copyright</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
