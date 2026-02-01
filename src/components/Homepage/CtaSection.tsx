import Link from "next/link";

interface CtaSectionProps {
  title?: string;
  description?: string;
  primaryButtonText?: string;
  primaryButtonLink?: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
}

export default function CtaSection({
  title = "Löydä sinun tuotteesi",
  description = "Laadukas valikoima huolella valittuja tuotteita. Olitpa etsimässä lahjaa tai jotain erityistä itsellesi - täältä löydät sen.",
  primaryButtonText = "Selaa kaikkia tuotteita",
  primaryButtonLink = "/products",
  secondaryButtonText = "Ota yhteyttä",
  secondaryButtonLink = "/contact",
}: CtaSectionProps) {
  return (
    <section className="relative py-20 md:py-28 bg-gradient-to-b from-warm-white via-cream/40 to-soft-blush/30 overflow-hidden">
      {/* Decorative border frame */}
      <div className="absolute inset-6 sm:inset-10 border border-rose-gold/15 pointer-events-none" />

      {/* Corner accents */}
      <div className="absolute top-6 left-6 sm:top-10 sm:left-10 w-8 h-8 border-l-2 border-t-2 border-rose-gold/40" />
      <div className="absolute top-6 right-6 sm:top-10 sm:right-10 w-8 h-8 border-r-2 border-t-2 border-rose-gold/40" />
      <div className="absolute bottom-6 left-6 sm:bottom-10 sm:left-10 w-8 h-8 border-l-2 border-b-2 border-rose-gold/40" />
      <div className="absolute bottom-6 right-6 sm:bottom-10 sm:right-10 w-8 h-8 border-r-2 border-b-2 border-rose-gold/40" />

      {/* Floating diamonds */}
      <div className="absolute top-1/4 left-[15%] w-2 h-2 bg-rose-gold/25 diamond-shape hidden sm:block" />
      <div className="absolute top-1/3 right-[12%] w-3 h-3 bg-champagne/30 diamond-shape hidden sm:block" />
      <div className="absolute bottom-1/3 left-[20%] w-1.5 h-1.5 bg-rose-gold/20 diamond-shape hidden md:block" />

      <div className="container mx-auto px-4 max-w-3xl text-center relative z-10">
        {/* Decorative header */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-2 h-2 bg-rose-gold/50 diamond-shape" />
          <div className="w-12 h-[1px] bg-gradient-to-r from-rose-gold/50 to-champagne/30" />
          <div className="w-1.5 h-1.5 bg-champagne/40 diamond-shape" />
          <div className="w-12 h-[1px] bg-gradient-to-l from-rose-gold/50 to-champagne/30" />
          <div className="w-2 h-2 bg-rose-gold/50 diamond-shape" />
        </div>

        {title && (
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-primary font-bold text-charcoal mb-4">
            {title}
          </h2>
        )}

        {description && (
          <p className="text-sm md:text-base text-charcoal/60 font-secondary mb-10 max-w-2xl mx-auto leading-relaxed">
            {description}
          </p>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {primaryButtonText && primaryButtonLink && (
            <Link
              href={primaryButtonLink}
              className="group inline-flex items-center gap-3 px-8 py-4 bg-charcoal text-warm-white font-secondary text-sm tracking-wider uppercase transition-all duration-300 hover:bg-rose-gold"
            >
              {primaryButtonText}
              <svg
                className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Link>
          )}
          {secondaryButtonText && secondaryButtonLink && (
            <Link
              href={secondaryButtonLink}
              className="group inline-flex items-center gap-3 px-8 py-4 border border-charcoal/30 text-charcoal font-secondary text-sm tracking-wider uppercase transition-all duration-300 hover:border-rose-gold hover:text-rose-gold"
            >
              {secondaryButtonText}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
