/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Licensing & Copyright — Lisa Fit Method",
  description: "Copyright notice and licensing terms for all images, videos, and content on lisafitmethod.com.",
  robots: { index: true, follow: true },
}

const LAST_UPDATED = "May 23, 2026"
const CONTACT_EMAIL = "lisafitmethod.course@gmail.com"

export default function LicensingPage() {
  return (
    <main style={{ background: "#faf8f5", color: "#1a1a1a", fontFamily: "var(--font-dm-sans), sans-serif" }}>
      <style>{`
        .legal-body h2 { font-family: var(--font-playfair), serif; font-size: 1.4rem; font-weight: 700; color: #1a1a1a; margin: 2.5rem 0 1rem; }
        .legal-body h3 { font-size: 1rem; font-weight: 600; color: #1a1a1a; margin: 1.75rem 0 0.5rem; }
        .legal-body p { font-size: 15px; line-height: 1.85; color: #4a4540; margin-bottom: 1rem; }
        .legal-body ul { margin: 0 0 1rem 1.5rem; }
        .legal-body li { font-size: 15px; line-height: 1.85; color: #4a4540; margin-bottom: 0.35rem; }
        .legal-body a { color: #a8895e; }
        .notice-box { background: #f0ebe3; border-left: 3px solid #c8a97e; padding: 20px 24px; margin: 1.5rem 0; }
        .notice-box p { margin-bottom: 0; font-weight: 500; color: #1a1a1a; }
        @media (max-width: 768px) { .legal-hero { padding: 72px 28px 48px !important; } .legal-body-wrap { padding: 48px 28px 80px !important; } }
      `}</style>

      <section style={{ background: "#0a0a0a", padding: "100px 80px 60px" }} className="legal-hero">
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: "#c8a97e", marginBottom: 20 }}>Legal</p>
          <h1 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 900, color: "#f5f2ee", lineHeight: 1.1, marginBottom: 16 }}>
            Licensing & Copyright
          </h1>
          <p style={{ fontSize: 14, color: "rgba(245,242,238,0.4)" }}>Last updated: {LAST_UPDATED}</p>
        </div>
      </section>

      <section style={{ padding: "60px 80px 100px" }} className="legal-body-wrap">
        <div className="legal-body" style={{ maxWidth: 720, margin: "0 auto" }}>

          <div className="notice-box">
            <p>All content on lisafitmethod.com — including but not limited to photographs, video recordings, written programs, blog articles, and course materials — is the exclusive property of Lisa McPherson / Lisa Fit Method and is protected under United States and international copyright law. Unauthorized use is strictly prohibited.</p>
          </div>

          <h2>1. Copyright Ownership</h2>
          <p>Copyright © {new Date().getFullYear()} Lisa McPherson / Lisa Fit Method. All rights reserved.</p>
          <p>The following content is owned exclusively by Lisa Fit Method and protected under 17 U.S.C. § 101 et seq. (U.S. Copyright Act) and applicable international treaties:</p>
          <ul>
            <li><strong>Photography</strong> — all photographs appearing on this website, including hero images, portrait photos, and lifestyle photography.</li>
            <li><strong>Video content</strong> — all exercise demonstration videos, coaching videos, and any video content created for Training Foundations or related products.</li>
            <li><strong>Written content</strong> — all blog articles, course programs, training guides, and instructional text.</li>
            <li><strong>Branding and design</strong> — the Lisa Fit Method name, logo, visual identity, and site design.</li>
            <li><strong>Training programs</strong> — the Training Foundations program design, structure, sequencing, and all associated materials.</li>
          </ul>

          <h2>2. Prohibited Uses</h2>
          <p>The following uses of our content are expressly prohibited without prior written consent from Lisa Fit Method:</p>
          <ul>
            <li>Downloading, copying, saving, or reproducing any photograph or video from this site for any purpose.</li>
            <li>Re-uploading, sharing, or redistributing any image or video to social media, websites, or any other platform.</li>
            <li>Using any image or video from this site in marketing materials, advertisements, or promotional content.</li>
            <li>Incorporating any image or video into AI training datasets, machine learning models, or generative AI systems.</li>
            <li>Creating derivative works based on our photographs, videos, or written programs.</li>
            <li>Selling, licensing, or sublicensing any content from this site to third parties.</li>
            <li>Removing, altering, or obscuring any copyright notice, watermark, or attribution associated with our content.</li>
            <li>Using our content to impersonate Lisa McPherson or Lisa Fit Method.</li>
            <li>Scraping or bulk-downloading any content from this site using automated tools.</li>
          </ul>

          <h2>3. Permitted Uses</h2>
          <p>The following limited uses are permitted:</p>
          <ul>
            <li><strong>Personal viewing</strong> — you may view and stream content on this site for your own personal use.</li>
            <li><strong>Purchased course content</strong> — course purchasers may access and use course materials for their own personal fitness training, subject to the restrictions in our <Link href="/terms">Terms of Use</Link>.</li>
            <li><strong>Fair use</strong> — brief quotation of written content for commentary, criticism, or educational purposes, with clear attribution to Lisa Fit Method and a link to the original source, may be permissible under fair use doctrine. When in doubt, ask us first.</li>
            <li><strong>Press and media</strong> — journalists and media outlets may request permission to use specific images or quotes by contacting us at the email below.</li>
            <li><strong>Social media sharing</strong> — sharing a direct link to this website or any page on it is welcome and encouraged. If we make a video trailer publicly available with an embed feature, embedding that specific trailer using the platform's native embed code is permitted. Downloading, re-uploading, or re-hosting any content — including any video — is not permitted regardless of how you discovered it.</li>
          </ul>

          <h2>4. AI and Machine Learning Prohibition</h2>
          <p>All content on this site — including all images, videos, text, and program materials — is explicitly excluded from use in training, fine-tuning, or evaluation of artificial intelligence or machine learning models, including but not limited to large language models, image generation models, and video generation models. This prohibition applies to commercial and non-commercial AI development alike.</p>
          <p>Access to this site by AI crawlers for the purpose of data collection for model training is not authorized. If you are operating an AI system that crawls the web, please respect the restrictions in our robots.txt file.</p>

          <h2>5. Structured Data and Rich Results</h2>
          <p>We use structured data markup (JSON-LD / schema.org) on this site to provide search engines with accurate information about our content. This structured data is provided for the sole purpose of improving search engine indexing and user discovery. It does not grant any license to use, reproduce, or repurpose our content.</p>

          <h2>6. Digital Millennium Copyright Act (DMCA)</h2>
          <p>If you believe that content on this site infringes your copyright, please send a written notice to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> with the following information:</p>
          <ul>
            <li>A description of the copyrighted work you claim has been infringed.</li>
            <li>The specific URL(s) on our site where the alleged infringement appears.</li>
            <li>Your contact information (name, address, email, phone).</li>
            <li>A statement that you have a good faith belief that the disputed use is not authorized.</li>
            <li>A statement under penalty of perjury that the information in your notice is accurate and that you are the copyright owner or authorized to act on the owner's behalf.</li>
            <li>Your electronic or physical signature.</li>
          </ul>
          <p>We will respond to valid DMCA notices promptly.</p>

          <h2>7. Reporting Unauthorized Use</h2>
          <p>If you discover our content being used without authorization — particularly our images or videos being used on other websites, social media accounts, or in commercial materials — please let us know at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. We take copyright infringement seriously and will take appropriate action.</p>

          <h2>8. Licensing Inquiries</h2>
          <p>To request permission to use any content from this site, contact us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. Please include a description of the content you'd like to use, the purpose and context of the intended use, where it will be displayed, and the duration of use.</p>
          <p>We review all licensing requests individually and reserve the right to decline any request at our sole discretion.</p>

          <h2>9. Enforcement</h2>
          <p>We actively monitor the web for unauthorized use of our content. Unauthorized use of our intellectual property may result in legal action including claims for copyright infringement, which may entitle us to seek statutory damages, actual damages, and attorneys' fees.</p>

          <div style={{ marginTop: "3rem", paddingTop: "2rem", borderTop: "1px solid rgba(0,0,0,0.08)", display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
            <Link href="/privacy" style={{ fontSize: 13, color: "#a8895e" }}>Privacy Policy</Link>
            <Link href="/terms" style={{ fontSize: 13, color: "#a8895e" }}>Terms of Use</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
