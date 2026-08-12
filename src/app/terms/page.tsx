/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from "next"
import Link from "next/link"
import { CONTACT_EMAIL } from "@/lib/contact"

export const metadata: Metadata = {
  title: "Terms of Use | Lisa Fit Method",
  description: "Terms and conditions governing use of lisafitmethod.com and purchase of digital products and services from Lisa Fit Method.",
  robots: { index: true, follow: true },
}

const LAST_UPDATED = "August 12, 2026"

export default function TermsPage() {
  return (
    <main style={{ background: "#faf8f5", color: "#1a1a1a", fontFamily: "var(--font-dm-sans), sans-serif" }}>
      <style>{`
        .legal-body h2 { font-family: var(--font-playfair), serif; font-size: 1.4rem; font-weight: 700; color: #1a1a1a; margin: 2.5rem 0 1rem; }
        .legal-body h3 { font-size: 1rem; font-weight: 600; color: #1a1a1a; margin: 1.75rem 0 0.5rem; }
        .legal-body h4 { font-size: 0.95rem; font-weight: 600; color: #1a1a1a; margin: 1.25rem 0 0.35rem; font-style: italic; }
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

          <h2>3. Digital Products</h2>

          <h3>Products and delivery</h3>
          <p>Lisa Fit Method offers several digital products, including Training Foundations, Nutrition Foundations, the Complete Foundations Bundle, the Progress Tracker, and other digital products offered from time to time. Each is a digital product delivered via the Site. Upon successful payment, access is granted to the relevant content or tool through your member account.</p>

          <h3>License</h3>
          <p>Your purchase grants you a personal, non-exclusive, non-transferable license to access and use the purchased content or tool for your own personal, non-commercial use. You may not:</p>
          <ul>
            <li>Share, resell, sublicense, or otherwise distribute content to any third party.</li>
            <li>Screenshot, record, download, or copy course videos, materials, or programs for distribution.</li>
            <li>Use purchased content to create competing products or services.</li>
            <li>Share your login credentials with others.</li>
          </ul>

          <h3>Refund policy</h3>
          <p>Because our digital products grant immediate access upon purchase, all sales are final. We do not offer refunds except in the following limited circumstances:</p>
          <ul>
            <li><strong>Duplicate or incorrect charges.</strong> If you were charged more than once for the same product, or if an incorrect amount was charged, contact us promptly and we will correct it.</li>
            <li><strong>Technical access failure.</strong> If a verified Lisa Fit Method technical issue prevents you from accessing a product you purchased, and we are unable to reasonably resolve it, we will issue a refund for that product.</li>
            <li><strong>Required by applicable law.</strong> Where a refund is required by law, we will provide one.</li>
          </ul>
          <p>If you have difficulty accessing a product, please contact us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> before requesting a refund so we have the opportunity to resolve the issue.</p>

          <h3 id="access-policy">Access policy</h3>
          <p>When you purchase a digital product, you receive ongoing access to that product for as long as Lisa Fit Method continues to operate the platform. This is not a subscription; there are no recurring charges for one-time digital product purchases. Access is not guaranteed in perpetuity and is contingent on the platform remaining active.</p>
          <p>If the platform is ever discontinued, Lisa Fit Method will provide reasonable advance notice where practicable. Where technically feasible, users may be given the opportunity to export eligible user-generated data and/or access materials that Lisa Fit Method expressly makes available for download before access ends.</p>
          <p>Your purchase grants a personal, non-exclusive, non-transferable license to access the content for your own use. This license is not assignable and cannot be shared, gifted, or resold.</p>

          <h2 id="risk">4. Health Disclaimer, Assumption of Risk, and Results</h2>
          <p><strong>Important: Please read this section carefully. By using this Site, purchasing or accessing any fitness or nutrition product, or participating in 1:1 coaching, you acknowledge and agree to the terms below.</strong></p>

          <h3>Health and medical disclaimer</h3>
          <p>The information, programs, coaching, and content provided by Lisa Fit Method are for informational, educational, and general fitness purposes only and are not a substitute for professional medical advice, diagnosis, treatment, physical therapy, or medical nutrition therapy.</p>
          <p>Lisa McPherson is a certified personal trainer, not a physician, physical therapist, registered dietitian nutritionist, or other licensed healthcare provider. Nothing provided through the Site, digital products, communications, or 1:1 coaching constitutes medical advice, diagnosis, or treatment.</p>
          <p>You are responsible for determining whether you are physically capable of participating safely in any exercise program or activity. You should consult an appropriate qualified healthcare provider before beginning or materially changing an exercise or nutrition program if you have a known medical condition, injury, physical limitation, are pregnant, have been advised to restrict physical activity, or are otherwise uncertain whether an activity is appropriate for you.</p>
          <p>If you participate in 1:1 coaching, you agree to disclose known injuries, medical conditions, physical limitations, pregnancy, or other circumstances that may reasonably affect your ability to exercise safely or require modification of your program. You also agree to notify Lisa Fit Method if relevant health circumstances, injuries, symptoms, or medical restrictions change during your coaching engagement.</p>
          <p>Lisa Fit Method does not independently verify your medical history or determine medical clearance. You remain responsible for following the advice and restrictions provided by your physician or other qualified healthcare provider.</p>
          <p>Nutrition information and coaching provided by Lisa Fit Method are general fitness and nutrition education and are not individualized medical nutrition therapy. If you have a medical condition, food allergy, medication concern, pregnancy-related nutritional need, eating disorder, or another circumstance requiring clinical nutrition care, you should seek guidance from an appropriately qualified healthcare professional.</p>

          <h3>Exercise safety and remote coaching</h3>
          <p>Exercise and physical training involve inherent risks. These risks may include muscle strains, sprains, falls, equipment-related injuries, aggravation of existing conditions, cardiovascular events, other physical injury or illness, and, in rare circumstances, serious injury or death.</p>
          <p>You understand that digital programs and online coaching are provided remotely. Lisa Fit Method cannot continuously observe or physically supervise you while you exercise and cannot provide physical spotting or emergency assistance. Lisa Fit Method cannot independently inspect your workout environment, floor surface, exercise equipment, machines, benches, weights, resistance devices, or other equipment for safety or proper maintenance.</p>
          <p>Video or form feedback, where provided, is necessarily limited by factors such as camera angle, video quality, visibility, and the information made available to Lisa Fit Method and is not equivalent to continuous in-person supervision.</p>
          <p>You are responsible for:</p>
          <ul>
            <li>exercising in a reasonably safe environment;</li>
            <li>using equipment that you reasonably believe is safe, properly maintained, and appropriate for the activity;</li>
            <li>learning and following appropriate equipment instructions;</li>
            <li>choosing weights, resistance, repetitions, ranges of motion, and exercise variations that you can perform safely and with control;</li>
            <li>following reasonable exercise instructions, progressions, regressions, and modifications provided to you;</li>
            <li>not attempting an exercise, load, progression, or movement that you believe you cannot perform safely;</li>
            <li>informing Lisa Fit Method of relevant injuries, limitations, symptoms, or changes that may affect your training; and</li>
            <li>stopping exercise rather than continuing through unusual or concerning symptoms.</li>
          </ul>
          <p>You should stop exercising and seek appropriate medical attention when warranted if you experience symptoms such as chest pain, fainting or loss of consciousness, severe or unusual shortness of breath, significant dizziness, sudden severe pain, or another symptom that reasonably causes concern for your safety.</p>

          <h3>Assumption of risk and liability release</h3>
          <p>Exercise and physical training involve inherent and unavoidable risks, including the risk of physical injury, illness, aggravation of an existing condition, property damage, and, in rare circumstances, death.</p>
          <p>By participating in any exercise program, using any fitness-related product or content, or participating in coaching provided by Lisa Fit Method, you knowingly and voluntarily assume the inherent risks associated with physical activity and fitness training.</p>
          <p>You acknowledge that your participation is voluntary and that you are responsible for monitoring your own physical condition, exercising within your capabilities, and making reasonable decisions concerning your health and safety.</p>
          <p>To the fullest extent permitted by applicable law, you release, waive, and discharge Lisa Fit Method and Lisa McPherson, together with their respective owners, employees, independent contractors, agents, representatives, successors, and assigns, from claims, demands, actions, or causes of action, whether known or unknown, arising from or relating to physical injury, illness, property damage, loss, or other harm sustained as a direct or indirect result of participating in a program, following fitness content, or using coaching or other fitness services provided through Lisa Fit Method.</p>
          <p>This release is expressly intended to include claims arising from the ordinary negligence of Lisa Fit Method, Lisa McPherson, or the other released parties, to the fullest extent such claims may lawfully be released or waived.</p>
          <p>Nothing in these Terms is intended to waive or limit any right, claim, or liability that cannot legally be waived or limited under applicable law.</p>

          <h3>Results disclaimer</h3>
          <p>Fitness and nutrition results vary significantly from person to person and depend on many factors, including starting condition, age, genetics, medical history, nutrition, sleep, lifestyle, consistency, effort, program adherence, and other individual circumstances.</p>
          <p>Any results, testimonials, examples, transformations, or experiences presented by Lisa Fit Method reflect individual experiences and do not constitute a representation or guarantee that another person will achieve the same or similar outcome.</p>
          <p>Lisa Fit Method makes no representation, warranty, or guarantee, express or implied, that you will achieve any particular fitness, health, body-composition, performance, strength, weight-loss, muscle-gain, or other result.</p>
          <p>Individual results will vary.</p>

          <h2>5. Intellectual Property</h2>
          <p>All content on this Site (including text, images, video, graphics, logos, program design, and code) is the property of Lisa Fit Method or its content suppliers and is protected by United States and international copyright laws. See our <Link href="/licensing">Licensing & Copyright Policy</Link> for details.</p>

          <h2 id="coaching">6. Coaching Services</h2>

          <h3>Application and acceptance</h3>
          <p>Submission of a coaching application does not guarantee acceptance. Lisa Fit Method reviews coaching applications and reserves the right to accept or decline any application at its sole discretion. No charge is made for submitting an application.</p>

          <h3>Enrollment and tier disclosure</h3>
          <p>If your application is accepted, you will receive confirmation by email. Before proceeding to payment, you will be presented with the specific coaching tier, monthly price, commitment terms, and cancellation terms that apply to your enrollment. Payment is not collected until you have reviewed and confirmed these terms. By proceeding to payment, you agree to those terms in addition to the general Terms of Use and the Assumption of Risk and Liability Release in Section 4.</p>

          <h3>Billing, commitment, and cancellation</h3>

          <h4>Month-to-month ($497/month)</h4>
          <p>Coaching is billed monthly with no minimum commitment. You may request cancellation at any time by emailing <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. Cancellations are effective from the date the request is received. If your request is received before your next scheduled billing charge is processed, no further charge will be made. Coaching continues through the end of the already-paid billing period. If a billing charge is processed after we have received a valid cancellation request that preceded the billing date, that charge will be treated as an incorrect charge and refunded.</p>

          <h4>3-month commitment ($397/month)</h4>
          <p>Coaching is billed monthly at $397 per month. You commit to the first three monthly payments. You may submit a cancellation request at any time, including during the initial commitment period, by emailing <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. A cancellation request received during the first three months schedules the coaching to end after the three-month commitment is fulfilled; it does not eliminate the remaining committed payments. Throughout any period for which you have paid, you will continue to receive coaching and retain access to your coaching portal. After the initial three months, billing continues month-to-month at $397 per month and the same cancellation process as above applies.</p>

          <h3>Coaching refund policy</h3>
          <p>Coaching payments already made are generally non-refundable. Exceptions include duplicate or incorrect charges and refunds required by applicable law. Lisa Fit Method may, at its discretion, provide a partial or full refund where it determines that a refund is appropriate.</p>

          <h3>Failed payments</h3>
          <p>If a coaching payment cannot be processed, you will receive a notification with instructions for updating your payment method. Our payment processor may automatically retry an unsuccessful payment. If payment cannot be collected after retries, coaching access may be suspended or terminated. You remain responsible for amounts owed for periods during which you received coaching services.</p>

          <h3>Termination by Lisa Fit Method</h3>
          <p>Lisa Fit Method may terminate a coaching engagement, without refund of amounts already paid, in the event of: nonpayment or repeated payment failures; harassment or abusive behavior toward Lisa McPherson or any Lisa Fit Method representative; unauthorized sharing or misuse of coaching materials or content; material violation of these Terms of Use; or conduct that makes continuing the coaching relationship unreasonable or unsafe.</p>
          <p>If Lisa Fit Method ends a coaching engagement for a reason unrelated to any breach by the client, future billing will cease and a pro-rata refund will be provided for any portion of the current paid period during which coaching services will not be delivered.</p>

          <h3>Complete Foundations Bundle coaching credit</h3>
          <p>Purchasers of the Complete Foundations Bundle may apply a $137 coaching credit toward their first coaching payment, subject to the following:</p>
          <ul>
            <li>To claim the credit, your coaching application must be submitted within 90 days of your bundle purchase date. You are not required to begin coaching within those 90 days; only the application must be submitted within that window. Holding this credit does not guarantee acceptance into 1:1 coaching.</li>
            <li>If your application is accepted, the $137 credit is applied toward your first monthly coaching payment.</li>
            <li>The credit has no cash value and is non-transferable.</li>
            <li>The credit may not be combined with another promotional coaching credit or discount unless Lisa Fit Method expressly permits it.</li>
          </ul>

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
          <p>Certain features of this Site (including workout tracking functionality available to course members and coaching clients) allow you to input and store personal fitness data such as exercise logs, weights, sets, reps, and progress notes ("User Data").</p>
          <ul>
            <li><strong>Ownership:</strong> You retain ownership of your User Data. By submitting it, you grant us a limited license to store and process it to provide the features of this Site.</li>
            <li><strong>Storage and retention:</strong> User Data is retained for as long as your account is active. Upon account deletion, your User Data will be removed within 30 days.</li>
            <li><strong>Data use:</strong> Your workout and progress data may be processed to provide platform features including tracking, progress calculations, and related tools. If you are an active 1:1 coaching client, relevant workout and progress data may be accessed and reviewed by authorized Lisa Fit Method personnel as part of providing your coaching services. Lisa Fit Method does not sell your workout data or share it with third parties for their own advertising purposes. Authorized service providers may process data where necessary to operate the platform, consistent with our <Link href="/privacy">Privacy Policy</Link>.</li>
            <li><strong>Accuracy:</strong> You are solely responsible for the accuracy of data you enter. We are not liable for errors, omissions, or data loss in the tracking feature.</li>
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
