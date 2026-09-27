import { cache } from "react";
import { storefront } from "./storefront";
import type { NavPage, StoreConfig } from "@putiikkipalvelu/storefront-sdk";

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
 * Before `legalPages` existed the backend never let owners hide these,
 * so a response without the field means both pages are published.
 */
const DEFAULT_LEGAL_PAGES: NavPage[] = [
  { slug: "privacy", title: "Tietosuojakäytäntö" },
  { slug: "terms", title: "Maksu- ja toimitusehdot" },
];

/**
 * Published legal pages (privacy, terms) to link in the footer.
 * A page the owner has hidden returns 404, so link only these.
 */
export function getLegalPages(config: StoreConfig | null): NavPage[] {
  return config?.legalPages ?? DEFAULT_LEGAL_PAGES;
}

/**
 * Fetch store configuration using the SDK
 * Cached with React's cache() for request deduplication
 */
export const getStoreConfig = cache(async (): Promise<StoreConfig> => {
  return storefront.store.getConfig();
});
