import type { Metadata } from 'next'
import { LegalPage, Section, SubSection, UL, InfoBox, AcknowledgmentBox } from '../components'

export const metadata: Metadata = {
  title: 'Privacy Policy — TradVue',
  description: 'Learn how TradVue collects, uses, and protects your personal information.',
  alternates: {
    canonical: 'https://tradvue.com/legal/privacy',
  },
  robots: 'noindex, follow',
}

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" lastUpdated="March 12, 2026">

      <Section id="intro" title="1. Introduction">
        <p>
          TradVue is operated by <strong>Apex Logics LLC</strong>, a Florida limited liability company
          ("Company," "we," "us," "our"). We are committed to protecting your privacy.
          This Privacy Policy explains how we collect, use, disclose, and safeguard your information
          when you use the TradVue platform.
        </p>
        <p>
          Please read this policy carefully. If you do not agree with our practices,
          please do not use TradVue.
        </p>
      </Section>

      <Section id="collection" title="2. Information We Collect">
        <SubSection title="2.1 Information You Provide Directly">
          <p><strong>Account Registration:</strong></p>
          <UL items={[
            'Email address',
            'Password (hashed and never stored in plaintext)',
            'Display name or username (optional)',
            'Country / timezone preference',
          ]} />
          <p style={{ marginTop: '12px' }}><strong>Trade Journal Data (User-Entered):</strong></p>
          <UL items={[
            'Trade entries: date, ticker, direction, entry/exit price, P&L',
            'Trade notes, tags, and setup labels',
            'Journal images or screenshots (if uploaded)',
            'Weekly and monthly review notes',
          ]} />
          <p style={{ marginTop: '12px' }}><strong>Portfolio Data (User-Entered):</strong></p>
          <UL items={[
            'Holdings: ticker, shares, cost basis, purchase date',
            'Dividend reinvestment settings',
            'Watchlist securities',
            'Portfolio performance preferences',
          ]} />
          <p style={{ marginTop: '12px' }}><strong>Communications:</strong></p>
          <UL items={[
            'Support tickets and messages',
            'Feedback and feature requests',
          ]} />
        </SubSection>

        <SubSection title="2.2 What We Do NOT Collect">
          <InfoBox>
            <strong>🔒 We will never ask for or store:</strong>
            <ul style={{ marginTop: '8px', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li>Brokerage usernames or passwords</li>
              <li>Financial account numbers or routing numbers</li>
              <li>Social Security Numbers (SSN) or national tax IDs</li>
              <li>Credit or debit card numbers (payments handled externally)</li>
              <li>Government-issued ID numbers</li>
            </ul>
          </InfoBox>
        </SubSection>

        <SubSection title="2.3 Automatically Collected Information">
          <p><strong>Usage Analytics:</strong></p>
          <UL items={[
            'Pages visited, features used, and time spent',
            'Browser type, version, and device type',
            'Operating system',
            'IP address (anonymized for analytics)',
            'Referring website',
          ]} />
          <p style={{ marginTop: '12px' }}><strong>Cookies & Local Storage:</strong></p>
          <UL items={[
            'Session cookies (Google Analytics analytics cookies)',
            'localStorage for user preferences (theme, layout, watchlist, journal data)',
            'See our Cookie Policy for full details',
          ]} />
        </SubSection>
      </Section>

      <Section id="use" title="3. How We Use Your Information">
        <SubSection title="Service Operations">
          <UL items={[
            'Creating and managing your account',
            'Storing and displaying your trade journal entries',
            'Displaying your portfolio data and analytics',
            'Processing subscription payments',
            'Sending account-related notifications',
          ]} />
        </SubSection>
        <SubSection title="Analytics & Improvement">
          <UL items={[
            'Understanding how users interact with TradVue',
            'Identifying bugs and improving user experience',
            'Measuring platform performance metrics',
          ]} />
        </SubSection>
        <SubSection title="Communications">
          <UL items={[
            'Responding to your support inquiries',
            'Sending service announcements and policy updates',
            'Transactional emails (account confirmation, password reset) via Resend',
          ]} />
        </SubSection>
        <InfoBox>
          <strong>We do NOT sell your personal data to third parties. Ever.</strong>
        </InfoBox>
      </Section>

      <Section id="third-party-services" title="4. Third-Party Services We Use">
        <p>
          TradVue uses the following third-party services to operate the platform. Each provider
          has its own privacy policy governing their use of data.
        </p>
        <SubSection title="Infrastructure & Authentication">
          <UL items={[
            'Supabase — Authentication, database storage, and real-time features. Stores your account credentials and app data. supabase.com/privacy',
            'Render — Cloud hosting and deployment infrastructure. render.com/privacy',
          ]} />
        </SubSection>
        <SubSection title="Market Data">
          <UL items={[
            'Finnhub — Stock quotes, financials, and market data. finnhub.io/privacy',
            'NewsAPI — Financial news headlines. newsapi.org/privacy',
            'These providers supply market data only; we do not share your personal data with them.',
          ]} />
        </SubSection>
        <SubSection title="Communications">
          <UL items={[
            'Resend — Transactional email delivery (account confirmations, password resets). resend.com/privacy',
          ]} />
        </SubSection>
        <SubSection title="Analytics">
          <UL items={[
            'Google Analytics — Usage analytics and platform performance metrics. policies.google.com/privacy',
            'Google Analytics data is anonymized and does not include financial data.',
          ]} />
        </SubSection>
      </Section>

      <Section id="sharing" title="5. Data Sharing & Disclosure">
        <SubSection title="5.1 When We Share">
          <UL items={[
            'With service providers listed above, only as necessary to operate the Service',
            'When required by law (court orders, regulatory investigations)',
            'To protect the safety of users or the public',
            'In the event of a merger, acquisition, or asset sale (with prior notice)',
          ]} />
        </SubSection>
        <SubSection title="5.2 Aggregated / Anonymous Data">
          <p>
            We may share anonymized, aggregated statistics (e.g., usage trends) with no personally
            identifiable information.
          </p>
        </SubSection>
      </Section>

      <Section id="retention" title="6. Data Retention & Deletion">
        <p>
          <strong>You are in control of your data.</strong>
        </p>
        <UL items={[
          'You can delete your account and all associated data at any time via Account Settings',
          'Upon deletion, your data is removed from our systems within 30 days',
          'Residual copies in backups are purged within 90 days',
          'We may retain certain data longer if required by law',
          'Usage analytics (anonymized) may be retained longer per our analytics providers',
        ]} />
      </Section>

      <Section id="security" title="7. Data Security">
        <p>TradVue implements industry-standard security measures:</p>
        <UL items={[
          'TLS/HTTPS encryption for all data in transit',
          'Supabase row-level security for database access control',
          'Hashed passwords (never stored in plaintext)',
          'Regular security updates and dependency audits',
          'Access controls limiting staff access to user data',
        ]} />
        <p>
          <strong>However, no system is completely secure.</strong> We cannot guarantee absolute
          security. If you suspect a breach, contact{' '}
          <a href="mailto:privacy@tradvue.com" style={{ color: '#4a9eff' }}>privacy@tradvue.com</a>{' '}
          immediately.
        </p>
      </Section>

      <Section id="your-rights" title="8. Your Rights (GDPR & CCPA)">
        <SubSection title="8.1 All Users">
          <UL items={[
            'Access — Request a copy of your personal data',
            'Correction — Correct inaccurate information',
            'Deletion — Delete your account and all data',
            'Export — Download your trade journal and portfolio data',
            'Opt-out — Unsubscribe from marketing emails at any time',
          ]} />
        </SubSection>
        <SubSection title="8.2 EU/EEA Residents (GDPR)">
          <UL items={[
            'Right of Access (Art. 15)',
            'Right to Rectification (Art. 16)',
            'Right to Erasure / "Right to be Forgotten" (Art. 17)',
            'Right to Data Portability (Art. 20)',
            'Right to Restrict Processing (Art. 18)',
            'Right to Object to Processing (Art. 21)',
            'Right to lodge a complaint with your local Data Protection Authority',
          ]} />
        </SubSection>
        <SubSection title="8.3 California Residents (CCPA)">
          <UL items={[
            'Right to Know — What data is collected and how it is used',
            'Right to Delete — Request deletion of personal information',
            'Right to Opt-Out — We do not sell data, but you may opt out of analytics sharing',
            'Right to Non-Discrimination — Exercising rights will not affect your Service access',
          ]} />
        </SubSection>
        <InfoBox>
          To exercise any of these rights, email{' '}
          <a href="mailto:privacy@tradvue.com" style={{ color: '#4a9eff' }}>privacy@tradvue.com</a>{' '}
          with the subject line "Privacy Request." We will respond within 30 days (45 days for CCPA).
        </InfoBox>
      </Section>

      <Section id="cookies" title="9. Cookies & Local Storage">
        <p>
          We use analytics cookies (Google Analytics) and localStorage for user preferences such
          as theme, layout settings, watchlist data, and journal preferences.
        </p>
        <p>
          For full details on cookies we use and how to disable them, see our{' '}
          <a href="/legal/cookies" style={{ color: '#4a9eff' }}>Cookie Policy</a>.
        </p>
      </Section>

      <Section id="children" title="10. Children's Privacy">
        <p>
          TradVue is <strong>not designed for or directed to individuals under the age of 18.</strong>{' '}
          We do not knowingly collect personal information from minors. If we learn that a minor
          has provided us data, we will delete it promptly.
        </p>
      </Section>

      <Section id="changes" title="11. Changes to This Policy">
        <p>
          We may update this Privacy Policy periodically. We will notify you of material changes
          via email or an in-app notice. Continued use after changes indicates acceptance of
          the updated policy.
        </p>
      </Section>

      <Section id="contact" title="12. Contact Us">
        <p>
          For privacy questions, data requests, or concerns:
        </p>
        <UL items={[
          'Email: privacy@tradvue.com',
          'Subject line for data requests: "Privacy Request" or "GDPR Request" or "CCPA Request"',
        ]} />
        <p style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-2)' }}>
          Apex Logics LLC — Florida Limited Liability Company<br />
          Effective Date: March 12, 2026
        </p>
      </Section>

      <AcknowledgmentBox>
        By using TradVue, you acknowledge that you have read and understood this Privacy Policy
        and consent to the data practices described herein.
      </AcknowledgmentBox>

    </LegalPage>
  )
}
