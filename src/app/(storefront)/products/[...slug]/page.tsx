import { Suspense } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/Product/ProductGrid";
import { ProductGridSkeleton } from "@/components/Product/ProductGridSkeleton";
import { SearchInput } from "@/components/Product/SearchInput";
import Subtitle from "@/components/subtitle";
import {
  ALL_PRODUCTS_SLUG,
  findCategoryBySlug,
  getCategories,
} from "@/lib/categories";
import { getStoreConfig, getSEOValue, SEO_FALLBACKS } from "@/lib/storeConfig";
import type { ProductSortOption } from "@putiikkipalvelu/storefront-sdk";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {

  try {
    const [config, categories, { slug }] = await Promise.all([
      getStoreConfig(),
      getCategories(),
      params,
    ]);
    const domain = getSEOValue(config.seo.domain, SEO_FALLBACKS.domain);

    const slugs = slug;
    const categorySlug = slugs[slugs.length - 1];

    let categoryName = "Tuotteet";
    let metaTitle: string | null = null;
    let metaDescription: string | null = null;

    if (categorySlug && categorySlug !== ALL_PRODUCTS_SLUG) {
      const decodedSlug = decodeURIComponent(categorySlug);
      const category = findCategoryBySlug(categories, decodedSlug);
      // If categories failed to load, skip metadata lookup rather than 404-ing
      // every category page. The page body handles that inconsistency too.
      if (!category && categories.length > 0) {
        return {
          title: "Sivua ei löytynyt",
          description: "Etsimääsi kategoriaa ei löytynyt.",
          robots: "noindex, nofollow",
        };
      }
      if (category) {
        categoryName = category.name || "Tuotteet";
        metaTitle = category.metaTitle;
        metaDescription = category.metaDescription;
      }
    }

    const categoryUrl = `${domain}/products/${slugs.join("/")}`;
    const ogImage = getSEOValue(config.seo.openGraphImageUrl, SEO_FALLBACKS.openGraphImage);
    const twitterImage = getSEOValue(config.seo.twitterImageUrl, SEO_FALLBACKS.twitterImage);
    const twitterHandle = config.seo.twitterHandle;

    const title = metaTitle || `${config.store.name} | ${categoryName}`;
    const description = metaDescription || `Tutustu ${config.store.name} verkkokaupan tuotteisiin kategoriassa ${categoryName}.`;

    return {
      title,
      description,
      alternates: {
        canonical: categoryUrl,
      },
      openGraph: {
        title,
        description,
        url: categoryUrl,
        siteName: config.store.name,
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: config.seo.ogImageAlt || title,
          },
        ],
        locale: "fi_FI",
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [twitterImage],
        ...(twitterHandle && { site: twitterHandle, creator: twitterHandle }),
      },
    };
  } catch (error) {
    console.error("Error generating category metadata:", error);

    return {
      title: "Tuotteet",
      description: "Tutustu tuotevalikoimaamme.",
      robots: "noindex, nofollow",
    };
  }
}

const ProductsPage = async ({
  params,
  searchParams,
}: {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<{ page?: string; sort?: string; q?: string }>;
}) => {
  const [{ slug }, resolvedSearchParams, config, categories] = await Promise.all([
    params,
    searchParams,
    getStoreConfig(),
    getCategories(),
  ]);
  const slugs = slug ?? [ALL_PRODUCTS_SLUG];
  const pageSize = 12;
  const currentPage = Number(resolvedSearchParams.page) || 1;
  const searchQuery = resolvedSearchParams.q?.trim() || "";
  const sort = (resolvedSearchParams.sort as ProductSortOption) || (searchQuery ? "relevance" : "newest");

  const domain = getSEOValue(config.seo.domain, SEO_FALLBACKS.domain);

  const isAllProducts = slugs[0] === ALL_PRODUCTS_SLUG;
  const lastSlug = slugs[slugs.length - 1];

  const matchedCategory =
    isAllProducts || !lastSlug
      ? null
      : findCategoryBySlug(categories, decodeURIComponent(lastSlug));

  // If we have a category tree and the slug isn't in it, 404 immediately
  // rather than bubbling an SDK error from the products fetch below
  if (!isAllProducts && !matchedCategory && categories.length > 0) {
    notFound();
  }

  const heading = searchQuery
    ? `Hakutulokset: "${searchQuery}"`
    : matchedCategory?.name ?? "Tuotteet";

  return (
    <section className="pt-8 md:pt-16 container mx-auto px-4 bg-warm-white">
      <Subtitle subtitle={heading} as="h1" />

      <div className="max-w-screen-xl mx-auto flex justify-start my-4">
        <div className="w-full sm:w-72">
          <SearchInput />
        </div>
      </div>

      <Suspense
        key={`${slugs.join("/")}:${currentPage}:${sort}:${searchQuery}`}
        fallback={<ProductGridSkeleton />}
      >
        <ProductGrid
          slugs={slugs}
          currentPage={currentPage}
          pageSize={pageSize}
          sort={sort}
          searchQuery={searchQuery}
          storeName={config.store.name}
          domain={domain}
          imageAspectRatio={config.store.imageAspectRatio}
        />
      </Suspense>
    </section>
  );
};

export default ProductsPage;
