import { Link } from "react-router-dom";

import { LANDING_FOOTER_LINKS } from "@/features/landing/content";
import { cn } from "@/lib/utils";

interface LandingFooterProps {
  className?: string;
}

export function LandingFooter({ className }: LandingFooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer
      className={cn(
        "bg-sponsa-900 border-t border-sponsa-700/30 py-10 px-6",
        className
      )}
    >
      <div className="max-w-5xl mx-auto">
        <nav
          aria-label="Footer"
          className="flex flex-wrap justify-center gap-x-8 gap-y-3 mb-8"
        >
          {LANDING_FOOTER_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-sponsa-600 hover:text-sponsa-300 text-sm transition-colors duration-200"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="text-center text-sponsa-700 text-xs">
          &copy; {year} Sponsa. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
