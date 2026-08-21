import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import ASCIIText from "@/components/ASCIIText";

/* ─── Platform fee data ─── */
const PLATFORMS = [
  { name: "YouTube Super Chat", fee: 30, color: "#FF0000", shortName: "YouTube" },
  { name: "Twitch Bits", fee: 29, color: "#9146FF", shortName: "Twitch", tooltip: "Twitch takes ~29% when viewers purchase Bits" },
  { name: "Kick", fee: 5, color: "#53FC18", shortName: "Kick" },
  { name: "Sponza", fee: 5, color: "#DFB6B2", shortName: "Sponza", highlight: true },
];

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/* ─── Scroll-reveal hook ─── */
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

/* ─── How It Works Steps ─── */
const STEPS = [
  {
    number: "01",
    title: "Share your link",
    description: "Get your unique Sponza link and share it with your viewers during livestreams.",
  },
  {
    number: "02",
    title: "Viewers tip via UPI",
    description: "They enter their name, choose an amount, add a message, and pay instantly with UPI.",
  },
  {
    number: "03",
    title: "Get paid instantly",
    description: "Tips land in your Sponza wallet. Withdraw to your UPI anytime you want.",
  },
];

export default function HomePage() {
  const [sliderValue, setSliderValue] = useState(5000);
  const howItWorksReveal = useScrollReveal();
  const calculatorReveal = useScrollReveal();
  const ctaReveal = useScrollReveal();

  return (
    <div className="min-h-screen bg-[#190019] text-sponza-100 overflow-x-hidden">

      {/* ═══════════════════════════════════════════════
          SECTION 1: Hero — Full-screen ASCIIText
      ═══════════════════════════════════════════════ */}
      <section className="relative h-screen w-full flex items-center justify-center">
        {/* ASCII Background */}
        <ASCIIText
          text="SPONZA"
          enableWaves={true}
          asciiFontSize={8}
          textFontSize={200}
          textColor="#FBE4D8"
          planeBaseHeight={8}
        />

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
          <span className="text-sponza-300 text-xs font-sans tracking-widest uppercase opacity-60">
            Scroll
          </span>
          <ChevronDown className="w-5 h-5 text-sponza-300 animate-scroll-bounce" />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SECTION 2: How It Works
      ═══════════════════════════════════════════════ */}
      <section
        ref={howItWorksReveal.ref}
        className="relative py-24 md:py-32 px-6"
        style={{ background: "linear-gradient(180deg, #190019 0%, #2B124C 100%)" }}
      >
        <div className="max-w-5xl mx-auto">
          <h2
            className={`font-heading text-3xl md:text-5xl font-medium text-sponza-100 text-center mb-20 transition-all duration-700 ${
              howItWorksReveal.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            How it works
          </h2>

          <div className="grid md:grid-cols-3 gap-8 md:gap-6">
            {STEPS.map((step, i) => (
              <div
                key={step.number}
                className={`relative group transition-all duration-700 ${
                  howItWorksReveal.isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${(i + 1) * 150}ms` }}
              >
                {/* Connector line (between cards on desktop) */}
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[calc(100%+0.5rem)] w-[calc(100%-1rem)] h-px border-t border-dashed border-sponza-700/50" />
                )}

                <div className="p-8 rounded-2xl bg-sponza-800/40 border border-sponza-700/30 backdrop-blur-sm hover:border-sponza-600/50 transition-all duration-300">
                  <span className="font-mono text-sm text-sponza-600 mb-4 block">
                    {step.number}
                  </span>
                  <h3 className="font-heading text-xl md:text-2xl text-sponza-100 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-sponza-300/80 text-sm md:text-base leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SECTION 3: Revenue Calculator
      ═══════════════════════════════════════════════ */}
      <section
        ref={calculatorReveal.ref}
        className="relative py-24 md:py-32 px-6 bg-[#190019]"
      >
        <div className="max-w-4xl mx-auto">
          <h2
            className={`font-heading text-3xl md:text-5xl font-medium text-sponza-100 text-center mb-6 transition-all duration-700 ${
              calculatorReveal.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            See how much more you keep
          </h2>
          <p
            className={`text-sponza-300/70 text-center text-base md:text-lg mb-16 max-w-xl mx-auto transition-all duration-700 delay-100 ${
              calculatorReveal.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            Drag the slider to compare what creators actually earn across platforms.
          </p>

          {/* Slider */}
          <div
            className={`mb-16 transition-all duration-700 delay-200 ${
              calculatorReveal.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sponza-300/60 text-sm font-sans">Tip amount</span>
              <span className="font-heading text-2xl md:text-3xl text-sponza-100">
                {formatINR(sliderValue)}
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={50000}
              step={10}
              value={sliderValue}
              onChange={(e) => setSliderValue(Number(e.target.value))}
              className="sponza-slider w-full"
            />
            <div className="flex justify-between mt-2">
              <span className="text-sponza-600 text-xs">₹10</span>
              <span className="text-sponza-600 text-xs">₹50,000</span>
            </div>
          </div>

          {/* Comparison Cards */}
          <div className="space-y-3">
            {PLATFORMS.map((platform, i) => {
              const creatorGets = Math.round(sliderValue * (1 - platform.fee / 100));
              const platformTakes = sliderValue - creatorGets;
              const barWidth = ((1 - platform.fee / 100) * 100);

              return (
                <div
                  key={platform.name}
                  className={`rounded-xl p-5 md:p-6 transition-all duration-700 ${
                    platform.highlight
                      ? "sponza-highlight bg-sponza-800/60"
                      : "bg-sponza-800/30 border border-sponza-700/20"
                  } ${
                    calculatorReveal.isVisible
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-8"
                  }`}
                  style={{ transitionDelay: `${(i + 3) * 100}ms` }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: platform.color }}
                      />
                      <span className={`font-heading text-sm md:text-base ${platform.highlight ? "text-sponza-100" : "text-sponza-300"}`}>
                        {platform.name}
                      </span>
                      {platform.highlight && (
                        <span className="text-[10px] font-sans uppercase tracking-wider bg-sponza-100/10 text-sponza-100 px-2 py-0.5 rounded-full">
                          You're here
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`font-heading text-lg md:text-xl ${platform.highlight ? "text-sponza-100" : "text-sponza-300"}`}>
                        {formatINR(creatorGets)}
                      </span>
                      <span className="text-sponza-600 text-xs ml-2">
                        ({platform.fee}% fee)
                      </span>
                    </div>
                  </div>

                  {/* Visual bar */}
                  <div className="h-2 bg-sponza-900/50 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: platform.color,
                        opacity: platform.highlight ? 1 : 0.6,
                      }}
                    />
                  </div>

                  <div className="flex justify-between mt-2">
                    <span className="text-sponza-600 text-xs">
                      Creator keeps {formatINR(creatorGets)}
                    </span>
                    <span className="text-sponza-600 text-xs">
                      Platform takes {formatINR(platformTakes)}
                    </span>
                  </div>

                  {platform.tooltip && (
                    <p className="text-sponza-600 text-[11px] mt-2 italic">
                      * {platform.tooltip}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SECTION 4: Join Waitlist CTA
      ═══════════════════════════════════════════════ */}
      <section
        ref={ctaReveal.ref}
        className="relative py-24 md:py-32 px-6"
        style={{ background: "linear-gradient(180deg, #190019 0%, #2B124C 50%, #522B5B 100%)" }}
      >
        <div
          className={`max-w-2xl mx-auto text-center transition-all duration-700 ${
            ctaReveal.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="font-heading text-3xl md:text-5xl font-medium text-sponza-100 mb-6">
            Join the waitlist
          </h2>
          <p className="text-sponza-300/70 text-base md:text-lg mb-10 max-w-md mx-auto leading-relaxed">
            Sponza is launching soon. Be among the first creators to get access.
          </p>
          <a
            href="https://form.typeform.com/to/YL6jeLxj"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-sponza-100 text-sponza-900 font-heading font-medium text-base md:text-lg px-8 py-4 rounded-xl hover:bg-sponza-300 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(251,228,216,0.15)]"
          >
            Join Waitlist
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="ml-1">
              <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SECTION 5: Footer
      ═══════════════════════════════════════════════ */}
      <footer className="bg-[#190019] border-t border-sponza-700/30 py-10 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 mb-8">
            <Link to="/terms" className="text-sponza-600 hover:text-sponza-300 text-sm transition-colors duration-200">
              Terms & Conditions
            </Link>
            <Link to="/privacy" className="text-sponza-600 hover:text-sponza-300 text-sm transition-colors duration-200">
              Privacy Policy
            </Link>
            <Link to="/refund" className="text-sponza-600 hover:text-sponza-300 text-sm transition-colors duration-200">
              Refund & Cancellation Policy
            </Link>
            <Link to="/contact" className="text-sponza-600 hover:text-sponza-300 text-sm transition-colors duration-200">
              Contact Us
            </Link>
          </div>
          <p className="text-center text-sponza-700 text-xs">
            © {new Date().getFullYear()} Sponza. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
