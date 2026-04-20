import { PaginationComponent } from "@/components/Product/Pagination";
import { SortOptions } from "@/components/Product/SortOptions";
import { ProductCard } from "@/components/ProductCard";
import CollectionPageSchema from "@/components/StructuredData/CollectionPageSchema";
import BreadcrumbSchema from "@/components/StructuredData/BreadcrumbSchema";
import { ALL_PRODUCTS_SLUG } from "@/lib/categories";
import { storefront } from "@/lib/storefront";
import type {
  ImageAspectRatio,
  Product,
  ProductSortOption,
} from "@putiikkipalvelu/storefront-sdk";

type ProductGridProps = {
  slugs: string[];
  currentPage: number;
  pageSize: number;
  sort: ProductSortOption;
  searchQuery: string;
  storeName: string;
  domain: string;
  imageAspectRatio: ImageAspectRatio;
};

export async function ProductGrid({
  slugs,
  currentPage,
  pageSize,
  sort,
  searchQuery,
  storeName,
  domain,
  imageAspectRatio,
}: ProductGridProps) {
  const productPageData = await storefront.products.sorted({
    slugs,
    page: currentPage,
    pageSize,
    sort,
    query: searchQuery || undefined,
  });

  const products: Product[] = productPageData.products as Product[];
  const categoryName = productPageData.name;
  const totalCount = productPageData.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / pageSize);
  const isAllProducts = slugs[0] === ALL_PRODUCTS_SLUG;

  if (!products || products.length === 0) {
    return <EmptyState searchQuery={searchQuery} />;
  }

  const breadcrumbItems = [
    { name: "Etusivu", url: domain },
    { name: "Tuotteet", url: `${domain}/products` },
  ];

  if (!isAllProducts) {
    breadcrumbItems.push({
      name: categoryName || "Kategoria",
      url: `${domain}/products/${slugs.join("/")}`,
    });
  }

  return (
    <>
      <BreadcrumbSchema items={breadcrumbItems} />
      <CollectionPageSchema
        name={categoryName || "Tuotteet"}
        description={`Tutustu ${storeName} verkkokaupan tuotteisiin kategoriassa ${categoryName}.`}
        products={products}
        categorySlug={slugs.join("/")}
        totalCount={totalCount}
        storeDomain={domain}
      />

      <div className="max-w-screen-xl mx-auto flex justify-end my-4">
        <SortOptions />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-screen-xl mx-auto my-8">
        {products.map((item) => (
          <ProductCard item={item} key={item.id} imageAspectRatio={imageAspectRatio} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="my-8">
          <PaginationComponent
            totalPages={totalPages}
            currentPage={currentPage}
          />
        </div>
      )}
    </>
  );
}

function EmptyState({ searchQuery }: { searchQuery: string }) {
  if (searchQuery) {
    return (
      <div className="max-w-screen-xl mx-auto py-16 md:py-24">
        <div className="text-center">
          <h3 className="text-xl md:text-2xl font-primary font-semibold text-charcoal mb-4">
            Haulla &quot;{searchQuery}&quot; ei löytynyt tuotteita
          </h3>
          <p className="text-sm md:text-base font-secondary text-charcoal/60 max-w-md mx-auto">
            Kokeile eri hakusanoja tai selaa kategorioita.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto py-16 md:py-24">
      <div className="relative bg-warm-white p-8 md:p-12 text-center">
        <div className="absolute inset-0 border border-rose-gold/10 pointer-events-none" />

        <div className="absolute top-0 left-0 w-8 h-8 border-l border-t border-rose-gold/30" />
        <div className="absolute top-0 right-0 w-8 h-8 border-r border-t border-rose-gold/30" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-l border-b border-rose-gold/30" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-r border-b border-rose-gold/30" />

        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-1.5 h-1.5 bg-champagne/50 diamond-shape" />
          <div className="w-12 h-[1px] bg-gradient-to-r from-rose-gold/40 to-transparent" />
          <div className="w-2 h-2 bg-rose-gold/40 diamond-shape" />
          <div className="w-12 h-[1px] bg-gradient-to-l from-rose-gold/40 to-transparent" />
          <div className="w-1.5 h-1.5 bg-champagne/50 diamond-shape" />
        </div>

        <h3 className="text-xl md:text-2xl font-primary font-semibold text-charcoal mb-4">
          Tuotteita ei löytynyt
        </h3>
        <p className="text-sm md:text-base font-secondary text-charcoal/60 max-w-md mx-auto">
          Tällä kategorialla ei ole vielä tuotteita. Tutustu muihin
          kategorioihin.
        </p>

        <div className="mt-6 h-[1px] bg-gradient-to-r from-transparent via-rose-gold/20 to-transparent max-w-xs mx-auto" />
      </div>
    </div>
  );
}
