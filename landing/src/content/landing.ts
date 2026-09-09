export interface PlatformComparison {
  name: string;
  fee: number;
  color: string;
  tooltip?: string;
  highlight?: boolean;
}

export interface HowItWorksStep {
  number: string;
  title: string;
  description: string;
}

export interface FooterLink {
  to: string;
  label: string;
}

export interface LegalPageContent {
  title: string;
  description: string;
}

export const PLATFORM_COMPARISONS: PlatformComparison[] = [
  { name: "YouTube Super Chat", fee: 30, color: "#FF0000" },
  {
    name: "Twitch Bits",
    fee: 29,
    color: "#9146FF",
    tooltip: "Twitch takes ~29% when viewers purchase Bits",
  },
  { name: "Kick", fee: 5, color: "#53FC18" },
  { name: "Sponsa", fee: 5, color: "#DFB6B2", highlight: true },
];

export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    number: "01",
    title: "Share your link",
    description:
      "Get your unique Sponsa link and share it with your viewers during livestreams.",
  },
  {
    number: "02",
    title: "Viewers support via UPI",
    description:
      "They enter their name, choose an amount, add a message, and pay instantly with UPI.",
  },
  {
    number: "03",
    title: "Direct bank settlement",
    description:
      "Funds are routed directly to your registered bank account via standard settlement cycles — no platform holding, no withdrawal delays.",
  },
];

export const LANDING_FOOTER_LINKS: FooterLink[] = [
  { to: "/about", label: "About & Pricing" },
  { to: "/terms", label: "Terms & Conditions" },
  { to: "/privacy", label: "Privacy Policy" },
  { to: "/refund", label: "Refund & Cancellation Policy" },
  { to: "/shipping", label: "Shipping & Delivery Policy" },
  { to: "/community-guidelines", label: "Community Guidelines" },
  { to: "/contact", label: "Contact Us" },
];

export const LEGAL_PAGE_CONTENT: Record<string, LegalPageContent> = {
  "/terms": {
    title: "Terms & Conditions",
    description:
      "Terms and conditions for creators and supporters on the Sponsa platform.",
  },
  "/privacy": {
    title: "Privacy Policy",
    description:
      "Our policies concerning data collection, privacy, and account security.",
  },
  "/refund": {
    title: "Refund & Cancellation Policy",
    description:
      "Guidelines and procedures for transactions and payment processing.",
  },
  "/shipping": {
    title: "Shipping & Delivery Policy",
    description:
      "Information regarding fulfillment and electronic delivery of our Digital Services.",
  },
  "/contact": {
    title: "Contact Us",
    description:
      "Get in touch with the Sponsa team for support, partnerships, or enquiries.",
  },
  "/community-guidelines": {
    title: "Community Guidelines",
    description:
      "Rules and expectations for all members of the Sponsa community.",
  },
  "/about": {
    title: "About Sponsa — Platform & Pricing",
    description:
      "Learn about how Sponsa works, our transparent pricing, and the nature of transactions.",
  },
};

export const SUPPORT_EMAIL = "support@sponsa.tech";
export const WAITLIST_URL = "https://form.typeform.com/to/YL6jeLxj";
