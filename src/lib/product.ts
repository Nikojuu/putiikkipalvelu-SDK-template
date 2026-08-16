import { cache } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import { storefront } from "@/lib/storefront";
import { NotFoundError } from "@putiikkipalvelu/storefront-sdk";

/**
 * Fetch a product by slug, handling renamed products.
 *
 * A renamed product answers 404 + `redirectTo` (its current slug) — we issue a
 * permanent redirect there; a plain 404 renders the not-found page.
 *
 * Wrapped in React cache() so the [slug] layout, generateMetadata and the page
 * share ONE api call per request. The layout call is what makes the redirect a
 * real HTTP 308: the segment layout renders above the loading.tsx Suspense
 * boundary, so the redirect is thrown before the response starts streaming
 * (thrown inside the page it would degrade to a meta-refresh with status 200).
 */
export const getProductBySlug = cache(async (slug: string) => {
  try {
    return await storefront.products.getBySlug(slug, {});
  } catch (error) {
    if (error instanceof NotFoundError) {
      if (error.redirectTo) {
        permanentRedirect(`/product/${error.redirectTo}`);
      }
      notFound();
    }
    throw error;
  }
});
