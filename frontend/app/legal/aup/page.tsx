import type { Metadata } from 'next'
import { LegalPage, Section, SubSection, UL, WarningBox, InfoBox, AcknowledgmentBox } from '../components'

export const metadata: Metadata = {
  title: 'Acceptable Use Policy — TradVue',
  description: 'TradVue Acceptable Use Policy. Understand what is and is not permitted when using the TradVue platform.',
  alternates: {
    canonical: 'https://tradvue.com/legal/aup',
  },
  robots: 'noindex, follow',
}

export default function AUPPage() {
  return (
    <LegalPage title="Acceptable Use Policy" lastUpdated="March 16, 2026">

      <Section id="intro" title="1. Introduction and Purpose">
        <p>
          This Acceptable Use Policy ("AUP") governs how you may and may not use the TradVue platform,
          including all features, APIs, content, and associated services (collectively, the "Service").
          This AUP is incorporated by reference into TradVue's{' '}
          <a href="/legal/terms" style={{ color: '#4a9eff' }}>Terms of Service</a> and forms part of the
          binding agreement between you and Apex Logics LLC ("TradVue").
        </p>
        <p>
          By using the Service, you agree to comply with this AUP. Violation of this AUP may result in
          suspension or termination of your account, legal action, and/or reporting to law enforcement or
          regulatory authorities.
        </p>
      </Section>

      <Section id="prohibited" title="2. Prohibited Activities">

        <SubSection title="2.1 Illegal and Fraudulent Activities">
          <p>You may not use TradVue to:</p>
          <UL items={[
            'Engage in, facilitate, or support any activity that violates applicable federal, state, local, or international law or regulation;',
            'Engage in market manipulation of any kind, including but not limited to: wash trading, spoofing, layering, painting the tape, coordinated pump-and-dump schemes, or any other conduct prohibited under the Securities Exchange Act of 1934, CFTC regulations, or applicable securities laws;',
            'Engage in or facilitate securities fraud, including but not limited to: making materially false or misleading statements about any security, fraudulent schemes involving the purchase or sale of securities, or violations of SEC Rule 10b-5;',
            'Trade on material non-public information ("insider trading") or facilitate or assist others in doing so, in violation of the Securities Exchange Act of 1934 and related regulations;',
            'Engage in front-running, layering, or any other trading practice that constitutes a violation of applicable market integrity rules;',
            'Launder money, finance terrorism, or engage in or facilitate any other illegal financial activity;',
            'Violate any applicable anti-money laundering (AML) or know-your-customer (KYC) regulations.',
          ]} />
        </SubSection>

        <SubSection title="2.2 Unauthorized Access and Technical Abuse">
          <p>You may not:</p>
          <UL items={[
            'Scrape, crawl, spider, or otherwise automatically extract data from the Service using bots, scripts, automated tools, or any means not expressly authorized in writing by TradVue;',
            'Reverse engineer, decompile, disassemble, or attempt to derive the source code, algorithms, or trade secrets of any part of the Service;',
            'Probe, scan, or test the vulnerability of any TradVue system, network, or infrastructure without prior written authorization from TradVue;',
            'Circumvent, defeat, or disable any security, authentication, access control, or rate-limiting feature of the Service;',
            'Access the Service using any automated means, script, or program (including bots, crawlers, or data mining tools) except through TradVue\'s officially published APIs and subject to TradVue\'s API terms;',
            'Attempt to gain unauthorized access to any TradVue system, database, server, network, or account;',
            'Introduce, transmit, or distribute malware, viruses, trojan horses, ransomware, worms, spyware, or any other harmful, disruptive, or malicious code;',
            'Conduct or participate in a denial-of-service (DoS) or distributed denial-of-service (DDoS) attack against TradVue or its infrastructure;',
            'Perform SQL injection, cross-site scripting (XSS), or any other form of code injection or exploit against the Service;',
            'Interfere with, degrade, or disrupt the performance, availability, or integrity of the Service for any other user.',
          ]} />
        </SubSection>

        <SubSection title="2.3 Account Abuse">
          <p>You may not:</p>
          <UL items={[
            'Share, sell, rent, or transfer your account credentials to any other person or entity;',
            'Allow multiple individuals to use a single account (each account is for a single individual user only);',
            'Create multiple accounts for the purpose of: circumventing the free trial limitations; evading a suspension or ban; accessing features above your subscribed tier; or any other purpose designed to circumvent TradVue\'s policies;',
            'Impersonate any person or entity, or misrepresent your identity or affiliation with any person or entity;',
            'Use a false or misleading email address or other registration information.',
          ]} />
        </SubSection>

        <SubSection title="2.4 AI Coach Misuse">
          <p>You may not use the AI Coach feature to:</p>
          <UL items={[
            'Generate, create, publish, sell, or distribute trading signals, alerts, or purported investment recommendations to third parties, regardless of whether such outputs are attributed to AI Coach or presented as original analysis;',
            'Represent or imply to third parties that AI Coach outputs constitute professional financial advice, investment advice, or recommendations of a registered investment adviser;',
            'Use AI Coach outputs to operate or contribute to a paid investment advisory service, newsletter, or signal service without full disclosure that the analysis is generated by an AI tool and is not regulated financial advice;',
            'Exploit AI Coach to circumvent or deceive regulatory requirements applicable to investment advisory services;',
            'Attempt to manipulate, deceive, or "jailbreak" AI Coach by providing false data or prompts designed to produce misleading outputs;',
            'Use AI Coach outputs as the sole basis for, or as marketing material to encourage others to execute, any securities transaction.',
          ]} />
        </SubSection>

        <SubSection title="2.5 Spam and Unsolicited Communications">
          <p>You may not use the Service or any TradVue communication feature to:</p>
          <UL items={[
            'Send unsolicited commercial messages, spam, or bulk communications to other users or to third parties;',
            'Harvest, collect, or compile email addresses or other contact information of other TradVue users;',
            'Send communications that are deceptive, misleading, or contain false sender information.',
          ]} />
        </SubSection>

        <SubSection title="2.6 Intellectual Property Violations">
          <p>You may not:</p>
          <UL items={[
            'Copy, reproduce, modify, distribute, publicly display, or create derivative works of TradVue\'s software, content, or user interface without express written permission;',
            'Remove, alter, or obscure any proprietary notices, trademarks, or copyright notices;',
            'Frame or mirror any portion of the Service without TradVue\'s prior written consent.',
          ]} />
        </SubSection>

        <SubSection title="2.7 Harmful or Offensive Content">
          <p>You may not upload, store, or transmit content that:</p>
          <UL items={[
            'Is unlawful, defamatory, obscene, abusive, threatening, harassing, or discriminatory;',
            'Infringes any third party\'s intellectual property, privacy, or other rights;',
            'Contains personally identifiable information of third parties without their consent.',
          ]} />
        </SubSection>
      </Section>

      <Section id="api" title="3. API Use and Rate Limiting">
        <p>
          <strong>3.1 API Access.</strong> If TradVue provides API access (currently or in the future), such
          access is subject to TradVue's API Terms (to be published separately). API access does not authorize
          bulk data extraction or automated scraping of TradVue platform data.
        </p>
        <p>
          <strong>3.2 Rate Limits.</strong> TradVue enforces rate limits on API requests and platform
          interactions to protect system stability and ensure fair access for all users. You agree to:
        </p>
        <UL items={[
          'Respect all rate limits imposed by TradVue;',
          'Not attempt to circumvent rate limiting through multiple accounts, IP rotation, or any other means;',
          'Contact support@tradvue.com if you have a legitimate need for elevated API access.',
        ]} />
        <p>
          <strong>3.3 Fair Use.</strong> Automated or programmatic access to the Service must not degrade
          performance for other users. TradVue reserves the right to throttle, restrict, or terminate access
          that places unreasonable load on the platform.
        </p>
      </Section>

      <Section id="reporting" title="4. Reporting Violations">
        <p>
          If you become aware of any violation of this AUP — including but not limited to suspected account
          abuse, security vulnerabilities, market manipulation facilitated through the platform, or misuse of
          AI Coach — please report it promptly:
        </p>
        <InfoBox>
          <strong>Security issues / vulnerabilities:</strong>{' '}
          <a href="mailto:security@tradvue.com" style={{ color: '#4a9eff' }}>security@tradvue.com</a><br />
          <strong>Legal / compliance / policy violations:</strong>{' '}
          <a href="mailto:legal@tradvue.com" style={{ color: '#4a9eff' }}>legal@tradvue.com</a><br />
          <strong>General support:</strong>{' '}
          <a href="mailto:support@tradvue.com" style={{ color: '#4a9eff' }}>support@tradvue.com</a>
        </InfoBox>
        <p>
          We take all reports seriously and will investigate promptly. TradVue does not retaliate against
          good-faith reporters.
        </p>
      </Section>

      <Section id="consequences" title="5. Consequences of Violation">
        <p>
          <strong>5.1 Investigation.</strong> TradVue reserves the right to investigate suspected violations
          of this AUP at any time.
        </p>
        <p>
          <strong>5.2 Suspension.</strong> TradVue may temporarily suspend your account, with or without
          prior notice, during an active investigation of a suspected AUP violation, or where suspension is
          necessary to protect the platform, other users, or third parties.
        </p>
        <p>
          <strong>5.3 Termination.</strong> TradVue may permanently terminate your account for confirmed
          violations of this AUP. Termination does not entitle you to any refund except as expressly provided
          in our{' '}
          <a href="/legal/terms" style={{ color: '#4a9eff' }}>Terms of Service</a>.
        </p>
        <p>
          <strong>5.4 Legal Action.</strong> Violations of this AUP may constitute violations of applicable
          law. TradVue reserves the right to:
        </p>
        <UL items={[
          'Pursue civil claims for damages;',
          'Seek injunctive or other equitable relief;',
          'Report violations to appropriate law enforcement agencies, securities regulators (including the SEC, FINRA, CFTC), or other government bodies.',
        ]} />
        <p>
          <strong>5.5 Cooperation with Authorities.</strong> TradVue will cooperate fully with law enforcement
          investigations and regulatory inquiries. User data may be disclosed in response to valid legal
          process. See our{' '}
          <a href="/legal/privacy" style={{ color: '#4a9eff' }}>Privacy Policy</a> for details.
        </p>
      </Section>

      <Section id="modifications" title="6. Modifications to This AUP">
        <p>
          TradVue may modify this AUP in accordance with the modification procedures described in our{' '}
          <a href="/legal/terms" style={{ color: '#4a9eff' }}>Terms of Service</a>. Material changes will be
          communicated with at least thirty (30) days' notice. Your continued use of the Service after the
          effective date of any modification constitutes acceptance of the updated AUP.
        </p>
      </Section>

      <Section id="contact" title="7. Contact">
        <p>For AUP-related inquiries:</p>
        <InfoBox>
          <strong>Apex Logics LLC d/b/a TradVue</strong><br />
          1935 Commerce Lane, Suite 9<br />
          Jupiter, FL 33458<br /><br />
          Legal / Compliance:{' '}
          <a href="mailto:legal@tradvue.com" style={{ color: '#4a9eff' }}>legal@tradvue.com</a><br />
          Security:{' '}
          <a href="mailto:security@tradvue.com" style={{ color: '#4a9eff' }}>security@tradvue.com</a><br />
          Support:{' '}
          <a href="mailto:support@tradvue.com" style={{ color: '#4a9eff' }}>support@tradvue.com</a><br />
          Website: <a href="https://tradvue.com" style={{ color: '#4a9eff' }}>https://tradvue.com</a>
        </InfoBox>
        <p style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-2)' }}>
          TradVue is a product of Apex Logics LLC.<br />
          Apex Logics LLC, FL Doc# L23000460971, DBA Reg# G26000036763.<br />
          Effective Date: March 16, 2026
        </p>
      </Section>

      <AcknowledgmentBox>
        By using TradVue, you agree to comply with this Acceptable Use Policy. Violations may result in
        immediate account suspension or termination and potential legal action. If you have questions about
        what is permitted, contact{' '}
        <a href="mailto:legal@tradvue.com" style={{ color: '#4a9eff' }}>legal@tradvue.com</a>{' '}
        before proceeding.
      </AcknowledgmentBox>

    </LegalPage>
  )
}
