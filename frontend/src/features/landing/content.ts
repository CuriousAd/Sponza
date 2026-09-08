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
    title: "Viewers tip via UPI",
    description:
      "They enter their name, choose an amount, add a message, and pay instantly with UPI.",
  },
  {
    number: "03",
    title: "Get paid instantly",
    description:
      "Tips land in your Sponsa wallet. Withdraw to your UPI anytime you want.",
  },
];

export const LANDING_FOOTER_LINKS: FooterLink[] = [
  { to: "/terms", label: "Terms & Conditions" },
  { to: "/privacy", label: "Privacy Policy" },
  { to: "/refund", label: "Refund & Cancellation Policy" },
  { to: "/contact", label: "Contact Us" },
];

export const LEGAL_PAGE_CONTENT: Record<string, LegalPageContent> = {
  "/terms": {
    title: "Terms & Conditions",
    description:
      "Terms and conditions for creators and donors on the Sponsa platform.",
  },
  "/privacy": {
    title: "Privacy Policy",
    description:
      "Our policies concerning data collection, privacy, and account security.",
  },
  "/refund": {
    title: "Refund & Cancellation Policy",
    description:
      "Guidelines and procedures for tipping transactions and payment processing.",
  },
  "/contact": {
    title: "Contact Us",
    description:
      "Get in touch with the Sponsa team for support, partnerships, or inquiries.",
  },
};

export const SUPPORT_EMAIL = "support@sponsa.in";
export const WAITLIST_URL = "https://form.typeform.com/to/YL6jeLxj";
