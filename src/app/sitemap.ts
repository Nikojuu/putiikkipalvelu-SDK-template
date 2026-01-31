import { MetadataRoute } from "next";
import type { Category } from "@putiikkipalvelu/storefront-sdk";
import { getStoreConfig, getSEOValue } from "@/lib/storeConfig";
import { storefront } from "@/lib/storefront";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Get domain from store config with fallback
  let domain = process.env.NEXT_PUBLIC_BASE_URL || "https://example.com";
  try {
    const config = await getStoreConfig();
    domain = getSEOValue(config.seo.domain, domain);
  } catch (error) {
    console.error("Error fetching store config for sitemap:", error);
  }

  // Fetch all products using SDK
  const fetchProducts = async () => {
    try {
      const data = await storefront.products.filtered(
        {
          slugs: ["all-products"],
          page: 1,
          pageSize: 1000,
        },
        {
          next: { revalidate: 13600 }, // Revalidate every hour
        }
      );
      return data.products;
    } catch (error) {
      console.error("Error fetching products:", error);
      return [];
    }
  };

  // Fetch all categories using SDK
  const fetchCategories = async () => {
    try {
      const categories = await storefront.categories.list({
        next: { revalidate: 13600 },
      });
      return categories;
    } catch (error) {
      console.error("Error fetching categories:", error);
      return [];
    }
  };

  const [products, categories] = await Promise.all([
    fetchProducts(),
    fetchCategories(),
  ]);

  const productUrls = products.map((product) => ({
    url: `${domain}/product/${product.slug}`,
    lastModified: new Date(),
  }));

  const categoryUrls = categories.map((category: Category) => ({
    url: `${domain}/products/${category.slug}`,
    lastModified: category.createdAt,
  }));

  // Add your static pages here
  const staticPages = [
    { route: "", changefreq: "daily", priority: 1.0 },
    { route: "/about", changefreq: "monthly", priority: 0.8 },
    { route: "/contact", changefreq: "monthly", priority: 0.7 },
    { route: "/gallery", changefreq: "weekly", priority: 0.6 },
    { route: "/privacy", changefreq: "yearly", priority: 0.5 },
    { route: "/products", changefreq: "daily", priority: 0.9 },
  ].map(({ route, changefreq, priority }) => ({
    url: `${domain}${route}`,
    lastModified: new Date(),
    changefreq,
    priority,
  }));

  return [...staticPages, ...productUrls, ...categoryUrls];
}
