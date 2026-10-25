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

export const SUPPORT_EMAIL = "support@sponsa.tech";
export const WAITLIST_URL = "https://form.typeform.com/to/YL6jeLxj";
