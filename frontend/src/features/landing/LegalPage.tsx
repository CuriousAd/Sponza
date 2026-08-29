import { Link, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { LandingFooter } from "@/features/landing/components/LandingFooter";
import { LEGAL_PAGE_CONTENT, SUPPORT_EMAIL } from "@/features/landing/content";

export default function LegalPage() {
  const location = useLocation();
  const info = LEGAL_PAGE_CONTENT[location.pathname] ?? {
    title: "Legal Documentation",
    description: "Platform legal policies and documentation.",
  };

  return (
    <div className="min-h-screen bg-sponza-900 text-sponza-100">
      <div className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sponza-300 hover:text-sponza-100 text-sm mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
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
                If you have immediate questions or need platform support, please reach out to us
                directly at{" "}
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="text-sponza-100 underline underline-offset-4 hover:text-sponza-300 transition-colors"
                >
                  {SUPPORT_EMAIL}
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </div>

      <LandingFooter className="bg-transparent border-t-0 pt-0" />
    </div>
  );
}
