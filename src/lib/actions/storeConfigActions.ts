import { cache } from "react";
import { storefront } from "../storefront";
import type { StoreConfig } from "@putiikkipalvelu/storefront-sdk";

// Re-export StoreConfig type for convenience
export type { StoreConfig };

/**
 * Generic fallback values for SEO when backend data is not available
 * These ensure the site always has basic metadata even if the API fails
 */
export const SEO_FALLBACKS = {
  title: "Verkkokauppa",
  description: "Laadukkaat tuotteet verkossa - löydä suosikkisi helposti",
  storeName: "Verkkokauppa",
  domain: process.env.NEXT_PUBLIC_BASE_URL || "https://example.com",
  city: "Helsinki",
  country: "FI",
  priceRange: "€€",
  businessType: "Verkkokauppa",
  logoUrl: "/logo.svg",
  openGraphImage: "/og-image.jpg",
  twitterImage: "/twitter-image.jpg",
} as const;

/**
 * Helper to get SEO-safe values with fallbacks
 */
export function getSEOValue<T>(value: T | null | undefined, fallback: T): T {
  return value ?? fallback;
}

/**
 * Fetch store configuration using the SDK
 * Cached with React's cache() for request deduplication
 */
export const getStoreConfig = cache(async (): Promise<StoreConfig> => {
  return storefront.store.getConfig({
    next: { revalidate: 300 }, // Cache for 5 minutes
  });
});
