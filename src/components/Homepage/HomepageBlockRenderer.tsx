import type { PageBlock } from "@putiikkipalvelu/storefront-sdk";
import DOMPurify from "isomorphic-dompurify";
import dynamic from "next/dynamic";
import Hero from "@/components/Hero";
import Subtitle from "@/components/subtitle";
import { ProductCard } from "@/components/ProductCard";
import { ProductCarousel } from "@/components/Product/ProductCarousel";
import ShowcaseBlock from "@/components/ShowcaseBlock";
import CtaSection from "@/components/Homepage/CtaSection";
import AboutBlock from "@/components/Aboutpage/AboutBlock";
import { storefront } from "@/lib/storefront";

const PhotoGallery = dynamic(
  () => import("@/components/Aboutpage/PhotoGallery")
);

export async function HomepageBlockRenderer({ block }: { block: PageBlock }) {
  switch (block.type) {
    case "hero":
      return (
        <Hero
          title={block.data.title}
          subtitle={block.data.subtitle}
          imageUrl={block.data.imageUrl}
          ctaText={block.data.ctaText}
          ctaLink={block.data.ctaLink}
        />
      );

    case "latest_products": {
      const count = block.data.count ?? 6;
      const latestProducts = await storefront.products.latest(count);

      return (
        <section className="relative py-8 bg-gradient-to-b from-warm-white via-cream/20 to-warm-white">
          <Subtitle
            subtitle={block.data.title || "Uusimmat tuotteet"}
            description={block.data.description}
          />

          {/* Desktop grid */}
          <div className="hidden sm:block container mx-auto px-4 max-w-7xl">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {latestProducts.map((item) => (
                <ProductCard item={item} key={item.id} />
              ))}
            </div>

            <div className="flex justify-center mt-16">
              <a
                href="/products"
                className="group inline-flex items-center gap-3 px-8 py-4 border border-charcoal/20 text-charcoal font-secondary text-sm tracking-wider uppercase transition-all duration-300 hover:border-rose-gold hover:text-rose-gold"
              >
                <span>Näytä kaikki tuotteet</span>
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
              </a>
            </div>
          </div>

          {/* Mobile carousel */}
          <ProductCarousel products={latestProducts} />
        </section>
      );
    }

    case "showcase":
      return (
        <section className="relative py-8 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-warm-white via-cream/30 to-warm-white" />
          <div className="relative container mx-auto px-4">
            <ShowcaseBlock
              title={block.data.title}
              description={block.data.description}
              items={block.data.items}
            />
          </div>
        </section>
      );

    case "cta":
      return (
        <CtaSection
          title={block.data.title}
          description={block.data.description}
          primaryButtonText={block.data.primaryButtonText}
          primaryButtonLink={block.data.primaryButtonLink}
          secondaryButtonText={block.data.secondaryButtonText}
          secondaryButtonLink={block.data.secondaryButtonLink}
        />
      );

    case "markdown": {
      if (!block.data.content) return null;
      const clean = DOMPurify.sanitize(block.data.content);
      return (
        <section className="container mx-auto px-4 max-w-4xl py-8">
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: clean }}
          />
        </section>
      );
    }

    case "accordion":
      return (
        <section className="container mx-auto px-4 max-w-4xl py-8">
          <div className="space-y-3">
            {block.data.title && (
              <h2 className="text-2xl font-semibold mb-4">
                {block.data.title}
              </h2>
            )}
            {block.data.description && (
              <p className="text-muted-foreground mb-4">
                {block.data.description}
              </p>
            )}
            {block.data.items.map((item) => (
              <details key={item.id} className="border rounded-lg p-4">
                <summary className="font-medium cursor-pointer">
                  {item.question}
                </summary>
                <div
                  className="mt-2 text-muted-foreground prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(item.answer),
                  }}
                />
              </details>
            ))}
          </div>
        </section>
      );

    case "gallery":
      return (
        <section className="container mx-auto px-4 max-w-6xl py-8">
          <PhotoGallery items={block.data.items} />
        </section>
      );

    case "about":
      return (
        <section className="py-8">
          {block.data.imageUrl ? (
            <AboutBlock
              blockInfo={{
                imgSrc: block.data.imageUrl,
                title: block.data.title,
                text: block.data.description,
                reverse: block.data.imagePosition === "right",
              }}
            />
          ) : (
            <div className="max-w-screen-xl mx-auto px-4 sm:px-8">
              <h2 className="font-primary text-2xl md:text-3xl font-bold text-charcoal mb-4">
                {block.data.title}
              </h2>
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(block.data.description),
                }}
              />
            </div>
          )}
        </section>
      );

    default:
      return null;
  }
}
