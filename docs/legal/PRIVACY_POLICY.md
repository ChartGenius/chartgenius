# Privacy Policy

**TradVue** — *TradVue is a product of Apex Logics LLC*
**Last Updated: March 16, 2026**

---

## 1. Introduction

This Privacy Policy explains how Apex Logics LLC, a Florida limited liability company doing business as TradVue ("TradVue," "we," "us," or "our"), collects, uses, stores, shares, and protects information about you when you use the TradVue platform at tradvue.com and any associated applications (collectively, the "Service").

TradVue is committed to protecting your privacy and handling your personal information with transparency and care. Please read this Policy carefully. By creating an account or using the Service, you agree to the collection and use of your information as described in this Privacy Policy.

This Privacy Policy is incorporated into and forms part of our [Terms of Service](https://tradvue.com/legal/terms). Capitalized terms not defined herein have the meaning given to them in the Terms of Service.

**For data protection inquiries, contact us at:** privacy@tradvue.com

---

## 2. Information We Collect

We collect the following categories of information:

### 2.1 Account Information

When you register for TradVue, we collect:

- **Full name** — to personalize your account.
- **Email address** — for account authentication, transactional communications, and support.
- **Password** — stored as a one-way cryptographic hash using bcrypt via Supabase Auth. We never store, access, or transmit your plaintext password.

### 2.2 Trading Data

The core content you create and store in TradVue, including:

- Trade records (instrument, date, price, quantity, direction, entry/exit times, profit/loss)
- Journal entries and trade notes
- Tags and custom trade labels
- Portfolio holdings and position snapshots
- Historical transaction data
- Playbook entries (strategy templates)
- Post-Trade Ritual responses

**This data belongs to you.** See Section 9 (Your Rights and Choices) for export and deletion options.

### 2.3 Market Data Preferences

- Watchlists and instruments you track
- Price alert configurations
- Dashboard layout and settings preferences

### 2.4 Usage Data

When you use the Service, we automatically collect:

- **IP address** — for security, fraud prevention, and abuse detection.
- **Device type and operating system** — for compatibility and support.
- **Browser type and version** — for compatibility.
- **Pages and features visited** — to understand how the Service is used.
- **Feature interaction data** — which features you use, how often, and for how long.
- **Referral URLs** — how you arrived at the Service.
- **Error logs** — to diagnose and fix technical issues.

### 2.5 Payment Information

All payment processing is handled exclusively by **Stripe, Inc.** ("Stripe"), a PCI DSS Level 1-certified payment processor. TradVue:

- Does **not** collect, store, or process your credit card numbers, bank account numbers, or other payment card data.
- May retain records of subscription tier, billing dates, and transaction status for account management purposes.
- May receive from Stripe a tokenized payment method identifier (not the card number itself) for managing recurring subscriptions.

### 2.6 Broker Sync Data (Future Feature)

If and when TradVue offers automated broker synchronization, and you choose to connect a brokerage account:

- We will collect trade history, account balances, and position data from connected brokerages through our third-party aggregator.
- Connecting a brokerage account is entirely voluntary.
- Your brokerage credentials are never stored by TradVue; they are processed directly by the aggregation service under that service's terms and privacy policy.

### 2.7 Communications

If you contact TradVue support or send us an email, we retain the content of your communications to respond to you and improve our support.

---

## 3. How We Use Your Information

We use the information we collect for the following purposes:

**3.1 Service Delivery.** To provide, operate, and maintain the TradVue platform; to process your trades, journal entries, and analytics; to deliver the features described in our Terms of Service.

**3.2 AI Coach Features.** When you use AI Coach, relevant trade data and journal entries are transmitted to OpenAI's API for processing and analysis. See Section 5.10 (OpenAI and AI Coach) for important details.

**3.3 Account Management.** To create and manage your account, process subscriptions and billing (via Stripe), and send transactional communications such as billing receipts, password resets, and subscription notices.

**3.4 Customer Support.** To respond to your questions, troubleshoot issues, and provide technical support.

**3.5 Service Improvement.** To analyze aggregate usage patterns, understand how features are used, and improve the Service. We use Google Analytics (GA4) for this purpose.

**3.6 Security and Fraud Prevention.** To detect, investigate, and prevent fraudulent transactions, abuse, security breaches, and other potentially illegal activity.

**3.7 Legal Compliance.** To comply with applicable laws, regulations, court orders, and legal process; to enforce our Terms of Service and other agreements.

**3.8 Communications.** To send you service-related notices (including changes to our Terms or Privacy Policy) and, where you have opted in, product updates or newsletters. You may opt out of marketing communications at any time.

**3.9 Aggregated Analytics.** To generate aggregated, de-identified, and anonymized statistics about platform usage. This aggregated data does not identify individual users and may be used or shared without restriction.

---

## 4. Legal Bases for Processing (GDPR)

If you are located in the European Economic Area (EEA) or United Kingdom, we process your personal data under the following legal bases under the General Data Protection Regulation (GDPR):

| Purpose | Legal Basis |
|---|---|
| Providing the Service | Performance of a contract (Art. 6(1)(b)) |
| Account management and billing | Performance of a contract (Art. 6(1)(b)) |
| Analytics and improvement | Legitimate interests (Art. 6(1)(f)) |
| Marketing (opt-in only) | Consent (Art. 6(1)(a)) |
| Security and fraud prevention | Legitimate interests (Art. 6(1)(f)) |
| Legal compliance | Legal obligation (Art. 6(1)(c)) |
| AI Coach processing | Consent (Art. 6(1)(a)) — you may opt out of AI Coach at any time |

---

## 5. Third-Party Service Providers

We share your information with the following categories of third-party service providers who process data on our behalf. These providers are contractually obligated to protect your data and process it only as directed by TradVue:

### 5.1 Render (Backend Hosting)
Our backend application and API servers are hosted on Render. Your data transits through and is processed on Render's infrastructure.
- Website: render.com

### 5.2 Vercel (Frontend Hosting)
Our web application frontend is hosted on Vercel. Vercel may log access data (IP address, request metadata) in the ordinary course of providing hosting services.
- Website: vercel.com

### 5.3 Supabase / Amazon Web Services (Database)
Your account data and trade records are stored in a PostgreSQL database hosted by Supabase, which runs on Amazon Web Services (AWS). Data is encrypted at rest and protected by Row Level Security (RLS) policies. Data is stored in the United States.
- Website: supabase.com | aws.amazon.com

### 5.4 Cloudflare (CDN and Security)
All traffic to TradVue passes through Cloudflare's network, which provides content delivery, DDoS protection, bot management, and Web Application Firewall (WAF) services. Cloudflare processes connection metadata including IP addresses.
- Website: cloudflare.com

### 5.5 Stripe (Payment Processing)
Subscription payments are processed exclusively by Stripe. Stripe is PCI DSS Level 1 certified. TradVue never handles your raw payment card data. Stripe's privacy policy governs the data it collects in connection with payment processing.
- Website: stripe.com | Privacy Policy: stripe.com/privacy

### 5.6 Resend (Transactional Email)
Transactional emails (account verification, password reset, billing notices) are delivered through Resend's email delivery service. Resend processes your email address and message content for delivery purposes.
- Website: resend.com

### 5.7 Google Analytics (GA4) (Usage Analytics)
We use Google Analytics 4 to analyze how users interact with the Service. Google Analytics collects usage data through cookies and similar technologies. You can opt out of Google Analytics using the [Google Analytics Opt-Out Browser Add-On](https://tools.google.com/dlpage/gaoptout) or by enabling Do Not Track (see Section 13).
- Website: analytics.google.com | Privacy Policy: policies.google.com/privacy

### 5.8 Alpaca Markets, Marketaux, Finnhub (Market Data)
These providers supply market data (price quotes, historical data, financial news) displayed on the TradVue platform. We do not share your personal trade data with these providers. They may receive information such as IP addresses in the course of serving data requests.
- alpaca.markets | marketaux.com | finnhub.io

### 5.9 SnapTrade (Broker Aggregation — Future Feature)
If and when TradVue enables broker account synchronization, we intend to use SnapTrade as our broker aggregation provider. SnapTrade would process data from your connected brokerage accounts in accordance with SnapTrade's privacy policy. This feature is not yet active. We will update this Policy before enabling it.
- Website: snaptrade.com

### 5.10 OpenAI (AI Coach Feature)

> **IMPORTANT — AI COACH DATA PROCESSING:**
>
> When you use the AI Coach feature, your trade data (including trade records, journal entries, and notes that you submit for analysis) is transmitted to **OpenAI's API** for processing. OpenAI's API is used to generate analytical insights about your trading patterns.
>
> **Key disclosures:**
> - Your trade data may be sent to OpenAI's servers for processing.
> - According to OpenAI's API usage policies, data sent through the API is **not used to train OpenAI's models** and is not retained beyond the processing of each request (subject to OpenAI's current terms and policies).
> - OpenAI's [Privacy Policy](https://openai.com/privacy) and [API Usage Policies](https://openai.com/policies/usage-policies) govern OpenAI's handling of data received through the API.
> - TradVue is responsible for the data we transmit to OpenAI; we transmit only data relevant to the analysis you request.
> - **You can opt out of AI Coach features at any time** through your account settings. If you disable AI Coach, your trade data will not be sent to OpenAI.

---

## 6. Cookies and Tracking Technologies

We use cookies and similar tracking technologies. For details, please see our [Cookie Policy](https://tradvue.com/legal/cookies).

---

## 7. Data Security

We implement commercially reasonable administrative, technical, and organizational security measures designed to protect your personal information, including:

- **Encryption in Transit:** All data transmitted between your browser and TradVue is encrypted using TLS (Transport Layer Security).
- **Encryption at Rest:** Your data stored in Supabase/AWS is encrypted at rest.
- **Password Hashing:** Passwords are hashed using bcrypt via Supabase Auth. We never store plaintext passwords or have access to your password.
- **Row Level Security (RLS):** Supabase RLS policies ensure that users can only access their own data at the database level.
- **Rate Limiting:** API rate limiting is enforced to prevent abuse and credential stuffing attacks.
- **Cloudflare WAF:** A Web Application Firewall (WAF) is deployed at the network edge to detect and block malicious traffic.
- **Security Audits:** We conduct periodic security reviews of our infrastructure and code.

**No system is completely secure.** While we take reasonable precautions, we cannot guarantee absolute security. Please use a strong, unique password for your TradVue account and enable two-factor authentication when available.

These measures represent commercially reasonable efforts and are not a guarantee against all security threats. No method of electronic storage or transmission over the Internet is 100% secure.

---

## 8. Data Retention

| Data Category | Retention Period |
|---|---|
| Account and trading data (active account) | Retained while account is active |
| Account and trading data (after deletion) | Removed from active systems within 90 days |
| Encrypted backup copies | Purged within 90 additional days after account deletion |
| Usage and access logs | Up to 12 months |
| Payment records | As required by applicable tax and financial law |
| Cookies | Per Cookie Policy |
| Aggregated/anonymized analytics | Indefinitely (not linked to individuals) |

**Important:** We do not guarantee permanent retention of your data. You are responsible for maintaining your own backups. See Section 9 for how to export your data.

We may retain data for longer periods where required by applicable law or for the establishment, exercise, or defense of legal claims.

---

## 9. Your Rights and Choices

### 9.1 Access and Portability
You have the right to access the personal information we hold about you. You may export your trade data at any time through the data export feature in your account settings. To request a copy of your personal account information, contact privacy@tradvue.com.

### 9.2 Correction
You may update your account information (name, email) directly in your account settings. For other corrections, contact privacy@tradvue.com.

### 9.3 Deletion
You may delete your account at any time through your account settings or by contacting privacy@tradvue.com. See Section 8 for retention timelines after deletion.

### 9.4 Opt-Out of Marketing
You may opt out of marketing or promotional emails at any time by clicking the unsubscribe link in any marketing email or by contacting support@tradvue.com. You will continue to receive transactional emails (e.g., billing receipts, password resets) as necessary to provide the Service.

### 9.5 AI Coach Opt-Out
You may disable AI Coach features in your account settings. Disabling AI Coach will prevent your trade data from being sent to OpenAI.

### 9.6 Cookie Management
You may manage cookie preferences through your browser settings or our cookie consent tool. See our [Cookie Policy](https://tradvue.com/legal/cookies) for details.

---

## 10. Rights for EU/EEA Users (GDPR)

If you are located in the European Economic Area, United Kingdom, or Switzerland, you have the following rights under the GDPR and applicable data protection laws:

- **Right of Access:** Request a copy of your personal data.
- **Right of Rectification:** Request correction of inaccurate or incomplete data.
- **Right to Erasure ("Right to be Forgotten"):** Request deletion of your personal data, subject to legal obligations and legitimate interests.
- **Right to Data Portability:** Receive your data in a structured, commonly used, machine-readable format and transmit it to another controller.
- **Right to Restrict Processing:** Request that we limit the processing of your data in certain circumstances.
- **Right to Object:** Object to processing based on legitimate interests or for direct marketing purposes.
- **Right to Withdraw Consent:** Where we process data based on your consent, you may withdraw consent at any time without affecting the lawfulness of processing prior to withdrawal.
- **Right to Lodge a Complaint:** You have the right to lodge a complaint with your local supervisory authority (e.g., your national data protection authority).

**To exercise your GDPR rights, contact:** privacy@tradvue.com

We will respond to verified GDPR rights requests within thirty (30) days, or as required by applicable law. We may request identity verification before processing rights requests.

For data protection inquiries, contact: privacy@tradvue.com

---

## 11. Rights for California Residents (CCPA/CPRA)

If you are a California resident, you have the following rights under the California Consumer Privacy Act ("CCPA") as amended by the California Privacy Rights Act ("CPRA"):

**11.1 Right to Know.** You have the right to request disclosure of: (a) the categories of personal information we collect; (b) the sources from which we collect it; (c) our business or commercial purpose for collecting it; (d) the categories of third parties with whom we share it; and (e) the specific pieces of personal information we hold about you.

**11.2 Right to Delete.** You have the right to request deletion of personal information we have collected from you, subject to certain exceptions.

**11.3 Right to Correct.** You have the right to request correction of inaccurate personal information.

**11.4 Right to Opt-Out of Sale or Sharing.** TradVue does **not** sell your personal information to third parties for monetary or other valuable consideration. TradVue does **not** share your personal information for cross-context behavioral advertising purposes.

**11.5 Right to Non-Discrimination.** We will not discriminate against you for exercising any CCPA rights. We will not deny you goods or services, charge different prices, or provide a different level of service because you exercised a CCPA right.

**11.6 Shine the Light.** California residents may request information about disclosure of personal information to third parties for direct marketing purposes. We do not share personal information for third-party direct marketing purposes.

**To exercise your CCPA rights, contact:** privacy@tradvue.com
We will respond to verified CCPA requests within forty-five (45) days. You may designate an authorized agent to submit requests on your behalf.

---

## 12. Children's Privacy

**12.1 Not Directed to Children.** TradVue is not directed to individuals under the age of 18. We do not knowingly collect personal information from anyone under 18 years of age.

**12.2 COPPA Compliance.** TradVue complies with the Children's Online Privacy Protection Act (COPPA). We do not knowingly collect personal information from children under 13.

**12.3 GDPR — Under 16.** In jurisdictions covered by GDPR where the age of digital consent is 16, we do not process the personal data of individuals under 16 without verifiable parental or guardian consent.

**12.4 Deletion of Children's Data.** If we become aware that we have inadvertently collected personal information from an individual under the applicable minimum age, we will take immediate steps to delete that information. If you believe a child has provided us with personal information, please contact privacy@tradvue.com.

---

## 13. International Data Transfers

**13.1 Data Location.** TradVue's primary data storage is located in the United States (via Supabase/AWS). By using the Service from outside the United States, you understand that your information will be transferred to and processed in the United States, which may have different data protection laws than your country of residence.

**13.2 EU/EEA Transfers.** For transfers of personal data from the EU/EEA to the United States, we rely on Standard Contractual Clauses (SCCs) approved by the European Commission as a lawful transfer mechanism. Copies of applicable SCCs are available upon request at privacy@tradvue.com.

**13.3 UK Transfers.** For transfers from the United Kingdom, we rely on the UK International Data Transfer Agreement (IDTA) or UK-approved standard contractual clauses as applicable.

---

## 14. Do Not Track

We respect Do Not Track (DNT) signals. When your browser sends a Do Not Track signal, we will:

- Disable non-essential analytics tracking (Google Analytics);
- Continue to operate essential cookies necessary for the Service to function (authentication, security, session management).

Note that Cloudflare's bot management cookies operate at the network level and may not be fully subject to DNT browser signals.

---

## 15. Data Breach Notification

In the event of a personal data breach that is likely to result in a risk to your rights and freedoms, we will:

- **GDPR:** Notify the relevant supervisory authority within seventy-two (72) hours of becoming aware of the breach where required, and notify affected individuals without undue delay when the breach is likely to result in a high risk.
- **U.S. State Laws:** Notify affected individuals and state attorneys general in accordance with applicable state data breach notification laws.
- Notifications will be provided via email to the address associated with your account and/or via notice on our website.

---

## 16. Changes to This Privacy Policy

**16.1 Right to Update.** We may update this Privacy Policy from time to time to reflect changes in our practices, the Service, or applicable law.

**16.2 Notice.** For material changes, we will:

- Post the updated Policy at tradvue.com/legal/privacy with a new "Last Updated" date;
- Send an email notification to the address associated with your account at least thirty (30) days before the effective date.

**16.3 Continued Use.** Your continued use of the Service after the effective date of a revised Privacy Policy constitutes your acceptance of the changes. If you do not agree to the revised Policy, you must stop using the Service.

---

## 17. Contact Information

For questions, concerns, or requests regarding this Privacy Policy or our data practices:

**Apex Logics LLC d/b/a TradVue**
1935 Commerce Lane, Suite 9
Jupiter, FL 33458

- **Privacy inquiries:** privacy@tradvue.com
- **Legal inquiries:** legal@tradvue.com
- **Security reports:** security@tradvue.com
- **Website:** https://tradvue.com

*For data protection inquiries (including GDPR and CCPA requests), contact: privacy@tradvue.com. Response time: within 30 days for GDPR requests; within 45 days for CCPA requests.*

---

*TradVue is a product of Apex Logics LLC. Apex Logics LLC, FL Doc# L23000460971, DBA Reg# G26000036763, EIN 93-3771291.*
