/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Terms of Use | Lisa Fit Method",
  description: "Terms and conditions governing use of lisafitmethod.com and purchase of Training Foundations.",
  robots: { index: true, follow: true },
}

const LAST_UPDATED = "May 23, 2026"
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

          <h3 id="access-policy">Access policy</h3>
          <p>When you purchase a course or add-on, you receive ongoing access to that product (including content, videos, and tracking tools) for as long as Lisa Fit Method continues to operate the platform. This is not a subscription; there are no recurring charges. Access is not guaranteed in perpetuity and is contingent on the platform remaining active.</p>
          <p>If the platform is ever discontinued, notice will be posted on the platform itself for a reasonable period before access ends, giving active users the opportunity to export their training data and download the materials they purchased. Notice posted on the platform is considered sufficient; individual email notification is not guaranteed.</p>
          <p>Your purchase grants a personal, non-exclusive, non-transferable license to access the content for your own use. This license is not assignable and cannot be shared, gifted, or resold.</p>

          <h2>4. Health Disclaimer, Assumption of Risk, and Results</h2>
          <p><strong>Important: Please read this section carefully. By using this Site or purchasing any product, you agree to the terms below.</strong></p>

          <h3>Health and medical disclaimer</h3>
          <p>The information, programs, and content on this Site (including Training Foundations and all blog content) are for informational and educational purposes only and are not a substitute for professional medical advice, diagnosis, or treatment. Lisa McPherson is a certified personal trainer, not a physician, physical therapist, or registered dietitian. Nothing on this Site constitutes medical advice. Consult your physician or a qualified healthcare provider before beginning any exercise program, particularly if you have a pre-existing medical condition, injury, or are pregnant.</p>

          <h3>Assumption of risk and liability release</h3>
          <p>Exercise and physical training involve inherent risks, including the risk of physical injury, illness, or death. By participating in any exercise program or following any content on this Site, <strong>you voluntarily and knowingly assume all such risks</strong> associated with physical activity and fitness training. You represent that you are physically capable of participating in the activities described and that you take full responsibility for your own health and safety.</p>
          <p>To the fullest extent permitted by applicable law, you hereby <strong>release, waive, and discharge Lisa Fit Method and Lisa McPherson</strong>, and their successors, assigns, and representatives, from any and all claims, demands, actions, or causes of action, whether known or unknown, arising from or related to any physical injury, illness, loss, or damage you may sustain as a direct or indirect result of participating in any program, following any content, or using any service offered through this Site. This release applies even if such injury or loss results from the negligence of Lisa Fit Method or Lisa McPherson, to the extent permitted by law.</p>

          <h3>Results disclaimer</h3>
          <p>Fitness results vary significantly from person to person based on many factors including starting fitness level, age, genetics, nutrition, sleep, consistency, effort, and adherence to the program. Any results, testimonials, or examples presented on this Site represent individual experiences and <strong>are not typical or guaranteed</strong>. We make no representations, warranties, or guarantees, express or implied, that you will achieve any specific fitness outcome. Individual results may vary.</p>

          <h2>5. Intellectual Property</h2>
          <p>All content on this Site (including text, images, video, graphics, logos, program design, and code) is the property of Lisa Fit Method or its content suppliers and is protected by United States and international copyright laws. See our <Link href="/licensing">Licensing & Copyright Policy</Link> for details.</p>

          <h2>6. Coaching Services</h2>
          <p>Coaching services offered through this Site are subject to a separate coaching agreement provided upon acceptance of a coaching application. Submission of a coaching inquiry does not guarantee acceptance. Lisa McPherson reserves the right to accept or decline any coaching application at her sole discretion.</p>

          <h2>7. Third-Party Links and Services</h2>
          <p>This Site may contain links to third-party websites or services. We are not responsible for the content, privacy practices, or terms of any third-party site. Links do not constitute endorsement.</p>

          <h2>8. Disclaimer of Warranties</h2>
          <p>The Site and its content are provided "as is" without warranties of any kind, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement. We do not warrant that the Site will be error-free, uninterrupted, or free of viruses or other harmful components.</p>

          <h2>9. Limitation of Liability</h2>
          <p>To the maximum extent permitted by law, Lisa Fit Method shall not be liable for any indirect, incidental, special, consequential, or punitive damages (including loss of profits, data, or goodwill) arising from your use of (or inability to use) the Site or its content, even if we have been advised of the possibility of such damages. Our total liability to you for any claim shall not exceed the amount you paid for the relevant product or service.</p>

          <h2>10. Indemnification</h2>
          <p>You agree to indemnify and hold harmless Lisa Fit Method, its owner, and affiliates from any claims, losses, liabilities, damages, and expenses (including legal fees) arising from your violation of these Terms or your use of the Site.</p>

          <h2>11. Governing Law</h2>
          <p>These Terms are governed by the laws of the State of Florida and the United States, without regard to conflict of law principles. Any court proceedings not subject to arbitration under Section 13 shall be brought exclusively in the state or federal courts located in Broward County, Florida, and you consent to the personal jurisdiction of those courts.</p>

          <h2>12. User-Generated Data</h2>
          <p>Certain features of this Site (including workout tracking functionality available to course purchasers) allow you to input and store personal fitness data such as exercise logs, weights, sets, reps, and progress notes ("User Data").</p>
          <ul>
            <li><strong>Ownership</strong>:you retain ownership of your User Data. By submitting it, you grant us a limited license to store and display it to you through the Site.</li>
            <li><strong>Storage and retention</strong>:User Data is retained for as long as your account is active. Upon account deletion, your User Data will be removed within 30 days.</li>
            <li><strong>No medical use</strong>:User Data is for personal tracking purposes only. We do not analyze, share, or sell your workout logs.</li>
            <li><strong>Accuracy</strong>:you are solely responsible for the accuracy of data you enter. We are not liable for errors, omissions, or data loss in the tracking feature.</li>
          </ul>
          <p>See our <Link href="/privacy">Privacy Policy</Link> for more information on how we handle your data.</p>

          <h2>13. Dispute Resolution and Arbitration</h2>
          <p><strong>Please read this section carefully. It affects your legal rights.</strong></p>
          <p><strong>Informal resolution first.</strong> Before filing any formal claim, you agree to contact us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and attempt to resolve the dispute informally. We will make a good-faith effort to resolve any issue within 30 days of receiving your written notice.</p>
          <p><strong>Binding arbitration.</strong> If informal resolution fails, any dispute, claim, or controversy arising out of or relating to these Terms or your use of the Site shall be resolved by binding arbitration administered by the American Arbitration Association (AAA) under its Consumer Arbitration Rules. The arbitration shall take place in Broward County, Florida, or virtually at the arbitrator's discretion. The arbitrator's decision shall be final and binding and may be entered as a judgment in any court of competent jurisdiction.</p>
          <p><strong>Class action waiver.</strong> To the fullest extent permitted by law, you waive the right to bring or participate in any class-action lawsuit or class-wide arbitration against Lisa Fit Method.</p>
          <p><strong>Exceptions.</strong> Either party may seek emergency injunctive or other equitable relief in a court of competent jurisdiction in Broward County, Florida, solely to prevent irreparable harm pending arbitration. Claims properly brought in small claims court within applicable jurisdictional limits are also exempt from this arbitration provision.</p>

          <h2>14. Changes to These Terms</h2>
          <p>We may update these Terms at any time. Continued use of the Site after changes constitutes acceptance. We will post any material changes on this page with an updated date.</p>

          <h2>15. Contact</h2>
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
