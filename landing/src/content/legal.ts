// ─────────────────────────────────────────────────────────────
// Sponsa — Legal & Compliance Page Content
// All legal text is centralised here for single-source editing.
// FCRA-safe terminology used throughout:
//   • "Direct Creator Support" (not tip/donation)
//   • "Digital Interaction Fee" (not tipping fee)
//   • "Supporter" (not donor/tipper)
// ─────────────────────────────────────────────────────────────

export interface LegalSection {
  id: string;
  title: string;
  content: string[];            // paragraphs (supports inline HTML)
  subsections?: LegalSection[];
}

export interface LegalPageData {
  slug: string;                  // route path key, e.g. "/terms"
  title: string;
  subtitle: string;
  lastUpdated: string;           // ISO-style date string
  sections: LegalSection[];
}

// ═══════════════════════════════════════════════════════════════
// 1.  TERMS & CONDITIONS
// ═══════════════════════════════════════════════════════════════

export const TERMS_AND_CONDITIONS: LegalPageData = {
  slug: "/terms",
  title: "Terms & Conditions",
  subtitle:
    "Terms and conditions governing the use of the Sponsa platform for Creators and Supporters.",
  lastUpdated: "2026-09-10",
  sections: [
    /* ──────── OVERVIEW ──────── */
    {
      id: "overview",
      title: "Overview",
      content: [
        'This website is operated by <strong>Sponsa</strong>, a sole proprietorship registered under <strong>Aditya Raj Gupta</strong>. Throughout the site, the terms "we", "us" and "our" refer to Sponsa. Sponsa offers this website, including all information, tools, and services available from this site to you, the user, conditioned upon your acceptance of all terms, conditions, policies, and notices stated here.',
        'By visiting our site and/or using Sponsa, you engage in our "Service" and agree to be bound by the following terms and conditions ("Terms of Service", "Terms"). These Terms apply to all users of the site, including without limitation Creators (account holders receiving Direct Creator Support), Supporters (users sending support), browsers, vendors, customers, merchants, and/or contributors of content.',
        "Please read these Terms of Service carefully before accessing or using our website. By accessing or using any part of the site, you agree to be bound by these Terms of Service.",
      ],
    },

    /* ──────── SECTION 1 ──────── */
    {
      id: "account-registration",
      title: "Section 1 — Account Registration and Creator Obligations",
      content: [
        "By agreeing to these Terms, you represent that you are at least the age of majority in your state or province of residence.",
      ],
      subsections: [
        {
          id: "account-accuracy",
          title: "Account Accuracy",
          content: [
            "Creators are responsible for providing current, complete, and accurate information during registration. Any deviation from the provided information or submission of false details may result in the immediate termination of your account.",
          ],
        },
        {
          id: "kyc-compliance",
          title: "KYC Compliance",
          content: [
            "Creators are solely responsible for completing all Know Your Customer (KYC) requirements mandated by our payment partners through our standard onboarding verification. Failure to clear KYC may result in an inability to receive funds. Sponsa is not responsible for funds held or rejected due to KYC non-compliance.",
          ],
        },
        {
          id: "tax-responsibility",
          title: "Tax Responsibility",
          content: [
            "Creators are solely responsible for determining, collecting, and remitting any taxes (e.g., GST, Income Tax) applicable to the Direct Creator Support they receive. Sponsa does not handle tax compliance for Creators.",
          ],
        },
      ],
    },

    /* ──────── SECTION 2 ──────── */
    {
      id: "general-conditions",
      title: "Section 2 — General Conditions",
      content: [
        "We reserve the right to refuse service to anyone for any reason at any time.",
        "You understand that your content (not including credit card information) may be transferred unencrypted and involve (a) transmissions over various networks; and (b) changes to conform and adapt to technical requirements of connecting networks or devices. Credit card information is always encrypted during transfer over networks.",
        "You agree not to reproduce, duplicate, copy, sell, resell or exploit any portion of the Service, use of the Service, or access to the Service or any contact on the website through which the Service is provided, without express written permission by us.",
      ],
    },

    /* ──────── SECTION 3 ──────── */
    {
      id: "accuracy-of-information",
      title: "Section 3 — Accuracy, Completeness and Timeliness of Information",
      content: [
        "We are not responsible if information made available on this site is not accurate, complete or current. The material on this site is provided for general information only and should not be relied upon or used as the sole basis for making decisions without consulting primary, more accurate, more complete or more timely sources of information. Any reliance on the material on this site is at your own risk.",
      ],
    },

    /* ──────── SECTION 4 ──────── */
    {
      id: "modifications",
      title: "Section 4 — Modifications to the Service and Prices",
      content: [
        "Prices for using Sponsa are subject to change without notice. We reserve the right at any time to modify or discontinue the Service (or any part or content thereof) without notice at any time. We shall not be liable to you or to any third-party for any modification, price change, suspension or discontinuance of the Service.",
      ],
    },

    /* ──────── SECTION 5 ──────── */
    {
      id: "payment-authorization",
      title: "Section 5 — Payment Authorization and Fees",
      content: [],
      subsections: [
        {
          id: "payment-auth-manage",
          title: "Authorization to Manage Payments",
          content: [
            "By utilising Sponsa's Direct Settlement Architecture (facilitated via our RBI-authorized payment aggregator partner), Creators explicitly grant Sponsa the right to facilitate advanced payment routing on their behalf. All viewer payments are split at the point of ingestion — the Creator's share is routed directly to an isolated virtual vault and is never held in Sponsa's own bank account.",
          ],
        },
        {
          id: "payment-auth-fees",
          title: "Liability for Fees",
          content: [
            "Creators are liable to pay a competitive platform fee of <strong>5%</strong> for every transaction processed successfully. Standard third-party payment processing charges (~2%) are applied separately by the payment gateway based on the Supporter's chosen payment method.",
          ],
        },
        {
          id: "payment-routing-terms",
          title: "Advanced Payment Routing Terms",
          content: [
            "Creators receive funds directly via our Direct Settlement Architecture. You are subject to the standard terms and processing fees of the respective payment partners routing your transactions.",
          ],
        },
      ],
    },

    /* ──────── SECTION 6 ──────── */
    {
      id: "service-description",
      title: "Section 6 — Service Description and Nature of Purchase",
      content: [
        "Sponsa acts as a technical platform and architectural bridge for Direct Creator Support and Digital Interactions.",
      ],
      subsections: [
        {
          id: "scope-of-service",
          title: "Scope of Service",
          content: [
            "Sponsa provides the payment processing architecture and facilitates the secure data flow required to render digital services. When a user backs a Creator, they are purchasing a <strong>Digital Service</strong> consisting of the successful routing of their support and the digital processing of their interaction.",
          ],
        },
        {
          id: "proof-of-delivery",
          title: "Service Rendered (Proof of Delivery)",
          content: [
            "The Digital Service is considered legally rendered in full immediately upon the successful processing of the payment and the secure, real-time processing and display of your name and message within the Creator's Sponsa Dashboard. Sponsa is not liable or responsible for the performance of third-party broadcasting software (e.g., OBS Studio, Streamlabs), local internet connections, or external overlay tools.",
          ],
        },
      ],
    },

    /* ──────── SECTION 7 ──────── */
    {
      id: "prohibited-content",
      title: "Section 7 — Strict Prohibited Content Policy (PCP)",
      content: [
        "To ensure compliance with banking regulations and our payment partners' standards, strict content guidelines apply.",
      ],
      subsections: [
        {
          id: "prohibited-categories",
          title: "Prohibited Categories",
          content: [
            "Creators and Supporters must not use Sponsa in connection with:",
            "• Gambling, betting, or lottery services.<br/>• Adult content, pornography, or sexual services.<br/>• Hate speech, violence, or harassment.<br/>• Illegal goods, drugs, or contraband.<br/>• Any other category prohibited by standard Acceptable Use Policies of major financial institutions.",
          ],
        },
        {
          id: "prohibited-enforcement",
          title: "Enforcement",
          content: [
            "Deviation from this policy poses a regulatory risk to the entire platform. If found violating allowed content norms, we reserve the right to immediately restrict or terminate your account and withhold funds if required by law or our payment partners.",
          ],
        },
      ],
    },

    /* ──────── SECTION 8 ──────── */
    {
      id: "billing-no-refunds",
      title: "Section 8 — Billing, No Refunds, and Chargebacks",
      content: [
        "<strong>No Refunds:</strong> All transactions on Sponsa are final and non-refundable. Because the Sponsa service involves the immediate processing of funds to the Creator and the instantaneous display of your digital interaction within the Creator's secure Sponsa Dashboard, the Digital Service is considered legally rendered in full immediately upon the processing of the payment.",
        "<strong>No Chargebacks:</strong> Supporters agree that Direct Creator Support transactions and Digital Interactions are final. Any attempt to dispute a processed transaction after the Digital Service has been rendered (as defined in Section 6) is a violation of these Terms. By completing a transaction, you acknowledge that the Digital Service is rendered in full immediately and you waive any right to dispute the transaction based on \"non-delivery\" once digital delivery is confirmed by our systems.",
      ],
    },

    /* ──────── SECTION 9 ──────── */
    {
      id: "optional-tools",
      title: "Section 9 — Optional Tools",
      content: [
        'We may provide you with access to third-party tools over which we neither monitor nor have any control nor input. You acknowledge and agree that we provide access to such tools "as is" and "as available" without any warranties of any kind. We shall have no liability whatsoever arising from or relating to your use of optional third-party tools.',
      ],
    },

    /* ──────── SECTION 10 ──────── */
    {
      id: "third-party-links",
      title: "Section 10 — Third-Party Links",
      content: [
        "Certain content, products, and services available via our Service may include materials from third-parties. Third-party links on this site may direct you to third-party websites that are not affiliated with us. We are not responsible for examining or evaluating the content or accuracy and we do not warrant and will not have any liability or responsibility for any third-party materials or websites.",
      ],
    },

    /* ──────── SECTION 11 ──────── */
    {
      id: "user-submissions",
      title: "Section 11 — User Comments, Feedback and Other Submissions",
      content: [
        "If you send creative ideas, suggestions, or other materials, you agree that we may, at any time, without restriction, edit, copy, publish, and distribute them. We are and shall be under no obligation to maintain comments in confidence or pay compensation. We may, but have no obligation to, monitor, edit or remove content that we determine in our sole discretion are unlawful, offensive, threatening, libelous, defamatory, or otherwise objectionable.",
      ],
    },

    /* ──────── SECTION 12 ──────── */
    {
      id: "personal-information",
      title: "Section 12 — Personal Information",
      content: [
        "Your submission of personal information through Sponsa is governed by our Privacy Policy.",
      ],
    },

    /* ──────── SECTION 13 ──────── */
    {
      id: "errors-omissions",
      title: "Section 13 — Errors, Inaccuracies and Omissions",
      content: [
        "Occasionally there may be information on our site or in the Service that contains typographical errors, inaccuracies or omissions that may relate to service descriptions, pricing, promotions, offers, service charges, and availability. We reserve the right to correct any errors, inaccuracies or omissions, and to change or update information or cancel transactions if any information in the Service or on any related website is inaccurate at any time without prior notice.",
      ],
    },

    /* ──────── SECTION 14 ──────── */
    {
      id: "intellectual-property",
      title: "Section 14 — Intellectual Property",
      content: [],
      subsections: [
        {
          id: "creator-license",
          title: "Creator License",
          content: [
            "Creators grant us a non-exclusive license to use their branding solely for operating the Direct Creator Support page and processing Digital Interactions.",
          ],
        },
        {
          id: "platform-ownership",
          title: "Platform Ownership",
          content: [
            'Sponsa owns all rights to the website design, software, and the "Sponsa" brand.',
          ],
        },
      ],
    },

    /* ──────── SECTION 15 ──────── */
    {
      id: "fraud-prevention",
      title: "Section 15 — Fraud Prevention",
      content: [
        "Sponsa reserves the right to withhold payouts if we suspect fraudulent activity. We may cooperate with law enforcement and relevant banking authorities to investigate suspicious transactions.",
      ],
    },

    /* ──────── SECTION 16 ──────── */
    {
      id: "no-endorsement",
      title: "Section 16 — No Endorsement",
      content: [
        "Sponsa does not endorse Creator content. Supporters waive claims against Sponsa related to Creator actions.",
      ],
    },

    /* ──────── SECTION 17 ──────── */
    {
      id: "disclaimer-liability",
      title: "Section 17 — Disclaimer of Warranties; Limitation of Liability",
      content: [
        'Sponsa is provided "as is". We do not guarantee, represent or warrant that your use of our service will be uninterrupted, timely, secure or error-free.',
        "<strong>Third-Party Downtime:</strong> We are not responsible for downtimes or technical failures originating from third-party payment processors, external software providers, internet service providers, or independent broadcasting tools.",
        "In no case shall Sponsa, our directors, officers, employees, affiliates, agents, contractors, interns, suppliers, service providers or licensors be liable for any injury, loss, claim, or any direct, indirect, incidental, punitive, special, or consequential damages of any kind, including, without limitation lost profits, lost revenue, lost savings, loss of data, replacement costs, or any similar damages, whether based in contract, tort (including negligence), strict liability or otherwise, arising from your use of any of the Service or any services procured using the Service.",
      ],
    },

    /* ──────── SECTION 18 ──────── */
    {
      id: "indemnification",
      title: "Section 18 — Indemnification",
      content: [
        "You agree to indemnify, defend and hold harmless Sponsa and our parent, subsidiaries, affiliates, partners, officers, directors, agents, contractors, licensors, service providers, subcontractors, suppliers, interns and employees, harmless from any claim or demand, including reasonable attorneys' fees, made by any third-party due to or arising out of your breach of these Terms of Service or the documents they incorporate by reference, or your violation of any law or the rights of a third-party.",
      ],
    },

    /* ──────── SECTION 19 ──────── */
    {
      id: "severability",
      title: "Section 19 — Severability",
      content: [
        "In the event that any provision of these Terms of Service is determined to be unlawful, void or unenforceable, such provision shall nonetheless be enforceable to the fullest extent permitted by applicable law, and the unenforceable portion shall be deemed to be severed from these Terms of Service.",
      ],
    },

    /* ──────── SECTION 20 ──────── */
    {
      id: "termination",
      title: "Section 20 — Termination",
      content: [],
      subsections: [
        {
          id: "right-to-withdraw",
          title: "Right to Withdraw",
          content: [
            "Sponsa reserves the right to withdraw services, suspend, or terminate accounts at any time without prior notice if we believe you have violated these Terms or pose a risk to the platform.",
          ],
        },
        {
          id: "effect-of-termination",
          title: "Effect of Termination",
          content: [
            "The obligations and liabilities of the parties incurred prior to the termination date shall survive the termination of this agreement for all purposes.",
          ],
        },
      ],
    },

    /* ──────── SECTION 21 ──────── */
    {
      id: "entire-agreement",
      title: "Section 21 — Entire Agreement",
      content: [
        "The failure of us to exercise or enforce any right or provision of these Terms of Service shall not constitute a waiver of such right or provision. These Terms of Service constitute the entire agreement and understanding between you and us and govern your use of the Service, superseding any prior or contemporaneous agreements, communications and proposals.",
      ],
    },

    /* ──────── SECTION 22 ──────── */
    {
      id: "governing-law",
      title: "Section 22 — Governing Law",
      content: [
        "These Terms of Service shall be governed by and construed in accordance with the laws of India. Any disputes arising from or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts in <strong>Ranchi, Jharkhand</strong>.",
      ],
    },

    /* ──────── SECTION 23 ──────── */
    {
      id: "changes-to-terms",
      title: "Section 23 — Changes to Terms of Service",
      content: [
        "You can review the most current version of the Terms of Service at any time on this page. We reserve the right, at our sole discretion, to update, change or replace any part of these Terms of Service by posting updates and changes to our website. It is your responsibility to check our website periodically for changes. Your continued use of or access to our website or the Service following the posting of any changes to these Terms of Service constitutes acceptance of those changes.",
      ],
    },

    /* ──────── SECTION 24 ──────── */
    {
      id: "contact-information",
      title: "Section 24 — Contact Information",
      content: [
        'Questions about the Terms of Service should be sent to us at <a href="mailto:support@sponsa.tech" class="text-sponsa-100 underline underline-offset-4 hover:text-sponsa-300 transition-colors">support@sponsa.tech</a>.',
      ],
    },
  ],
};

// ═══════════════════════════════════════════════════════════════
// 2.  COMMUNITY GUIDELINES
// ═══════════════════════════════════════════════════════════════

export const COMMUNITY_GUIDELINES: LegalPageData = {
  slug: "/community-guidelines",
  title: "Community Guidelines",
  subtitle:
    "Welcome to the Sponsa Community! These guidelines ensure a positive, respectful, and legally compliant experience for everyone.",
  lastUpdated: "2026-09-10",
  sections: [
    /* ──────── INTRO ──────── */
    {
      id: "introduction",
      title: "Introduction",
      content: [
        "Sponsa is designed to help Creators connect with their audience and receive support through Direct Creator Support and personalised digital interactions. To ensure a positive, respectful, and legally compliant experience for everyone, we have established these Community Guidelines.",
        "By using Sponsa, you agree to abide by these guidelines. These rules apply to both <strong>Creators</strong> (those receiving support) and <strong>Supporters</strong> (those sending support).",
      ],
    },

    /* ──────── CORE VALUES ──────── */
    {
      id: "core-values",
      title: "Our Core Values",
      content: [
        "<strong>Respect:</strong> Treat all members of the Sponsa community with respect and courtesy.",
        "<strong>Positivity:</strong> Contribute to a positive and supportive atmosphere.",
        "<strong>Support for Creators:</strong> Use Sponsa to show genuine support for Creators and their content.",
        "<strong>Authenticity:</strong> Be genuine and avoid impersonation or misleading behaviour.",
        "<strong>Safety &amp; Compliance:</strong> Uphold the strict legal and financial standards required for a secure payment platform.",
      ],
    },

    /* ──────── RESPECTFUL COMMUNICATION ──────── */
    {
      id: "respectful-communication",
      title: "1. Respectful Communication",
      content: [
        "<strong>Be Kind and Courteous:</strong> Engage in respectful communication at all times. Avoid insults, personal attacks, and demeaning language.",
        "<strong>Constructive Feedback:</strong> If offering feedback, ensure it is constructive and aimed at helping Creators improve, rather than being disparaging or hurtful.",
      ],
    },

    /* ──────── PROHIBITED CONTENT ──────── */
    {
      id: "prohibited-content",
      title: "2. Strictly Prohibited Content (Zero Tolerance)",
      content: [
        "To comply with banking regulations and our strict financial compliance policies, the following content is <strong>strictly prohibited</strong> in messages, interactions, or Creator campaigns. Violation of these specific rules puts the entire platform at risk and will result in <strong>immediate bans</strong>.",
        "<strong>Hate Speech and Discrimination:</strong> Content that promotes hate, violence, or discrimination based on race, ethnicity, religion, gender, sexual orientation, disability, or any other protected characteristic.",
        "<strong>Adult &amp; Sexual Content:</strong> Messages or content that is pornographic, sexually explicit, obscene, or promotes sexual services.",
        "<strong>Gambling &amp; Betting:</strong> Any content related to gambling, lotteries, sports betting, or \"get rich quick\" schemes.",
        "<strong>Illegal Activities &amp; Goods:</strong> Promotion or discussion of illegal drugs, controlled substances, piracy, hacking, or contraband.",
        "<strong>Harassment and Bullying:</strong> Content intended to harass, bully, threaten, or upset others. This includes cyberbullying, stalking, and doxing.",
      ],
    },

    /* ──────── FINANCIAL INTEGRITY ──────── */
    {
      id: "financial-integrity",
      title: "3. Financial Integrity",
      content: [
        "<strong>No Chargeback Abuse:</strong> Direct Creator Support sent via Sponsa is non-refundable. Attempting to initiate a chargeback or dispute with your bank for support you knowingly sent is considered fraud and a violation of these guidelines.",
        "<strong>No Money Laundering:</strong> The platform must not be used for money laundering, self-funding with stolen cards, or moving funds for illicit purposes.",
      ],
    },

    /* ──────── PRIVACY & SAFETY ──────── */
    {
      id: "privacy-safety",
      title: "4. Privacy & Safety",
      content: [
        "<strong>Respect Personal Information:</strong> Do not share another person's private information (doxing) without their explicit consent. This includes names, addresses, phone numbers, and emails.",
        "<strong>Impersonation:</strong> Do not pretend to be someone else, including a celebrity, another Creator, or Sponsa staff.",
      ],
    },

    /* ──────── RELEVANCE ──────── */
    {
      id: "relevance-purpose",
      title: "5. Relevance and Purpose",
      content: [
        "<strong>Stay Relevant:</strong> Ensure your messages are relevant to the Creator.",
        "<strong>No Spam:</strong> Excessive posting of self-promotional material, spam, or irrelevant links is prohibited. Sponsa is for support, not unsolicited advertising.",
      ],
    },

    /* ──────── ENFORCEMENT ──────── */
    {
      id: "enforcement",
      title: "Enforcement and Consequences",
      content: [
        "We use a combination of automated filters and manual review to enforce these guidelines.",
      ],
      subsections: [
        {
          id: "message-blocking",
          title: "Message Blocking (Automated & Manual)",
          content: [
            "If a Supporter sends a message containing prohibited words or hate speech, the message will be blocked and will not appear on the Creator's Sponsa Dashboard.",
            "<strong>Important:</strong> The support amount is <strong>NOT REFUNDED</strong>. The digital service (secure processing of the transaction) is considered legally rendered even if the message was blocked due to a violation. Violating our policies does not entitle you to a refund.",
          ],
        },
        {
          id: "account-penalties",
          title: "Account Penalties",
          content: [
            "Depending on the severity of the violation, we may take the following actions:",
            "<strong>Warning:</strong> For minor first-time offences.",
            "<strong>Temporary Suspension:</strong> You will be unable to send or receive support for a set period.",
            "<strong>Permanent Ban:</strong> For severe violations (e.g., fraud, hate speech, promoting illegal goods), your account will be permanently terminated.",
          ],
        },
        {
          id: "legal-action",
          title: "Legal Action",
          content: [
            "For cases involving financial fraud (chargebacks, stolen cards) or illegal content, we reserve the right to report the user to law enforcement and relevant banking authorities.",
          ],
        },
      ],
    },

    /* ──────── REPORTING ──────── */
    {
      id: "reporting",
      title: "Reporting Violations",
      content: [
        'If you encounter content or behaviour that you believe violates these Community Guidelines, please report it to us at <a href="mailto:support@sponsa.tech" class="text-sponsa-100 underline underline-offset-4 hover:text-sponsa-300 transition-colors">support@sponsa.tech</a>. Please provide as much detail as possible, including the Transaction ID (if applicable), message content, and context.',
      ],
    },

    /* ──────── CHANGES ──────── */
    {
      id: "changes",
      title: "Changes to These Guidelines",
      content: [
        "We may update these Community Guidelines to adapt to evolving banking regulations and community needs. Significant changes will be communicated to users.",
      ],
    },

    /* ──────── CONTACT ──────── */
    {
      id: "contact",
      title: "Contact Us",
      content: [
        'Questions about these guidelines? Contact us at <a href="mailto:support@sponsa.tech" class="text-sponsa-100 underline underline-offset-4 hover:text-sponsa-300 transition-colors">support@sponsa.tech</a>.',
      ],
    },
  ],
};

// ═══════════════════════════════════════════════════════════════
// 3.  ABOUT PLATFORM & PRICING
// ═══════════════════════════════════════════════════════════════

export const ABOUT_PLATFORM: LegalPageData = {
  slug: "/about",
  title: "About Sponsa — Platform & Pricing",
  subtitle:
    "Everything you need to know about how Sponsa works, our transparent pricing, and the nature of transactions on the platform.",
  lastUpdated: "2026-09-10",
  sections: [
    /* ──────── WHAT IS SPONSA ──────── */
    {
      id: "what-is-sponsa",
      title: "What is Sponsa?",
      content: [
        "Sponsa is a <strong>Creator Monetisation Platform</strong> designed exclusively for Indian content creators, live streamers, and digital artists. We provide the technology that allows fans to send monetary support, messages, and interactions directly to creators during their live streams or on their social profiles.",
        "<strong>The Sponsa Edge:</strong> Unlike traditional platforms that pool your funds and take up to 30% in commissions, Sponsa utilises a <strong>Direct Settlement Architecture</strong>. By utilising advanced payment routing, we ensure immediate transaction processing, faster settlements, and zero platform holding periods. Your Creator share is routed to an isolated virtual vault at the point of payment — Sponsa never holds creator funds in its own bank account.",
        "<em>(Please note: To maintain a secure ecosystem, all creators must complete our standard onboarding verification process.)</em>",
      ],
    },

    /* ──────── PRICING ──────── */
    {
      id: "pricing-fees",
      title: "Pricing & Fees",
      content: [],
      subsections: [
        {
          id: "supporter-pricing",
          title: "For the Supporter",
          content: [
            "<strong>Voluntary Amount:</strong> The price you pay for one-time support is entirely voluntary. You choose the amount you wish to contribute to the Creator (e.g., ₹100, ₹500, etc.).",
            "<strong>Transparency:</strong> The total amount deducted from your account will be the exact amount you entered. Sponsa does not charge the Supporter any hidden fees unless explicitly stated on the checkout screen (e.g., specific high-cost payment methods).",
          ],
        },
        {
          id: "creator-pricing",
          title: "For the Creator",
          content: [
            "Sponsa operates on a highly transparent fee structure designed to maximise your earnings:",
            "<strong>Sponsa Platform Fee:</strong> A competitive <strong>5%</strong> platform fee per transaction. This covers the cost of maintaining our secure infrastructure, real-time stream alerts, ongoing server costs, and platform development.",
            "<strong>Payment Processing Fee:</strong> Standard third-party payment processing charges (~2%) are applied based on the Supporter's chosen payment method (e.g., UPI, Credit Card, Netbanking). These are charged directly by our third-party payment processing partner and are not controlled by Sponsa.",
            "<strong>Settlement:</strong> Through our streamlined Direct Settlement Architecture, Creators receive the net amount directly into their registered bank accounts via our payment partner's standard settlement cycles — meaning no arbitrary platform payout thresholds and no waiting for manual platform disbursements.",
          ],
        },
      ],
    },

    /* ──────── NATURE OF PURCHASE ──────── */
    {
      id: "nature-of-purchase",
      title: "Nature of the Purchase",
      content: [
        "When you use Sponsa to back a Creator, you are purchasing a <strong>Digital Service</strong>. Specifically, you are paying for:",
        "• The <strong>Direct Creator Support</strong> (financial contribution) transferred securely to the Creator via our payment partner's split-settlement architecture.<br/>• The <strong>Digital Interaction</strong> (the secure, real-time processing and display of your name and message within the Creator's Sponsa Dashboard).",
      ],
    },

    /* ──────── REFUND NOTE ──────── */
    {
      id: "refund-chargeback",
      title: "Important Note on Refunds & Chargebacks",
      content: [
        "Because the Sponsa service involves the immediate processing and routing of funds to the Creator's virtual vault and the instantaneous display of your digital interaction within the Creator's secure Sponsa Dashboard, <strong>all transactions on Sponsa are final and non-refundable</strong>.",
        "By completing a transaction, you acknowledge that the Digital Service is legally rendered in full immediately upon the processing of the payment and the successful delivery of your message to the Creator's Dashboard. You waive any right to dispute the transaction based on \"non-delivery\" once this digital delivery is confirmed by our systems.",
      ],
    },

    /* ──────── CONTACT ──────── */
    {
      id: "about-contact",
      title: "Contact Us",
      content: [
        'Questions about pricing or how Sponsa works? Contact us at <a href="mailto:support@sponsa.tech" class="text-sponsa-100 underline underline-offset-4 hover:text-sponsa-300 transition-colors">support@sponsa.tech</a>.',
      ],
    },
  ],
};

// ═══════════════════════════════════════════════════════════════
// 4.  REFUND & CANCELLATION POLICY (Standalone page)
// ═══════════════════════════════════════════════════════════════

export const REFUND_POLICY: LegalPageData = {
  slug: "/refund",
  title: "Refund & Cancellation Policy",
  subtitle:
    "Our policy on refunds, cancellations, and chargebacks for Digital Services processed through Sponsa.",
  lastUpdated: "2026-09-10",
  sections: [
    {
      id: "refund-overview",
      title: "Overview",
      content: [
        "Sponsa is a Creator Monetisation Platform that facilitates <strong>Direct Creator Support</strong> and <strong>Digital Interactions</strong> between Supporters and Creators. Each transaction on Sponsa constitutes the purchase of a Digital Service.",
      ],
    },
    {
      id: "nature-of-service",
      title: "Nature of the Digital Service",
      content: [
        "When you complete a transaction on Sponsa, you are purchasing a Digital Service that consists of:",
        "• The secure routing and processing of your financial contribution (Direct Creator Support) to the Creator's isolated virtual vault via our payment partner's split-settlement architecture.<br/>• The real-time processing and display of your name and message within the Creator's Sponsa Dashboard (Digital Interaction).",
        "This Digital Service is rendered <strong>immediately and in full</strong> upon the successful processing of the payment.",
      ],
    },
    {
      id: "no-refund-policy",
      title: "No Refund Policy",
      content: [
        "Because the Digital Service is delivered instantly and in its entirety at the time of payment processing, <strong>all transactions on Sponsa are final and non-refundable</strong>.",
        "This applies regardless of whether:",
        "• The Creator was live-streaming at the time of the transaction.<br/>• The Creator's OBS overlay or streaming software did not display the notification (Sponsa is not responsible for third-party software performance).<br/>• The Supporter's message was blocked by our automated content filters due to a violation of our Community Guidelines (the underlying Digital Service — secure processing of the transaction — is still rendered).<br/>• The Supporter changes their mind after completing the payment.",
      ],
    },
    {
      id: "no-cancellation",
      title: "Cancellation Policy",
      content: [
        "Due to the instantaneous nature of digital service delivery, transactions <strong>cannot be cancelled</strong> once payment processing has begun. Please review the Creator's page, your support amount, and your message carefully before confirming your payment.",
      ],
    },
    {
      id: "strict-no-chargeback",
      title: "Strict No-Chargeback Policy & Friendly Fraud",
      content: [
        "You agree that you will not initiate any chargeback, payment dispute, or reversal request with your bank, card issuer, or UPI payment application for any transaction processed via Sponsa once the Digital Service has been rendered.",
        "Attempting to dispute a valid, authorized transaction after your support and message have been electronically transmitted and displayed (often termed \"friendly fraud\") constitutes a material violation of our Terms of Service.",
        "In the event of an unjustified chargeback attempt, Sponsa reserves the right to:",
        "• Permanently terminate and blacklist the user from the Sponsa platform.<br/>• Provide digital delivery proof (server logs, timestamps, and transaction IDs) to banking authorities to contest the dispute.<br/>• Report abusive chargeback conduct to payment fraud prevention registries and pursue legal remedies under Indian law.",
      ],
    },
    {
      id: "accidental-transactions",
      title: "Accidental Transactions & Numerical Errors",
      content: [
        "We cannot issue cancellations or refunds for \"accidental\" transactions, mistaken contributions, or typing errors regarding the support amount (e.g., entering an extra zero).",
        "Please review your selected amount, message, and payment details carefully before authorizing the payment via your UPI app or payment method.",
      ],
    },
    {
      id: "creator-discretion",
      title: "Intermediary Role & Creator Discretion",
      content: [
        "Sponsa operates strictly as a technological intermediary facilitating Direct Creator Support and Digital Interactions. Because creator earnings are settled directly to the Creator's registered bank account via our payment partner's standard settlement cycles, Sponsa does not hold creator funds in platform custody and cannot execute refunds on behalf of any Creator.",
        "Any request for an exceptional or discretionary return of funds must be addressed directly to the Creator personally, and it remains entirely at their independent discretion whether to return funds via their own personal means outside of the Sponsa platform.",
      ],
    },
    {
      id: "exceptional-circumstances",
      title: "Exceptional Circumstances",
      content: [
        "In rare cases involving verifiable technical errors on Sponsa's end (e.g., duplicate charges caused by a system malfunction), we may, at our sole discretion, investigate and issue a refund. Such requests must be raised within 48 hours of the transaction by emailing us with the Transaction ID and a description of the issue.",
      ],
    },
    {
      id: "refund-contact",
      title: "Contact Us",
      content: [
        'For any payment-related concerns, please contact us at <a href="mailto:support@sponsa.tech" class="text-sponsa-100 underline underline-offset-4 hover:text-sponsa-300 transition-colors">support@sponsa.tech</a>.',
      ],
    },
  ],
};

// ═══════════════════════════════════════════════════════════════
// 5.  CONTACT US (Standalone page)
// ═══════════════════════════════════════════════════════════════

export const CONTACT_US: LegalPageData = {
  slug: "/contact",
  title: "Contact Us",
  subtitle:
    "Get in touch with the Sponsa team for support, partnerships, or enquiries.",
  lastUpdated: "2026-09-10",
  sections: [
    {
      id: "contact-details",
      title: "How to Reach Us",
      content: [
        '<strong>Email:</strong> <a href="mailto:support@sponsa.tech" class="text-sponsa-100 underline underline-offset-4 hover:text-sponsa-300 transition-colors">support@sponsa.tech</a>',
        "<strong>Registered Business Address:</strong><br/>Om Bhawan, Near Sundar Garden, Jamshedpur, Jharkhand, India",
        "We aim to respond to all enquiries within 24–48 business hours.",
      ],
    },
    {
      id: "support-scope",
      title: "What We Can Help With",
      content: [
        "• <strong>Payment Issues:</strong> Questions about transactions, settlement timelines, or payout failures.<br/>• <strong>Account Support:</strong> Creator account setup, KYC verification, profile management.<br/>• <strong>Technical Support:</strong> OBS overlay setup, dashboard issues, link configuration.<br/>• <strong>Policy Questions:</strong> Clarifications on our Terms of Service, Community Guidelines, or Refund Policy.<br/>• <strong>Reporting Violations:</strong> Report content or behaviour that violates our Community Guidelines.<br/>• <strong>Partnerships:</strong> Brand collaborations, creator partnerships, or business enquiries.",
      ],
    },
    {
      id: "reporting-info",
      title: "Reporting a Violation",
      content: [
        "To report a violation of our Community Guidelines or Terms of Service, please email us with the following information:",
        "• Transaction ID (if applicable).<br/>• Description of the violation or issue.<br/>• Any supporting screenshots or evidence.<br/>• Your contact information for follow-up.",
      ],
    },
    {
      id: "grievance-officer",
      title: "Grievance Officer",
      content: [
        "In accordance with the Information Technology Act, 2000 and the rules made thereunder, the Grievance Officer for the purpose of this platform is:",
        "<strong>Name:</strong> Aditya Raj Gupta<br/><strong>Email:</strong> <a href=\"mailto:support@sponsa.tech\" class=\"text-sponsa-100 underline underline-offset-4 hover:text-sponsa-300 transition-colors\">support@sponsa.tech</a><br/><strong>Address:</strong> Om Bhawan, Near Sundar Garden, Jamshedpur, Jharkhand, India",
        "The Grievance Officer shall address any discrepancies or grievances within 30 days from the date of receipt of the grievance.",
      ],
    },
  ],
};

// ═══════════════════════════════════════════════════════════════
// 6.  PRIVACY POLICY
// ═══════════════════════════════════════════════════════════════

export const PRIVACY_POLICY: LegalPageData = {
  slug: "/privacy",
  title: "Privacy Policy",
  subtitle:
    "How Sponsa collects, uses, protects, and manages your personal information.",
  lastUpdated: "2026-09-10",
  sections: [
    {
      id: "privacy-overview",
      title: "Overview",
      content: [
        "This Privacy Policy describes how Sponsa (\"we\", \"us\", \"our\") collects, uses, and protects information when you use our platform. This policy is published in compliance with the Information Technology Act, 2000, the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011, and the Digital Personal Data Protection Act, 2023.",
        "By accessing or using Sponsa, you consent to the data practices described in this policy.",
      ],
    },
    {
      id: "information-collected",
      title: "Information We Collect",
      content: [],
      subsections: [
        {
          id: "creator-info",
          title: "From Creators",
          content: [
            "• <strong>Account Information:</strong> Name, email address, and Google account details (via Google OAuth).<br/>• <strong>KYC Information:</strong> PAN card details, address proof (Aadhaar/Voter ID/DL/Passport), as required by our RBI-authorized payment partner for vendor onboarding and regulatory compliance.<br/>• <strong>Financial Information:</strong> UPI ID, bank account details for settlement processing.<br/>• <strong>Usage Data:</strong> Dashboard activity, session data, overlay configuration.",
          ],
        },
        {
          id: "supporter-info",
          title: "From Supporters",
          content: [
            "• <strong>Transaction Information:</strong> Name (as entered by the Supporter), message content, support amount.<br/>• <strong>Payment Information:</strong> Payment method selection. Note: Sponsa does not store credit card numbers, UPI PINs, or other sensitive payment credentials — these are processed directly by our RBI-authorized payment processing partner.<br/>• <strong>Device/Browser Data:</strong> IP address, browser type, and device information for security and fraud prevention.",
          ],
        },
      ],
    },
    {
      id: "consent",
      title: "Consent & Withdrawal of Consent",
      content: [
        "<strong>How We Obtain Consent:</strong> When you provide your details (such as name, message, and payment selection) to complete a transaction, we imply that you consent to our collecting and using it for that specific purpose only. If we ask for personal information for secondary purposes (e.g., service updates, creator newsletters), we will either request your express consent or provide an immediate opt-out mechanism.",
        "<strong>How to Withdraw Consent:</strong> If you change your mind after opting in, you may withdraw your consent for the continued collection, use, or disclosure of your information at any time by contacting us at <a href=\"mailto:support@sponsa.tech\" class=\"text-sponsa-100 underline underline-offset-4 hover:text-sponsa-300 transition-colors\">support@sponsa.tech</a>.",
      ],
    },
    {
      id: "how-we-use",
      title: "How We Use Your Information",
      content: [
        "• To facilitate Direct Creator Support transactions and Digital Interactions.<br/>• To process Creator KYC verification and settlements via our payment gateway partner.<br/>• To display Supporter names and messages on the Creator's Dashboard and OBS overlay.<br/>• To detect and prevent fraud, abuse, and violations of our Community Guidelines.<br/>• To communicate with you regarding your account, transactions, or policy updates.<br/>• To improve our platform, services, and user experience.",
      ],
    },
    {
      id: "data-sharing",
      title: "Information Sharing",
      content: [
        "We do not sell your personal information. We share data only in the following circumstances:",
        "• <strong>Payment Partners:</strong> Transaction and KYC data is shared with our RBI-authorized payment aggregator partner(s) for payment processing, split settlements, and payout disbursements.<br/>• <strong>Creators:</strong> Supporter name and message are displayed on the Creator's Sponsa Dashboard as part of the Digital Interaction service.<br/>• <strong>Legal Obligations:</strong> We may disclose information if required by law, court order, or government authority, or to protect the rights, property, or safety of Sponsa, our users, or the public.<br/>• <strong>Fraud Prevention:</strong> We may share information with law enforcement or banking authorities to investigate suspected fraud.",
      ],
    },
    {
      id: "data-security",
      title: "Data Security & PCI-DSS Compliance",
      content: [
        "We implement industry-standard administrative, technical, and physical security measures to safeguard your personal information, including:",
        "• HTTPS/TLS 1.3 encryption for all data in transit.<br/>• Secure token-based authentication (JWT) for creator dashboards.<br/>• HMAC-SHA256 signature verification for all payment gateway webhooks.",
        "<strong>Payment Card Security (PCI-DSS):</strong> Sponsa does not collect, process, or store sensitive card numbers, CVVs, or UPI PINs on its servers. All payment transactions are handled directly through our RBI-authorized payment partner adhering strictly to Payment Card Industry Data Security Standards (PCI-DSS) as managed by the PCI Security Standards Council (a joint effort of brands such as Visa, MasterCard, RuPay, and American Express).",
      ],
    },
    {
      id: "data-retention",
      title: "Data Retention",
      content: [
        "Transaction records are retained permanently for regulatory compliance and audit purposes. Account information is retained for as long as your account is active. If you request account deletion, we will remove your personal information within a reasonable timeframe, except where retention is required by law or for legitimate business purposes (e.g., fraud prevention, legal obligations).",
      ],
    },
    {
      id: "your-rights",
      title: "Your Rights",
      content: [
        "Under applicable Indian data protection laws (including the Digital Personal Data Protection Act, 2023), you have the right to:",
        "• Access the personal data we hold about you.<br/>• Request correction of inaccurate information.<br/>• Request deletion of your data (subject to legal retention requirements).<br/>• Withdraw consent for data processing.",
        "To exercise any of these rights, contact us at <a href=\"mailto:support@sponsa.tech\" class=\"text-sponsa-100 underline underline-offset-4 hover:text-sponsa-300 transition-colors\">support@sponsa.tech</a>.",
      ],
    },
    {
      id: "cookies",
      title: "Cookies and Tracking",
      content: [
        "Sponsa may use essential cookies for authentication and session management. We do not use third-party advertising trackers. Analytics data, if collected, is used solely to improve platform performance and user experience.",
      ],
    },
    {
      id: "age-of-consent",
      title: "Age of Consent & Protection of Minors",
      content: [
        "By accessing or using Sponsa, you represent that you are at least the age of majority in your state or province of residence (at least 18 years of age in India), or that you are of the age of majority and have given your verifiable consent to allow any of your minor dependents to use this site.",
        "In compliance with the Digital Personal Data Protection Act, 2023 (DPDP Act), Sponsa does not knowingly process personal data belonging to children without verifiable parental consent.",
      ],
    },
    {
      id: "business-transfers",
      title: "Business Transfers & Mergers",
      content: [
        "If Sponsa undergoes a business transaction such as a merger, acquisition, corporate reorganization, or sale of platform assets, user account data and transaction histories may be transferred as part of the business assets to ensure continuity of service.",
      ],
    },
    {
      id: "policy-changes",
      title: "Changes to This Policy",
      content: [
        "We may update this Privacy Policy periodically. Significant changes will be communicated through our platform. Your continued use of Sponsa after any changes constitutes acceptance of the updated policy.",
      ],
    },
    {
      id: "privacy-contact",
      title: "Contact Us",
      content: [
        "For privacy-related enquiries or to exercise your data rights, contact us at <a href=\"mailto:support@sponsa.tech\" class=\"text-sponsa-100 underline underline-offset-4 hover:text-sponsa-300 transition-colors\">support@sponsa.tech</a>.",
        "<strong>Grievance Officer:</strong><br/>Aditya Raj Gupta<br/>Email: <a href=\"mailto:support@sponsa.tech\" class=\"text-sponsa-100 underline underline-offset-4 hover:text-sponsa-300 transition-colors\">support@sponsa.tech</a><br/>Address: Om Bhawan, Near Sundar Garden, Jamshedpur, Jharkhand, India",
      ],
    },
  ],
};

// ═══════════════════════════════════════════════════════════════
// 7.  SHIPPING & DELIVERY POLICY
// ═══════════════════════════════════════════════════════════════

export const SHIPPING_POLICY: LegalPageData = {
  slug: "/shipping",
  title: "Shipping & Delivery Policy",
  subtitle:
    "Information regarding the fulfillment, electronic delivery, and instantaneous rendering of our Digital Services.",
  lastUpdated: "2026-09-10",
  sections: [
    {
      id: "nature-of-services",
      title: "1. Nature of Services",
      content: [
        "Sponsa operates exclusively as a digital creator monetisation platform. We deal strictly in <strong>digital services and intangible digital interactions</strong> (Direct Creator Support, live stream alerts, and personalized messages). No physical goods or tangible merchandise are sold, shipped, or delivered through this platform.",
      ],
    },
    {
      id: "shipping-policy",
      title: "2. Shipping Policy",
      content: [
        "As there are no physical products involved in any transaction on Sponsa, there are <strong>no shipping charges, physical delivery addresses, shipping partners, or courier delivery timelines</strong> associated with using our platform.",
        "Supporters and Creators will not receive physical packages, parcel tracking numbers, or courier dispatches.",
      ],
    },
    {
      id: "delivery-of-service",
      title: "3. Delivery of Service (Fulfillment Policy)",
      content: [
        "The \"Service\" provided by Sponsa is defined as the secure electronic routing of your financial contribution (Direct Creator Support) and the electronic transmission and real-time display of your name and message within the Creator's secure Sponsa Dashboard and live stream overlay (Digital Interaction).",
      ],
    },
    {
      id: "timeline-of-delivery",
      title: "4. Timeline of Delivery",
      content: [
        "• <strong>Immediate Automated Fulfillment:</strong> The delivery of our Digital Service is fully automated and occurs <strong>instantly upon successful payment confirmation</strong> by our payment processing partner.<br/>• <strong>On-Screen Confirmation:</strong> You will receive an immediate on-screen confirmation receipt verifying that your message and support have been successfully transmitted to the Creator, along with a unique Transaction ID.",
      ],
    },
    {
      id: "proof-of-delivery",
      title: "5. Proof of Delivery",
      content: [
        "For the purpose of transaction disputes, chargebacks, and compliance verification, the Digital Service is considered <strong>legally rendered, consumed, and delivered in full</strong> immediately upon the successful processing of the payment and the transmission of your name and message to the Creator's secure Sponsa dashboard.",
        "Sponsa maintains immutable electronic server logs containing exact timestamps, transaction reference IDs, and event delivery receipts as definitive legal proof of fulfillment.",
      ],
    },
    {
      id: "shipping-contact",
      title: "6. Technical Delivery Support",
      content: [
        'If you experience any technical delay or error in the electronic delivery of your message, please contact our support team immediately at <a href="mailto:support@sponsa.tech" class="text-sponsa-100 underline underline-offset-4 hover:text-sponsa-300 transition-colors">support@sponsa.tech</a> with your Transaction ID.',
      ],
    },
  ],
};

// ═══════════════════════════════════════════════════════════════
// CONTENT REGISTRY  — maps route paths → page data
// ═══════════════════════════════════════════════════════════════

export const LEGAL_CONTENT_REGISTRY: Record<string, LegalPageData> = {
  "/terms": TERMS_AND_CONDITIONS,
  "/community-guidelines": COMMUNITY_GUIDELINES,
  "/about": ABOUT_PLATFORM,
  "/refund": REFUND_POLICY,
  "/shipping": SHIPPING_POLICY,
  "/contact": CONTACT_US,
  "/privacy": PRIVACY_POLICY,
};
