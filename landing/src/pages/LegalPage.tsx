import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, ChevronRight, Menu, X } from "lucide-react";

import { LandingFooter } from "@/components/LandingFooter";
import {
  LEGAL_CONTENT_REGISTRY,
  type LegalPageData,
  type LegalSection,
} from "@/content/legal";
import { SUPPORT_EMAIL } from "@/content/landing";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────
   Utility: format an ISO date string into a readable form
   ────────────────────────────────────────────────────────────── */
function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/* ──────────────────────────────────────────────────────────────
   Section renderer  (recursive for subsections)
   ────────────────────────────────────────────────────────────── */
interface SectionBlockProps {
  section: LegalSection;
  depth?: number;
}

function SectionBlock({ section, depth = 0 }: SectionBlockProps) {
  const HeadingTag = depth === 0 ? "h2" : "h3";
  const headingClasses =
    depth === 0
      ? "font-heading text-xl md:text-2xl text-sponsa-100 font-medium"
      : "font-heading text-lg md:text-xl text-sponsa-300 font-medium";

  return (
    <section id={section.id} className="scroll-mt-24">
      <HeadingTag className={headingClasses}>{section.title}</HeadingTag>

      {section.content.length > 0 && (
        <div className="mt-3 space-y-3">
          {section.content.map((paragraph, i) => (
            <p
              key={i}
              className="text-sponsa-300/80 text-sm md:text-base leading-relaxed"
              dangerouslySetInnerHTML={{ __html: paragraph }}
            />
          ))}
        </div>
      )}

      {section.subsections && section.subsections.length > 0 && (
        <div className="mt-6 space-y-6 pl-0 md:pl-4 border-l-0 md:border-l border-sponsa-700/30">
          {section.subsections.map((sub) => (
            <div key={sub.id} className="md:pl-4">
              <SectionBlock section={sub} depth={depth + 1} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────
   Table-of-Contents sidebar
   ────────────────────────────────────────────────────────────── */
interface TOCProps {
  sections: LegalSection[];
  activeId: string;
  onNavigate?: () => void;
}

function TableOfContents({ sections, activeId, onNavigate }: TOCProps) {
  return (
    <nav aria-label="Table of contents" className="space-y-1">
      {sections.map((section) => (
        <a
          key={section.id}
          href={`#${section.id}`}
          onClick={onNavigate}
          className={cn(
            "block text-xs md:text-sm py-1.5 px-3 rounded-lg transition-all duration-200 truncate",
            activeId === section.id
              ? "bg-sponsa-700/40 text-sponsa-100 font-medium"
              : "text-sponsa-300/60 hover:text-sponsa-300 hover:bg-sponsa-800/40"
          )}
        >
          {section.title}
        </a>
      ))}
    </nav>
  );
}

/* ──────────────────────────────────────────────────────────────
   Fallback for unknown routes
   ────────────────────────────────────────────────────────────── */
function LegalFallback() {
  return (
    <div className="min-h-screen bg-sponsa-900 text-sponsa-100">
      <div className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sponsa-300 hover:text-sponsa-100 text-sm mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="bg-sponsa-800/40 border border-sponsa-700/30 rounded-2xl p-8 md:p-12 backdrop-blur-sm">
            <h1 className="font-heading text-3xl md:text-4xl text-sponsa-100 font-medium mb-4">
              Legal Documentation
            </h1>
            <p className="text-sponsa-300/80 text-base mb-8">
              Platform legal policies and documentation.
            </p>

            <div className="border-t border-sponsa-700/40 pt-8 text-sponsa-300/60 text-sm leading-relaxed space-y-4">
              <p>
                This documentation is currently being finalised for the official
                Sponsa launch.
              </p>
              <p>
                If you have immediate questions or need platform support, please
                reach out to us directly at{" "}
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="text-sponsa-100 underline underline-offset-4 hover:text-sponsa-300 transition-colors"
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

/* ──────────────────────────────────────────────────────────────
   Main LegalPage component
   ────────────────────────────────────────────────────────────── */
export default function LegalPage() {
  const location = useLocation();
  const pageData: LegalPageData | undefined =
    LEGAL_CONTENT_REGISTRY[location.pathname];

  const [activeId, setActiveId] = useState<string>("");
  const [tocOpen, setTocOpen] = useState(false);

  // Collect all top-level section IDs for intersection observer
  const sectionIds = useMemo(
    () => (pageData ? pageData.sections.map((s) => s.id) : []),
    [pageData]
  );

  // Scroll-spy: track which section is in the viewport
  useEffect(() => {
    if (sectionIds.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
    );

    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [sectionIds, location.pathname]);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
    setTocOpen(false);
  }, [location.pathname]);

  // If no content found for this route, show fallback
  if (!pageData) {
    return <LegalFallback />;
  }

  return (
    <div className="min-h-screen bg-sponsa-900 text-sponsa-100">
      <div className="py-12 md:py-16 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Back link */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sponsa-300 hover:text-sponsa-100 text-sm mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="flex gap-8">
            {/* ── Desktop TOC Sidebar ── */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-8">
                <span className="text-sponsa-600 text-[10px] font-sans uppercase tracking-widest mb-4 block px-3">
                  On this page
                </span>
                <TableOfContents
                  sections={pageData.sections}
                  activeId={activeId}
                />
              </div>
            </aside>

            {/* ── Main Content ── */}
            <main className="flex-1 min-w-0">
              {/* Mobile TOC Toggle */}
              <button
                onClick={() => setTocOpen(!tocOpen)}
                className="lg:hidden flex items-center gap-2 text-sponsa-300 hover:text-sponsa-100 text-sm mb-6 bg-sponsa-800/40 border border-sponsa-700/30 rounded-xl px-4 py-2.5 transition-colors w-full"
              >
                {tocOpen ? (
                  <X className="w-4 h-4" />
                ) : (
                  <Menu className="w-4 h-4" />
                )}
                <span>Table of Contents</span>
                <ChevronRight
                  className={cn(
                    "w-4 h-4 ml-auto transition-transform duration-200",
                    tocOpen && "rotate-90"
                  )}
                />
              </button>

              {/* Mobile TOC Panel */}
              {tocOpen && (
                <div className="lg:hidden mb-6 bg-sponsa-800/40 border border-sponsa-700/30 rounded-xl p-4 backdrop-blur-sm">
                  <TableOfContents
                    sections={pageData.sections}
                    activeId={activeId}
                    onNavigate={() => setTocOpen(false)}
                  />
                </div>
              )}

              {/* Page Header */}
              <div className="bg-sponsa-800/40 border border-sponsa-700/30 rounded-2xl p-6 md:p-10 backdrop-blur-sm mb-8">
                <h1 className="font-heading text-2xl md:text-4xl text-sponsa-100 font-medium mb-3">
                  {pageData.title}
                </h1>
                <p className="text-sponsa-300/80 text-sm md:text-base mb-4">
                  {pageData.subtitle}
                </p>
                <span className="text-sponsa-600 text-xs font-mono">
                  Last updated: {formatDate(pageData.lastUpdated)}
                </span>
              </div>

              {/* Sections */}
              <div className="bg-sponsa-800/40 border border-sponsa-700/30 rounded-2xl p-6 md:p-10 backdrop-blur-sm">
                <div className="space-y-10">
                  {pageData.sections.map((section, i) => (
                    <div key={section.id}>
                      {i > 0 && (
                        <div className="border-t border-sponsa-700/30 mb-10" />
                      )}
                      <SectionBlock section={section} />
                    </div>
                  ))}
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>

      <LandingFooter className="bg-transparent border-t-0 pt-0" />
    </div>
  );
}
