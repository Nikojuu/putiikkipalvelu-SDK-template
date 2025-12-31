import { createStorefrontClient } from "@putiikkipalvelu/storefront-sdk";

// Get these from environment variables
const API_KEY = process.env.STOREFRONT_API_KEY || "";
const BASE_URL =
  process.env.NEXT_PUBLIC_STOREFRONT_API_URL ||
  "http://localhost:3000/api/storefront/v1";

if (!API_KEY) {
  console.warn(
    "Warning: STOREFRONT_API_KEY is not set. SDK calls will fail with 401."
  );
}

/**
 * Storefront SDK client instance
 *
 * Usage:
 * ```ts
 * import { storefront } from '@/lib/storefront';
 *
 * const products = await storefront.products.latest({ take: 10 });
 * ```
 */
export const storefront = createStorefrontClient({
  apiKey: API_KEY,
  baseUrl: BASE_URL,
});
