import { notFound } from "next/navigation";
import ProductDetail from "@/components/Product/ProductDetail";
import { Metadata, ResolvingMetadata } from "next";
import ProductSchema from "@/components/StructuredData/ProductSchema";
import BreadcrumbSchema from "@/components/StructuredData/BreadcrumbSchema";
import ReviewList from "@/components/Product/ReviewList";
import ReviewFormDialog from "@/components/Product/ReviewFormDialog";
import { getStoreConfig, getSEOValue, SEO_FALLBACKS } from "@/lib/storeConfig";
import { storefront } from "@/lib/storefront";
import { getUser } from "@/lib/actions/authActions";
import { NotFoundError } from "@putiikkipalvelu/storefront-sdk";

const getProductDataFromApi = async (slug: string) => {
  try {
    const product = await storefront.products.getBySlug(slug, {});
    return product;
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    throw error;
  }
};

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;

  // Fetch product and store config in parallel
  const [product, config] = await Promise.all([
    getProductDataFromApi(slug),
    getStoreConfig(),
  ]);

  const storeName = config.store.name;
  const storeDomain = getSEOValue(config.seo.domain, SEO_FALLBACKS.domain);
  const previousImages = (await parent).openGraph?.images || [];
  const productUrl = `${storeDomain}/product/${slug}`;

  return {
    title: `${storeName} | ${product.metaTitle || product.name}`,
    description: product.metaDescription || product.description,
    alternates: {
      canonical: productUrl,
    },
    openGraph: {
      title: `${storeName} | ${product.metaTitle || product.name}`,
      description: product.metaDescription || product.description,
      url: productUrl,
      siteName: storeName,
      locale: "fi_FI",
      type: "website",
      images: product.images
        ? [product.images[0], ...previousImages]
        : previousImages,
    },
    twitter: {
      card: "summary_large_image",
      title: `${storeName} | ${product.metaTitle || product.name}`,
      description: product.metaDescription || product.description,
      images: product.images ? [product.images[0]] : [],
    },
  };
}

const ProductIdRoute = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await params;

  // Fetch product, store config, and login state in parallel. getUser validates
  // the session server-side (a stale/expired session-id cookie must read as
  // logged-OUT so the form shows the name field), so a cheap cookie-presence
  // check is NOT sufficient here.
  const [product, config, userRes] = await Promise.all([
    getProductDataFromApi(slug),
    getStoreConfig(),
    getUser(),
  ]);

  const storeName = config.store.name;
  const storeDomain = getSEOValue(config.seo.domain, SEO_FALLBACKS.domain);
  const isLoggedIn = !!userRes.user;
  const reviewsEnabled = config.features?.reviewsEnabled ?? false;

  // Build breadcrumb items
  const breadcrumbItems = [
    { name: "Etusivu", url: storeDomain },
    { name: "Tuotteet", url: `${storeDomain}/products` },
  ];

  // Add category to breadcrumb if available
  if (product.categories && product.categories.length > 0) {
    const category = product.categories[0];
    breadcrumbItems.push({
      name: category.name,
      url: `${storeDomain}/products/${category.slug}`,
    });
  }

  // Add product name as final breadcrumb
  breadcrumbItems.push({
    name: product.name,
    url: `${storeDomain}/product/${slug}`,
  });

  return (
    <>
      <ProductSchema
        product={product}
        storeName={storeName}
        storeDomain={storeDomain}
        showAggregateRating={reviewsEnabled}
      />
      <BreadcrumbSchema items={breadcrumbItems} />
      <section className="mt-24 md:mt-48 container mx-auto px-4">
        <ProductDetail product={product} imageAspectRatio={config.store.imageAspectRatio} customerAccountsEnabled={config.features?.customerAccountsEnabled ?? true} />
      </section>
      {reviewsEnabled && (
        <section className="container mx-auto px-4 mt-16 mb-24">
          <div className="flex items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-semibold">Arvostelut</h2>
            <ReviewFormDialog slug={slug} isLoggedIn={isLoggedIn} />
          </div>
          <ReviewList slug={slug} />
        </section>
      )}
    </>
  );
};

export default ProductIdRoute;
