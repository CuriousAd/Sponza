import { Link, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface LegalPageProps {
  title?: string;
}

export default function LegalPage({ title }: LegalPageProps) {
  const location = useLocation();

  const getPageDetails = () => {
    switch (location.pathname) {
      case "/terms":
        return {
          title: "Terms & Conditions",
          description: "Terms and conditions for creators and donors on the Sponza platform.",
        };
      case "/privacy":
        return {
          title: "Privacy Policy",
          description: "Our policies concerning data collection, privacy, and account security.",
        };
      case "/refund":
        return {
          title: "Refund & Cancellation Policy",
          description: "Guidelines and procedures for tipping transactions and payment processing.",
        };
      case "/contact":
        return {
          title: "Contact Us",
          description: "Get in touch with the Sponza team for support, partnerships, or inquiries.",
        };
      default:
        return {
          title: title || "Legal Documentation",
          description: "Platform legal policies and documentation.",
        };
    }
  };

  const info = getPageDetails();

  return (
    <div className="min-h-screen bg-[#190019] text-sponza-100 py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sponza-300 hover:text-sponza-100 text-sm mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="bg-sponza-800/40 border border-sponza-700/30 rounded-2xl p-8 md:p-12 backdrop-blur-sm">
          <h1 className="font-heading text-3xl md:text-4xl text-sponza-100 font-medium mb-4">
            {info.title}
          </h1>
          <p className="text-sponza-300/80 text-base mb-8">{info.description}</p>

          <div className="border-t border-sponza-700/40 pt-8 text-sponza-300/60 text-sm leading-relaxed space-y-4">
            <p>
              This documentation is currently being finalized for the official Sponza launch.
            </p>
            <p>
              If you have immediate questions or need platform support, please reach out to us directly at{" "}
              <a
                href="mailto:support@sponza.in"
                className="text-sponza-100 underline underline-offset-4 hover:text-sponza-300 transition-colors"
              >
                support@sponza.in
              </a>.
            </p>
          </div>
        </div>

        <footer className="mt-12 text-center text-sponza-700 text-xs">
          © {new Date().getFullYear()} Sponza. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
