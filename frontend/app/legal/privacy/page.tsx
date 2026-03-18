import type { Metadata } from 'next'
import { LegalPage, Section, SubSection, UL, InfoBox, WarningBox, AcknowledgmentBox } from '../components'

export const metadata: Metadata = {
  title: 'Privacy Policy — TradVue',
  description: 'Learn how TradVue collects, uses, and protects your personal information.',
  alternates: {
    canonical: 'https://www.tradvue.com/legal/privacy',
  },
  robots: 'noindex, follow',
}

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" lastUpdated="March 16, 2026">

      <Section id="intro" title="1. Introduction">
        <p>
          This Privacy Policy explains how Apex Logics LLC, a Florida limited liability company doing business as
          TradVue ("TradVue," "we," "us," or "our"), collects, uses, stores, shares, and protects information about
          you when you use the TradVue platform at tradvue.com and any associated applications (collectively, the
          "Service").
        </p>
        <p>
          TradVue is committed to protecting your privacy and handling your personal information with transparency
          and care. Please read this Policy carefully. By creating an account or using the Service, you agree to
          the collection and use of your information as described in this Privacy Policy.
        </p>
        <p>
          This Privacy Policy is incorporated into and forms part of our{' '}
          <a href="/legal/terms" style={{ color: '#4a9eff' }}>Terms of Service</a>.
          Capitalized terms not defined herein have the meaning given to them in the Terms of Service.
        </p>
        <InfoBox>
          For data protection inquiries, contact us at:{' '}
          <a href="mailto:privacy@tradvue.com" style={{ color: '#4a9eff' }}>privacy@tradvue.com</a>
        </InfoBox>
      </Section>

      <Section id="collection" title="2. Information We Collect">
        <p>We collect the following categories of information:</p>

        <SubSection title="2.1 Account Information">
          <p>When you register for TradVue, we collect:</p>
          <UL items={[
            'Full name — to personalize your account.',
            'Email address — for account authentication, transactional communications, and support.',
            'Password — stored as a one-way cryptographic hash using bcrypt via Supabase Auth. We never store, access, or transmit your plaintext password.',
          ]} />
        </SubSection>

        <SubSection title="2.2 Trading Data">
          <p>The core content you create and store in TradVue, including:</p>
          <UL items={[
            'Trade records (instrument, date, price, quantity, direction, entry/exit times, profit/loss)',
            'Journal entries and trade notes',
            'Tags and custom trade labels',
            'Portfolio holdings and position snapshots',
            'Historical transaction data',
            'Playbook entries (strategy templates)',
            'Post-Trade Ritual responses',
          ]} />
          <InfoBox>
            <strong>This data belongs to you.</strong> See Section 9 (Your Rights and Choices) for export and deletion options.
          </InfoBox>
        </SubSection>

        <SubSection title="2.3 Market Data Preferences">
          <UL items={[
            'Watchlists and instruments you track',
            'Price alert configurations',
            'Dashboard layout and settings preferences',
          ]} />
        </SubSection>

        <SubSection title="2.4 Anonymous Visitors vs. Account Holders">
          <p>
            TradVue distinguishes between anonymous visitors and registered account holders for data collection purposes:
          </p>
          <UL items={[
            'Anonymous Visitors (no account): When you access TradVue without creating an account, we may collect standard analytics data including page views, device type, browser type, and IP address for security and service improvement purposes. We do not store personal trade data, journal entries, or any personally identifiable information for anonymous visitors. Anonymous usage of publicly available features (dashboard, news, economic calendar, calculators, watchlist) does not result in storage of personal data on our servers.',
            'Account Holders: Once you create a free or paid account, we collect and store the full range of data described in this Section 2, including your account information, trading data, preferences, and usage data, as necessary to provide the Service.',
          ]} />
        </SubSection>

        <SubSection title="2.5 Usage Data">
          <p>When you use the Service, we automatically collect:</p>
          <UL items={[
            'IP address — for security, fraud prevention, and abuse detection.',
            'Device type and operating system — for compatibility and support.',
            'Browser type and version — for compatibility.',
            'Pages and features visited — to understand how the Service is used.',
            'Feature interaction data — which features you use, how often, and for how long.',
            'Referral URLs — how you arrived at the Service.',
            'Error logs — to diagnose and fix technical issues.',
          ]} />
        </SubSection>

        <SubSection title="2.6 Payment Information">
          <p>
            All payment processing is handled exclusively by <strong>Stripe, Inc.</strong> ("Stripe"), a PCI DSS
            Level 1-certified payment processor. TradVue:
          </p>
          <UL items={[
            'Does not collect, store, or process your credit card numbers, bank account numbers, or other payment card data.',
            'May retain records of subscription tier, billing dates, and transaction status for account management purposes.',
            'May receive from Stripe a tokenized payment method identifier (not the card number itself) for managing recurring subscriptions.',
          ]} />
        </SubSection>

        <SubSection title="2.7 Broker Sync Data (Future Feature)">
          <p>
            If and when TradVue offers automated broker synchronization, and you choose to connect a brokerage account:
          </p>
          <UL items={[
            'We will collect trade history, account balances, and position data from connected brokerages through our third-party aggregator.',
            'Connecting a brokerage account is entirely voluntary.',
            'Your brokerage credentials are never stored by TradVue; they are processed directly by the aggregation service under that service\'s terms and privacy policy.',
          ]} />
        </SubSection>

        <SubSection title="2.8 Communications">
          <p>
            If you contact TradVue support or send us an email, we retain the content of your communications to
            respond to you and improve our support.
          </p>
        </SubSection>
      </Section>

      <Section id="use" title="3. How We Use Your Information">
        <p>We use the information we collect for the following purposes:</p>

        <SubSection title="3.1 Service Delivery">
          <p>
            To provide, operate, and maintain the TradVue platform; to process your trades, journal entries, and
            analytics; to deliver the features described in our Terms of Service.
          </p>
        </SubSection>

        <SubSection title="3.2 AI Coach Features">
          <p>
            When you use AI Coach, relevant trade data and journal entries are transmitted to OpenAI's API for
            processing and analysis. See Section 5.10 (OpenAI and AI Coach) for important details.
          </p>
        </SubSection>

        <SubSection title="3.3 Account Management">
          <p>
            To create and manage your account, process subscriptions and billing (via Stripe), and send
            transactional communications such as billing receipts, password resets, and subscription notices.
          </p>
        </SubSection>

        <SubSection title="3.4 Customer Support">
          <p>To respond to your questions, troubleshoot issues, and provide technical support.</p>
        </SubSection>

        <SubSection title="3.5 Service Improvement">
          <p>
            To analyze aggregate usage patterns, understand how features are used, and improve the Service.
            We use Google Analytics (GA4) for this purpose.
          </p>
        </SubSection>

        <SubSection title="3.6 Security and Fraud Prevention">
          <p>
            To detect, investigate, and prevent fraudulent transactions, abuse, security breaches, and other
            potentially illegal activity.
          </p>
        </SubSection>

        <SubSection title="3.7 Legal Compliance">
          <p>
            To comply with applicable laws, regulations, court orders, and legal process; to enforce our Terms
            of Service and other agreements.
          </p>
        </SubSection>

        <SubSection title="3.8 Communications">
          <p>
            To send you service-related notices (including changes to our Terms or Privacy Policy) and, where
            you have opted in, product updates or newsletters. You may opt out of marketing communications at any time.
          </p>
        </SubSection>

        <SubSection title="3.9 Aggregated Analytics">
          <p>
            To generate aggregated, de-identified, and anonymized statistics about platform usage. This aggregated
            data does not identify individual users and may be used or shared without restriction.
          </p>
        </SubSection>

        <InfoBox>
          <strong>We do NOT sell your personal data to third parties. Ever.</strong>
        </InfoBox>
      </Section>

      <Section id="gdpr-bases" title="4. Legal Bases for Processing (GDPR)">
        <p>
          If you are located in the European Economic Area (EEA) or United Kingdom, we process your personal data
          under the following legal bases under the General Data Protection Regulation (GDPR):
        </p>
        <div style={{ overflowX: 'auto', margin: '8px 0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', color: 'var(--text-1)' }}>
            <thead>
              <tr>
                {['Purpose', 'Legal Basis'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left',
                    padding: '10px 14px',
                    background: 'var(--bg-2)',
                    borderBottom: '1px solid var(--border)',
                    color: 'var(--text-0)',
                    fontWeight: 600,
                    fontSize: '12px',
                    letterSpacing: '0.03em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['Providing the Service', 'Performance of a contract (Art. 6(1)(b))'],
                ['Account management and billing', 'Performance of a contract (Art. 6(1)(b))'],
                ['Analytics and improvement', 'Legitimate interests (Art. 6(1)(f))'],
                ['Marketing (opt-in only)', 'Consent (Art. 6(1)(a))'],
                ['Security and fraud prevention', 'Legitimate interests (Art. 6(1)(f))'],
                ['Legal compliance', 'Legal obligation (Art. 6(1)(c))'],
                ['AI Coach processing', 'Consent (Art. 6(1)(a)) — you may opt out of AI Coach at any time'],
              ].map(([purpose, basis], i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 14px', lineHeight: 1.5 }}>{purpose}</td>
                  <td style={{ padding: '10px 14px', lineHeight: 1.5, color: 'var(--text-2)' }}>{basis}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="third-party-services" title="5. Third-Party Service Providers">
        <p>
          We share your information with the following categories of third-party service providers who process data
          on our behalf. These providers are contractually obligated to protect your data and process it only as
          directed by TradVue:
        </p>

        <SubSection title="5.1 Render (Backend Hosting)">
          <p>
            Our backend application and API servers are hosted on Render. Your data transits through and is processed
            on Render's infrastructure.
          </p>
        </SubSection>

        <SubSection title="5.2 Vercel (Frontend Hosting)">
          <p>
            Our web application frontend is hosted on Vercel. Vercel may log access data (IP address, request
            metadata) in the ordinary course of providing hosting services.
          </p>
        </SubSection>

        <SubSection title="5.3 Supabase / Amazon Web Services (Database)">
          <p>
            Your account data and trade records are stored in a PostgreSQL database hosted by Supabase, which runs
            on Amazon Web Services (AWS). Data is encrypted at rest and protected by Row Level Security (RLS)
            policies. Data is stored in the United States.
          </p>
        </SubSection>

        <SubSection title="5.4 Cloudflare (CDN and Security)">
          <p>
            All traffic to TradVue passes through Cloudflare's network, which provides content delivery, DDoS
            protection, bot management, and Web Application Firewall (WAF) services. Cloudflare processes
            connection metadata including IP addresses.
          </p>
        </SubSection>

        <SubSection title="5.5 Stripe (Payment Processing)">
          <p>
            Subscription payments are processed exclusively by Stripe. Stripe is PCI DSS Level 1 certified.
            TradVue never handles your raw payment card data. Stripe's privacy policy governs the data it
            collects in connection with payment processing.
          </p>
        </SubSection>

        <SubSection title="5.6 Resend (Transactional Email)">
          <p>
            Transactional emails (account verification, password reset, billing notices) are delivered through
            Resend's email delivery service. Resend processes your email address and message content for
            delivery purposes.
          </p>
        </SubSection>

        <SubSection title="5.7 Google Analytics (GA4)">
          <p>
            We use Google Analytics 4 to analyze how users interact with the Service. Google Analytics collects
            usage data through cookies and similar technologies. You can opt out of Google Analytics using the{' '}
            <a href="https://tools.google.com/dlpage/gaoptout" style={{ color: '#4a9eff' }} target="_blank" rel="noopener noreferrer">
              Google Analytics Opt-Out Browser Add-On
            </a>{' '}
            or by enabling Do Not Track (see Section 14).
          </p>
          <p>
            Google Analytics does <strong>not</strong> receive or process your trade data, account details, or
            personal financial information. It receives only standard browsing analytics.
          </p>
        </SubSection>

        <SubSection title="5.8 Alpaca Markets, Marketaux, Finnhub (Market Data)">
          <p>
            These providers supply market data (price quotes, historical data, financial news) displayed on the
            TradVue platform. We do not share your personal trade data with these providers. They may receive
            information such as IP addresses in the course of serving data requests.
          </p>
        </SubSection>

        <SubSection title="5.9 SnapTrade (Broker Aggregation — Future Feature)">
          <p>
            If and when TradVue enables broker account synchronization, we intend to use SnapTrade as our broker
            aggregation provider. SnapTrade would process data from your connected brokerage accounts in accordance
            with SnapTrade's privacy policy. This feature is not yet active. We will update this Policy before
            enabling it.
          </p>
        </SubSection>

        <SubSection title="5.10 OpenAI (AI Coach Feature)">
          <WarningBox>
            <strong>IMPORTANT — AI COACH DATA PROCESSING:</strong>
            <br /><br />
            When you use the AI Coach feature, your trade data (including trade records, journal entries, and notes
            that you submit for analysis) is transmitted to <strong>OpenAI's API</strong> for processing. OpenAI's
            API is used to generate analytical insights about your trading patterns.
            <br /><br />
            <strong>Key disclosures:</strong>
            <ul style={{ marginTop: '10px', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li>Your trade data may be sent to OpenAI's servers for processing.</li>
              <li>According to OpenAI's API usage policies, data sent through the API is <strong>not used to train OpenAI's models</strong> and is not retained beyond the processing of each request (subject to OpenAI's current terms and policies).</li>
              <li>OpenAI's Privacy Policy and API Usage Policies govern OpenAI's handling of data received through the API.</li>
              <li>TradVue is responsible for the data we transmit to OpenAI; we transmit only data relevant to the analysis you request.</li>
              <li><strong>You can opt out of AI Coach features at any time</strong> through your account settings. If you disable AI Coach, your trade data will not be sent to OpenAI.</li>
            </ul>
          </WarningBox>
        </SubSection>
      </Section>

      <Section id="cookies" title="6. Cookies and Tracking Technologies">
        <p>
          We use cookies and similar tracking technologies. For details, please see our{' '}
          <a href="/legal/cookies" style={{ color: '#4a9eff' }}>Cookie Policy</a>.
        </p>
      </Section>

      <Section id="security" title="7. Data Security">
        <p>
          We implement commercially reasonable administrative, technical, and organizational security measures
          designed to protect your personal information, including:
        </p>
        <UL items={[
          'Encryption in Transit: All data transmitted between your browser and TradVue is encrypted using TLS (Transport Layer Security).',
          'Encryption at Rest: Your data stored in Supabase/AWS is encrypted at rest.',
          'Password Hashing: Passwords are hashed using bcrypt via Supabase Auth. We never store plaintext passwords or have access to your password.',
          'Row Level Security (RLS): Supabase RLS policies ensure that users can only access their own data at the database level.',
          'Rate Limiting: API rate limiting is enforced to prevent abuse and credential stuffing attacks.',
          'Cloudflare WAF: A Web Application Firewall (WAF) is deployed at the network edge to detect and block malicious traffic.',
          'Security Audits: We conduct periodic security reviews of our infrastructure and code.',
        ]} />
        <InfoBox>
          <strong>No system is completely secure.</strong> While we take reasonable precautions, we cannot guarantee
          absolute security. Please use a strong, unique password for your TradVue account and enable two-factor
          authentication when available.
        </InfoBox>
      </Section>

      <Section id="retention" title="8. Data Retention">
        <div style={{ overflowX: 'auto', margin: '8px 0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', color: 'var(--text-1)' }}>
            <thead>
              <tr>
                {['Data Category', 'Retention Period'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left',
                    padding: '10px 14px',
                    background: 'var(--bg-2)',
                    borderBottom: '1px solid var(--border)',
                    color: 'var(--text-0)',
                    fontWeight: 600,
                    fontSize: '12px',
                    letterSpacing: '0.03em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['Account and trading data (active account)', 'Retained while account is active'],
                ['Account and trading data (after deletion)', 'Removed from active systems within approximately 90 days using commercially reasonable efforts'],
                ['Encrypted backup copies', 'Purged in the ordinary course of backup rotation (retained for a reasonable period)'],
                ['Usage and access logs', 'Up to 12 months'],
                ['Payment records', 'As required by applicable tax and financial law'],
                ['Cookies', 'Per Cookie Policy'],
                ['Aggregated/anonymized analytics', 'Indefinitely (not linked to individuals)'],
              ].map(([cat, period], i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 14px', lineHeight: 1.5 }}>{cat}</td>
                  <td style={{ padding: '10px 14px', lineHeight: 1.5, color: 'var(--text-2)' }}>{period}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <InfoBox>
          <strong>Important:</strong> We do not guarantee permanent retention of your data. You are responsible
          for maintaining your own backups. See Section 9 for how to export your data.
        </InfoBox>
        <p>
          We may retain data for longer periods where required by applicable law or for the establishment,
          exercise, or defense of legal claims.
        </p>
        <p>
          <strong>8.A Inactive Accounts.</strong> An account is considered inactive if no login activity has
          occurred for twelve (12) consecutive months. TradVue reserves the right to delete User Data associated
          with inactive accounts after providing thirty (30) days written notice to the email address on file. If
          the account holder does not respond or log in within the notice period, data may be permanently deleted.
          TradVue is not responsible for any data loss resulting from account inactivity.
        </p>
        <WarningBox>
          <strong>8.B Free Tier Data Disclaimer.</strong>
          <br /><br />
          DATA STORED UNDER FREE-TIER ACCOUNTS IS PROVIDED ON A BEST-EFFORT BASIS. TRADVUE SHALL NOT BE LIABLE FOR
          ANY LOSS, CORRUPTION, OR UNAVAILABILITY OF DATA ASSOCIATED WITH FREE-TIER ACCOUNTS. Free-tier users are
          solely responsible for maintaining their own backup copies of any data they input into TradVue. For
          enhanced data protection and reliability, consider upgrading to a paid subscription plan.
        </WarningBox>
      </Section>

      <Section id="your-rights" title="9. Your Rights and Choices">
        <SubSection title="9.1 Access and Portability">
          <p>
            You have the right to access the personal information we hold about you. You may export your trade
            data at any time through the data export feature in your account settings. To request a copy of your
            personal account information, contact{' '}
            <a href="mailto:privacy@tradvue.com" style={{ color: '#4a9eff' }}>privacy@tradvue.com</a>.
          </p>
        </SubSection>
        <SubSection title="9.2 Correction">
          <p>
            You may update your account information (name, email) directly in your account settings. For other
            corrections, contact{' '}
            <a href="mailto:privacy@tradvue.com" style={{ color: '#4a9eff' }}>privacy@tradvue.com</a>.
          </p>
        </SubSection>
        <SubSection title="9.3 Deletion">
          <p>
            You may delete your account at any time through your account settings or by contacting{' '}
            <a href="mailto:privacy@tradvue.com" style={{ color: '#4a9eff' }}>privacy@tradvue.com</a>.
            See Section 8 for retention timelines after deletion.
          </p>
        </SubSection>
        <SubSection title="9.4 Opt-Out of Marketing">
          <p>
            You may opt out of marketing or promotional emails at any time by clicking the unsubscribe link in
            any marketing email or by contacting{' '}
            <a href="mailto:support@tradvue.com" style={{ color: '#4a9eff' }}>support@tradvue.com</a>.
            You will continue to receive transactional emails (e.g., billing receipts, password resets) as
            necessary to provide the Service.
          </p>
        </SubSection>
        <SubSection title="9.5 AI Coach Opt-Out">
          <p>
            You may disable AI Coach features in your account settings. Disabling AI Coach will prevent your
            trade data from being sent to OpenAI.
          </p>
        </SubSection>
        <SubSection title="9.6 Cookie Management">
          <p>
            You may manage cookie preferences through your browser settings or our cookie consent tool.
            See our{' '}
            <a href="/legal/cookies" style={{ color: '#4a9eff' }}>Cookie Policy</a> for details.
          </p>
        </SubSection>
      </Section>

      <Section id="gdpr-rights" title="10. Rights for EU/EEA Users (GDPR)">
        <p>
          If you are located in the European Economic Area, United Kingdom, or Switzerland, you have the
          following rights under the GDPR and applicable data protection laws:
        </p>
        <UL items={[
          'Right of Access: Request a copy of your personal data.',
          'Right of Rectification: Request correction of inaccurate or incomplete data.',
          'Right to Erasure ("Right to be Forgotten"): Request deletion of your personal data, subject to legal obligations and legitimate interests.',
          'Right to Data Portability: Receive your data in a structured, commonly used, machine-readable format and transmit it to another controller.',
          'Right to Restrict Processing: Request that we limit the processing of your data in certain circumstances.',
          'Right to Object: Object to processing based on legitimate interests or for direct marketing purposes.',
          'Right to Withdraw Consent: Where we process data based on your consent, you may withdraw consent at any time without affecting the lawfulness of processing prior to withdrawal.',
          'Right to Lodge a Complaint: You have the right to lodge a complaint with your local supervisory authority (e.g., your national data protection authority).',
        ]} />
        <InfoBox>
          To exercise your GDPR rights, contact:{' '}
          <a href="mailto:privacy@tradvue.com" style={{ color: '#4a9eff' }}>privacy@tradvue.com</a>
          <br />
          We will respond to verified GDPR rights requests within thirty (30) days, or as required by
          applicable law. We may request identity verification before processing rights requests.
        </InfoBox>
      </Section>

      <Section id="ccpa" title="11. Rights for California Residents (CCPA/CPRA)">
        <p>
          If you are a California resident, you have the following rights under the California Consumer Privacy
          Act ("CCPA") as amended by the California Privacy Rights Act ("CPRA"):
        </p>

        <SubSection title="11.1 Right to Know">
          <p>
            You have the right to request disclosure of: (a) the categories of personal information we collect;
            (b) the sources from which we collect it; (c) our business or commercial purpose for collecting it;
            (d) the categories of third parties with whom we share it; and (e) the specific pieces of personal
            information we hold about you.
          </p>
        </SubSection>
        <SubSection title="11.2 Right to Delete">
          <p>
            You have the right to request deletion of personal information we have collected from you, subject
            to certain exceptions.
          </p>
        </SubSection>
        <SubSection title="11.3 Right to Correct">
          <p>You have the right to request correction of inaccurate personal information.</p>
        </SubSection>
        <SubSection title="11.4 Right to Opt-Out of Sale or Sharing">
          <p>
            TradVue does <strong>not</strong> sell your personal information to third parties for monetary or
            other valuable consideration. TradVue does <strong>not</strong> share your personal information for
            cross-context behavioral advertising purposes.
          </p>
        </SubSection>
        <SubSection title="11.5 Right to Non-Discrimination">
          <p>
            We will not discriminate against you for exercising any CCPA rights. We will not deny you goods or
            services, charge different prices, or provide a different level of service because you exercised
            a CCPA right.
          </p>
        </SubSection>
        <SubSection title="11.6 Shine the Light">
          <p>
            California residents may request information about disclosure of personal information to third
            parties for direct marketing purposes. We do not share personal information for third-party direct
            marketing purposes.
          </p>
        </SubSection>
        <InfoBox>
          To exercise your CCPA rights, contact:{' '}
          <a href="mailto:privacy@tradvue.com" style={{ color: '#4a9eff' }}>privacy@tradvue.com</a>
          <br />
          We will respond to verified CCPA requests within forty-five (45) days. You may designate an
          authorized agent to submit requests on your behalf.
        </InfoBox>
      </Section>

      <Section id="children" title="12. Children's Privacy">
        <p>
          <strong>12.1 Not Directed to Children.</strong> TradVue is not directed to individuals under the age
          of 18. We do not knowingly collect personal information from anyone under 18 years of age.
        </p>
        <p>
          <strong>12.2 COPPA Compliance.</strong> TradVue complies with the Children's Online Privacy Protection
          Act (COPPA). We do not knowingly collect personal information from children under 13.
        </p>
        <p>
          <strong>12.3 GDPR — Under 16.</strong> In jurisdictions covered by GDPR where the age of digital
          consent is 16, we do not process the personal data of individuals under 16 without verifiable parental
          or guardian consent.
        </p>
        <p>
          <strong>12.4 Deletion of Children's Data.</strong> If we become aware that we have inadvertently
          collected personal information from an individual under the applicable minimum age, we will take
          immediate steps to delete that information. If you believe a child has provided us with personal
          information, please contact{' '}
          <a href="mailto:privacy@tradvue.com" style={{ color: '#4a9eff' }}>privacy@tradvue.com</a>.
        </p>
      </Section>

      <Section id="international" title="13. International Data Transfers">
        <p>
          <strong>13.1 Data Location.</strong> TradVue's primary data storage is located in the United States
          (via Supabase/AWS). By using the Service from outside the United States, you understand that your
          information will be transferred to and processed in the United States, which may have different data
          protection laws than your country of residence.
        </p>
        <p>
          <strong>13.2 EU/EEA Transfers.</strong> For transfers of personal data from the EU/EEA to the
          United States, we rely on Standard Contractual Clauses (SCCs) approved by the European Commission as
          a lawful transfer mechanism. Copies of applicable SCCs are available upon request at{' '}
          <a href="mailto:privacy@tradvue.com" style={{ color: '#4a9eff' }}>privacy@tradvue.com</a>.
        </p>
        <p>
          <strong>13.3 UK Transfers.</strong> For transfers from the United Kingdom, we rely on the UK
          International Data Transfer Agreement (IDTA) or UK-approved standard contractual clauses as applicable.
        </p>
      </Section>

      <Section id="dnt" title="14. Do Not Track">
        <p>We respect Do Not Track (DNT) signals. When your browser sends a Do Not Track signal, we will:</p>
        <UL items={[
          'Disable non-essential analytics tracking (Google Analytics);',
          'Continue to operate essential cookies necessary for the Service to function (authentication, security, session management).',
        ]} />
        <p>
          Note that Cloudflare's bot management cookies operate at the network level and may not be fully
          subject to DNT browser signals.
        </p>
      </Section>

      <Section id="breach" title="15. Data Breach Notification">
        <p>
          In the event of a personal data breach that is likely to result in a risk to your rights and freedoms,
          we will:
        </p>
        <UL items={[
          'GDPR: Notify the relevant supervisory authority within seventy-two (72) hours of becoming aware of the breach where required, and notify affected individuals without undue delay when the breach is likely to result in a high risk.',
          'U.S. State Laws: Notify affected individuals and state attorneys general in accordance with applicable state data breach notification laws.',
          'Notifications will be provided via email to the address associated with your account and/or via notice on our website.',
        ]} />
      </Section>

      <Section id="changes" title="16. Changes to This Privacy Policy">
        <p>
          <strong>16.1 Right to Update.</strong> We may update this Privacy Policy from time to time to reflect
          changes in our practices, the Service, or applicable law.
        </p>
        <p>
          <strong>16.2 Notice.</strong> For material changes, we will:
        </p>
        <UL items={[
          'Post the updated Policy at tradvue.com/legal/privacy with a new "Last Updated" date;',
          'Send an email notification to the address associated with your account at least thirty (30) days before the effective date.',
        ]} />
        <p>
          <strong>16.3 Continued Use.</strong> Your continued use of the Service after the effective date of a
          revised Privacy Policy constitutes your acceptance of the changes. If you do not agree to the revised
          Policy, you must stop using the Service.
        </p>
      </Section>

      <Section id="contact" title="17. Contact Information">
        <p>For questions, concerns, or requests regarding this Privacy Policy or our data practices:</p>
        <InfoBox>
          <strong>Apex Logics LLC d/b/a TradVue</strong><br />
          1935 Commerce Lane, Suite 9<br />
          Jupiter, FL 33458<br /><br />
          Privacy inquiries:{' '}
          <a href="mailto:privacy@tradvue.com" style={{ color: '#4a9eff' }}>privacy@tradvue.com</a><br />
          Legal inquiries:{' '}
          <a href="mailto:legal@tradvue.com" style={{ color: '#4a9eff' }}>legal@tradvue.com</a><br />
          Security reports:{' '}
          <a href="mailto:security@tradvue.com" style={{ color: '#4a9eff' }}>security@tradvue.com</a><br />
          Website: <a href="https://tradvue.com" style={{ color: '#4a9eff' }}>https://tradvue.com</a>
        </InfoBox>
        <p style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-2)' }}>
          For data protection inquiries (including GDPR and CCPA requests), contact:{' '}
          <a href="mailto:privacy@tradvue.com" style={{ color: '#4a9eff' }}>privacy@tradvue.com</a>.
          Response time: within 30 days for GDPR requests; within 45 days for CCPA requests.
          <br /><br />
          TradVue is a product of Apex Logics LLC.<br />
          Apex Logics LLC, FL Doc# L23000460971, DBA Reg# G26000036763, EIN 93-3771291.<br />
          Effective Date: March 16, 2026
        </p>
      </Section>

      <AcknowledgmentBox>
        By using TradVue, you acknowledge that you have read and understood this Privacy Policy and consent
        to the data practices described herein.
      </AcknowledgmentBox>

    </LegalPage>
  )
}
