import { useState } from "react";
import { ArrowRight, ChevronDown, Landmark, Link2, Smartphone } from "lucide-react";

import ASCIIText from "@/components/ASCIIText";
import { Button } from "@/components/Button";
import { LandingFooter } from "@/components/LandingFooter";
import {
  HOW_IT_WORKS_STEPS,
  PLATFORM_COMPARISONS,
  WAITLIST_URL,
  type HowItWorksStep,
  type PlatformComparison,
} from "@/content/landing";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { cn } from "@/lib/utils";

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getRevealClasses(isVisible: boolean, className?: string) {
  return cn(
    "transition-all duration-700",
    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
    className
  );
}

interface LandingSectionHeadingProps {
  title: string;
  description?: string;
  isVisible: boolean;
}

function LandingSectionHeading({
  title,
  description,
  isVisible,
}: LandingSectionHeadingProps) {
  return (
    <div className={getRevealClasses(isVisible, "text-center")}>
      <h2 className="font-heading text-3xl md:text-5xl font-medium text-sponsa-100">
        {title}
      </h2>
      {description ? (
        <p className="text-sponsa-300/70 text-base md:text-lg mt-6 max-w-xl mx-auto">
          {description}
        </p>
      ) : null}
    </div>
  );
}

interface StepCardProps {
  step: HowItWorksStep;
  index: number;
  isVisible: boolean;
}

const STEP_ICONS = [Link2, Smartphone, Landmark];
const STEP_SUBTITLES = [
  "Zero setup required",
  "Instant QR & UPI intent",
  "T+1 automated settlement",
];

function StepCard({ step, index, isVisible }: StepCardProps) {
  const Icon = STEP_ICONS[index] || Link2;
  const subtitle = STEP_SUBTITLES[index];

  return (
    <div
      className={getRevealClasses(isVisible, "relative h-full flex flex-col")}
      style={{ transitionDelay: `${(index + 1) * 150}ms` }}
    >
      <div className="h-full flex flex-col justify-between p-7 md:p-8 rounded-2xl bg-gradient-to-b from-sponsa-800/40 via-sponsa-900/60 to-sponsa-900/80 border border-white/[0.08] hover:border-sponsa-300/40 backdrop-blur-md transition-all duration-300 hover:shadow-[0_12px_32px_rgba(25,0,25,0.7)] hover:-translate-y-1.5 group">
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.1] flex items-center justify-center text-sponsa-100 group-hover:border-sponsa-300/50 group-hover:bg-sponsa-800/80 group-hover:scale-105 transition-all duration-300 shadow-glow">
              <Icon className="w-5 h-5 text-sponsa-100" />
            </div>
            <span className="text-xs font-mono font-medium px-3 py-1 rounded-full bg-white/[0.04] text-sponsa-300 border border-white/[0.08]">
              Step {step.number}
            </span>
          </div>

          <h3 className="font-heading text-xl md:text-2xl text-sponsa-100 mb-3 group-hover:text-white transition-colors">
            {step.title}
          </h3>

          <p className="text-sponsa-300/75 text-sm md:text-base leading-relaxed">
            {step.description}
          </p>
        </div>

        <div className="pt-5 mt-6 border-t border-white/[0.06] flex items-center gap-2 text-xs font-mono text-sponsa-300/60">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
          <span>{subtitle}</span>
        </div>
      </div>
    </div>
  );
}

interface PlatformComparisonRowProps {
  platform: PlatformComparison;
  tipAmount: number;
  index: number;
  isVisible: boolean;
}

function PlatformComparisonRow({
  platform,
  tipAmount,
  index,
  isVisible,
}: PlatformComparisonRowProps) {
  const creatorGets = Math.round(tipAmount * (1 - platform.fee / 100));
  const platformTakes = tipAmount - creatorGets;
  const keepPercentage = (1 - platform.fee / 100) * 100;

  return (
    <div
      className={cn(
        "rounded-xl p-5 md:p-6 transition-all duration-700",
        platform.highlight
          ? "sponsa-highlight bg-sponsa-800/60"
          : "bg-sponsa-800/30 border border-sponsa-700/20",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      )}
      style={{ transitionDelay: `${(index + 3) * 100}ms` }}
    >
      <div className="flex items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            aria-hidden="true"
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: platform.color }}
          />
          <span
            className={cn(
              "font-heading text-sm md:text-base",
              platform.highlight ? "text-sponsa-100" : "text-sponsa-300"
            )}
          >
            {platform.name}
          </span>
          {platform.highlight ? (
            <span className="text-[10px] font-sans uppercase tracking-wider bg-sponsa-100/10 text-sponsa-100 px-2 py-0.5 rounded-full">
              You're here
            </span>
          ) : null}
        </div>

        <div className="text-right flex-shrink-0">
          <span
            className={cn(
              "font-heading text-lg md:text-xl",
              platform.highlight ? "text-sponsa-100" : "text-sponsa-300"
            )}
          >
            {formatINR(creatorGets)}
          </span>
          <span className="text-sponsa-600 text-xs ml-2">({platform.fee}% fee)</span>
        </div>
      </div>

      <div className="h-2 bg-sponsa-900/50 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${keepPercentage}%`,
            backgroundColor: platform.color,
            opacity: platform.highlight ? 1 : 0.6,
          }}
        />
      </div>

      <div className="flex justify-between gap-4 mt-2">
        <span className="text-sponsa-600 text-xs">
          Creator keeps {formatINR(creatorGets)}
        </span>
        <span className="text-sponsa-600 text-xs">
          Platform takes {formatINR(platformTakes)}
        </span>
      </div>

      {platform.tooltip ? (
        <p className="text-sponsa-600 text-[11px] mt-2 italic">* {platform.tooltip}</p>
      ) : null}
    </div>
  );
}

export default function HomePage() {
  const [sliderValue, setSliderValue] = useState(5000);
  const howItWorksReveal = useScrollReveal<HTMLElement>();
  const calculatorReveal = useScrollReveal<HTMLElement>();
  const ctaReveal = useScrollReveal<HTMLElement>();

  return (
    <div className="min-h-screen bg-sponsa-900 text-sponsa-100 overflow-x-hidden">
      <section className="relative h-screen w-full flex items-center justify-center">
        <ASCIIText
          text="SPONSA"
          enableWaves
          asciiFontSize={8}
          textFontSize={200}
          textColor="#FBE4D8"
          planeBaseHeight={8}
        />

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
          <span className="text-sponsa-300 text-xs font-sans tracking-widest uppercase opacity-60">
            Scroll
          </span>
          <ChevronDown
            aria-hidden="true"
            className="w-5 h-5 text-sponsa-300 animate-scroll-bounce"
          />
        </div>
      </section>

      <section
        ref={howItWorksReveal.ref}
        className="relative py-24 md:py-32 px-6"
        style={{ background: "linear-gradient(180deg, #190019 0%, #2B124C 100%)" }}
      >
        <div className="max-w-5xl mx-auto">
          <LandingSectionHeading
            title="How it works"
            isVisible={howItWorksReveal.isVisible}
          />

          <div className="grid md:grid-cols-3 gap-8 md:gap-6 mt-20 items-stretch">
            {HOW_IT_WORKS_STEPS.map((step, index) => (
              <StepCard
                key={step.number}
                step={step}
                index={index}
                isVisible={howItWorksReveal.isVisible}
              />
            ))}
          </div>
        </div>
      </section>

      <section
        ref={calculatorReveal.ref}
        className="relative py-24 md:py-32 px-6 bg-sponsa-900"
      >
        <div className="max-w-4xl mx-auto">
          <LandingSectionHeading
            title="See how much more you keep"
            description="Drag the slider to compare what creators actually earn across platforms."
            isVisible={calculatorReveal.isVisible}
          />

          <div
            className={getRevealClasses(
              calculatorReveal.isVisible,
              "mt-16 mb-16 delay-200"
            )}
          >
            <div className="flex items-center justify-between gap-4 mb-4">
              <span className="text-sponsa-300/60 text-sm font-sans">Tip amount</span>
              <span className="font-heading text-2xl md:text-3xl text-sponsa-100">
                {formatINR(sliderValue)}
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={50000}
              step={10}
              value={sliderValue}
              onChange={(event) => setSliderValue(Number(event.target.value))}
              aria-label="Tip amount comparison slider"
              className="sponsa-slider w-full"
            />
            <div className="flex justify-between mt-2">
              <span className="text-sponsa-600 text-xs">Rs 10</span>
              <span className="text-sponsa-600 text-xs">Rs 50,000</span>
            </div>
          </div>

          <div className="space-y-3">
            {PLATFORM_COMPARISONS.map((platform, index) => (
              <PlatformComparisonRow
                key={platform.name}
                platform={platform}
                tipAmount={sliderValue}
                index={index}
                isVisible={calculatorReveal.isVisible}
              />
            ))}
          </div>
        </div>
      </section>

      <section
        ref={ctaReveal.ref}
        className="relative py-24 md:py-32 px-6"
        style={{
          background: "linear-gradient(180deg, #190019 0%, #2B124C 50%, #522B5B 100%)",
        }}
      >
        <div className={getRevealClasses(ctaReveal.isVisible, "max-w-2xl mx-auto text-center")}>
          <h2 className="font-heading text-3xl md:text-5xl font-medium text-sponsa-100 mb-6">
            Join the waitlist
          </h2>
          <p className="text-sponsa-300/70 text-base md:text-lg mb-10 max-w-md mx-auto leading-relaxed">
            Sponsa is launching soon. Be among the first creators to get access.
          </p>
          <Button
            asChild
            size="xl"
            className="rounded-xl bg-sponsa-100 text-sponsa-900 font-heading font-medium hover:bg-sponsa-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(251,228,216,0.15)]"
          >
            <a href={WAITLIST_URL} target="_blank" rel="noopener noreferrer">
              Join Waitlist
              <ArrowRight aria-hidden="true" className="ml-1" />
            </a>
          </Button>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
