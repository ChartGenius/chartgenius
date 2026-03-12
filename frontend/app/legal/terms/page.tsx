import type { Metadata } from 'next'
import { LegalPage, Section, SubSection, UL, OL, WarningBox, AcknowledgmentBox } from '../components'

export const metadata: Metadata = {
  title: 'Terms of Service — TradVue',
  description: 'Read the TradVue Terms of Service. By using our platform you agree to these terms.',
  alternates: {
    canonical: 'https://tradvue.com/legal/terms',
  },
  robots: 'noindex, follow',
}

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" lastUpdated="March 12, 2026">

      <Section id="agreement" title="1. Agreement to Terms">
        <p>
          By accessing and using the TradVue platform ("Service"), you agree to be bound by these Terms of Service.
          If you do not agree to abide by the above, please do not use this service.
        </p>
        <p>
          TradVue is operated by <strong>Apex Logics LLC</strong>, a Florida limited liability company
          ("Company," "we," "us," "our"). These Terms constitute a binding legal agreement between you
          and Apex Logics LLC.
        </p>
      </Section>

      <Section id="description" title="2. Service Description">
        <p>
          TradVue is a financial analytics and trade journaling platform that provides charting tools,
          portfolio tracking, market data, trade journaling, calculators, and watchlist management features.
          The Service is provided for <strong>informational purposes only</strong>.
        </p>
        <p>
          TradVue is <strong>NOT</strong> a registered investment advisor, broker-dealer, or financial
          planner. We are not registered with the Securities and Exchange Commission (SEC), the Financial
          Industry Regulatory Authority (FINRA), or any state securities regulator.
        </p>
      </Section>

      <WarningBox>
        <strong>⚠️ NOT FINANCIAL ADVICE — READ CAREFULLY</strong>
        <br /><br />
        <strong>TradVue does not provide financial, investment, or trading advice.</strong> All tools,
        calculators, scores, and analytics are for <strong>INFORMATIONAL PURPOSES ONLY</strong> and
        do not constitute financial advice. Nothing on TradVue constitutes:
        <ul style={{ marginTop: '12px', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <li>Investment or trading recommendations</li>
          <li>Financial or tax advice</li>
          <li>Buy or sell signals</li>
          <li>Market predictions</li>
          <li>Personalized financial guidance</li>
        </ul>
        <p style={{ marginTop: '12px' }}>
          The TradVue Score is an <strong>analytical metric only</strong> — it is NOT a buy or sell
          recommendation. It is a calculated data point and should never be the sole basis for any
          investment decision.
        </p>
        <p style={{ marginTop: '8px' }}>
          You are <strong>solely responsible</strong> for any and all trading and investment decisions
          you make. Always consult a qualified financial professional before making investment decisions.
        </p>
      </WarningBox>

      <Section id="accounts" title="3. User Accounts">
        <SubSection title="3.1 Account Creation">
          <UL items={[
            'You must provide accurate, current, and complete information when registering',
            'You are responsible for maintaining the confidentiality of your account credentials',
            'You agree not to share your login information with others',
            'You are liable for all activity on your account',
          ]} />
        </SubSection>
        <SubSection title="3.2 Eligibility">
          <UL items={[
            'You must be at least 18 years old to use this Service',
            'You must comply with all applicable laws and regulations in your jurisdiction',
            'You may not use TradVue if prohibited by law in your location',
          ]} />
        </SubSection>
        <SubSection title="3.3 Account Termination">
          <p>
            TradVue reserves the right to suspend or terminate your account at any time, with or without notice, for:
          </p>
          <UL items={[
            'Violation of these Terms of Service',
            'Illegal, fraudulent, or abusive activity',
            'Non-payment of applicable subscription fees',
            'Inactivity for an extended period (with prior notice)',
            'Any other reason at our sole discretion',
          ]} />
          <p>
            You may delete your account at any time through your account settings. Upon deletion, all
            your personal data will be removed in accordance with our Privacy Policy.
          </p>
        </SubSection>
      </Section>

      <Section id="subscription" title="4. Subscription Plans & Advertising">
        <SubSection title="4.1 Free Tier">
          <p>
            TradVue offers a free tier with access to core features. <strong>The free tier may include
            advertising</strong>, including display advertisements and sponsored content. By using the
            free tier, you consent to viewing these advertisements.
          </p>
        </SubSection>
        <SubSection title="4.2 Pro Tier">
          <p>
            TradVue Pro is a paid subscription that provides enhanced features and an
            <strong> ad-free experience</strong>. Pro subscribers will not be shown advertising during
            their active subscription period.
          </p>
        </SubSection>
        <SubSection title="4.3 Billing">
          <p>
            Pro subscription fees are billed in advance. Refunds are provided at our discretion.
            We reserve the right to change subscription pricing with 30 days notice.
          </p>
        </SubSection>
      </Section>

      <Section id="user-data" title="5. Your Data">
        <p>
          <strong>You own your data.</strong> Trade journal entries, portfolio data, and any other
          information you enter into TradVue remains yours. We do not claim ownership of user-generated content.
        </p>
        <UL items={[
          'We will not sell your personal data to third parties',
          'We will not share your data with advertisers without your consent',
          'You can export your data at any time',
          'You can delete your account and all associated data at any time',
          'We use your data only to provide, improve, and operate the Service',
        ]} />
        <p>
          See our <a href="/legal/privacy" style={{ color: '#4a9eff' }}>Privacy Policy</a> for complete
          details on data collection, use, and your rights.
        </p>
      </Section>

      <Section id="acceptable-use" title="6. Acceptable Use">
        <p>You agree <strong>NOT</strong> to:</p>
        <UL items={[
          'Use TradVue for illegal purposes or in violation of any laws',
          'Manipulate, scrape, or automatically access the Service without permission',
          'Reverse engineer, decompile, or attempt to access source code',
          'Upload malware, viruses, or harmful code',
          'Harass, abuse, or threaten other users',
          'Impersonate or misrepresent your identity',
          'Sell, transfer, or distribute access to the Service',
          'Engage in market manipulation or pump-and-dump schemes',
          'Use automated trading bots without explicit written permission',
          'Attempt to gain unauthorized access to restricted areas',
        ]} />
      </Section>

      <Section id="ip" title="7. Intellectual Property">
        <p>
          Apex Logics LLC owns all intellectual property rights to the Service, including charts, logos,
          design elements, and proprietary analysis tools. You may not reproduce, distribute, or modify
          any content without written permission.
        </p>
        <p>
          The TradVue Score algorithm, methodology, and output are proprietary intellectual property
          of Apex Logics LLC. The Score is provided as an analytical reference only.
        </p>
      </Section>

      <Section id="data-accuracy" title="8. Data Accuracy & Third-Party Sources">
        <p>
          TradVue sources market data from third-party providers. <strong>We make no warranties about
          the completeness, accuracy, or timeliness of any financial data displayed.</strong>
        </p>
        <UL items={[
          'Market data may be real-time, delayed, or inaccurate',
          'Historical data may be incomplete or contain errors',
          'Technical indicators are mathematical tools, not guarantees',
          'Data may not reflect all relevant events (splits, dividends, corporate actions)',
          'We are not responsible for errors from third-party data providers',
        ]} />
        <p>
          Always verify critical financial data with your broker or an official exchange feed before
          making any trading decision.
        </p>
      </Section>

      <Section id="liability" title="9. Limitation of Liability">
        <p><strong>TO THE MAXIMUM EXTENT PERMITTED BY LAW:</strong></p>
        <p>
          <strong>TradVue and Apex Logics LLC shall not be liable for any losses, damages, or claims
          arising from reliance on data, calculations, or analysis provided by the platform —
          including any trading losses.</strong>
        </p>
        <p>Apex Logics LLC, its owners, officers, employees, and contractors shall <strong>NOT</strong> be liable for:</p>
        <UL items={[
          'Any trading losses or investment losses, whether direct or indirect',
          'Loss of profits, revenue, or anticipated savings',
          'Loss of data or corruption of files',
          'Tax liabilities or incorrect tax reporting',
          'Any consequential, incidental, special, or punitive damages',
          'Damages arising from interruptions, delays, or unavailability of the Service',
          'Damages from third-party data providers',
          'Damages arising from use of any TradVue calculator, tool, or score',
        ]} />
        <p style={{ marginTop: '16px' }}>
          This limitation applies even if TradVue has been advised of the possibility of such damages.
          Our aggregate liability in any event shall not exceed the amount you paid us in the prior
          three months, or $50 USD, whichever is greater.
        </p>
      </Section>

      <Section id="risk" title="10. Assumption of Risk">
        <p>
          <strong>Using TradVue for any financial decision is entirely at your own risk.</strong> You acknowledge that:
        </p>
        <UL items={[
          'Trading and investing involve substantial risk of loss',
          'Futures, options, and forex trading involve particularly high risk of loss',
          'Past performance does not guarantee future results',
          'Market conditions are unpredictable',
          'You may lose some or all of your invested capital',
          'Portfolio calculations are estimates only and may not reflect actual P&L',
          'The TradVue Score is an algorithm and is not infallible',
          'Tax calculations are approximations and may not be accurate for your situation',
        ]} />
      </Section>

      <Section id="user-responsibility" title="11. User Responsibility">
        <p>
          <strong>Users are responsible for verifying all financial data and calculations independently.</strong>
        </p>
        <UL items={[
          'Verify portfolio holdings, cost basis, and valuations with your broker statements',
          'Confirm dividend payments and earnings dates through official sources',
          'Validate all tax calculations with your tax professional',
          'Review all market data through independent sources before trading',
          'Do NOT rely solely on TradVue for critical financial decisions',
          'Consult a qualified financial professional before making investment decisions',
        ]} />
      </Section>

      <Section id="modifications" title="12. Modifications to Terms">
        <p>
          Apex Logics LLC reserves the right to modify these Terms at any time. We will notify users
          of material changes via email or an in-app notice. Continued use of the Service after changes
          constitute acceptance of the updated Terms.
        </p>
      </Section>

      <Section id="law" title="13. Governing Law">
        <p>
          These Terms of Service are governed by and construed in accordance with the laws of the
          <strong> State of Florida</strong>, without regard to its conflict of law provisions.
          Any disputes arising under these Terms shall be resolved in the courts of Florida, and
          you consent to personal jurisdiction in such courts.
        </p>
      </Section>

      <Section id="contact" title="14. Contact">
        <p>
          For questions about these Terms of Service, please contact us at:{' '}
          <a href="mailto:legal@tradvue.com" style={{ color: '#4a9eff' }}>legal@tradvue.com</a>
        </p>
        <p style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-2)' }}>
          Apex Logics LLC — Florida Limited Liability Company<br />
          Effective Date: March 12, 2026
        </p>
      </Section>

      <AcknowledgmentBox>
        By using TradVue, you acknowledge that you have read, understood, and agree to be bound
        by these Terms of Service. You further acknowledge that TradVue is not a financial advisor
        and that all use of the platform is at your own risk.
      </AcknowledgmentBox>

    </LegalPage>
  )
}
