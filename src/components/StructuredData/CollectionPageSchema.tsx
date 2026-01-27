import { CollectionPage, WithContext } from "schema-dts";
import type { Product } from "@putiikkipalvelu/storefront-sdk";

interface CollectionPageSchemaProps {
  name: string;
  description?: string;
  products: Product[];
  categorySlug: string;
  totalCount?: number;
  storeDomain: string;
}

export default function CollectionPageSchema({
  name,
  description,
  products,
  categorySlug,
  totalCount,
  storeDomain,
}: CollectionPageSchemaProps) {
  const schema: WithContext<CollectionPage> = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${storeDomain}/products/${categorySlug}`,
    name: name,
    description: description || `Browse products in ${name} category`,
    url: `${storeDomain}/products/${categorySlug}`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: totalCount || products.length,
      itemListElement: products.slice(0, 12).map((product, index) => {
        const price = product.salePrice || product.price;
        return {
          "@type": "ListItem" as const,
          position: index + 1,
          item: {
            "@type": "Product" as const,
            "@id": `${storeDomain}/product/${product.slug}`,
            name: product.name,
            description: product.description,
            image: product.images?.[0] || [],
            url: `${storeDomain}/product/${product.slug}`,
            offers: {
              "@type": "Offer" as const,
              price: (price / 100).toFixed(2),
              priceCurrency: "EUR",
              availability:
                product.quantity !== null && product.quantity > 0
                  ? ("https://schema.org/InStock" as const)
                  : ("https://schema.org/OutOfStock" as const),
              url: `${storeDomain}/product/${product.slug}`,
            },
          },
        };
      }),
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
