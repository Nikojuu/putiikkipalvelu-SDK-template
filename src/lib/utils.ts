import { PriceInfo } from "@/app/utils/types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  isSaleActive,
  type Product,
  type ProductDetail,
  type ProductVariation,
} from "@putiikkipalvelu/storefront-sdk";

// Re-export isSaleActive for backwards compatibility
export { isSaleActive };

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// priceUtils.ts

export const getPriceInfo = (item: Product): PriceInfo => {
  const convertToEuros = (cents: number | null): number | null =>
    cents !== null ? Number((cents / 100).toFixed(2)) : null;

  // Handle product without variations
  if (!item.variations || item.variations.length === 0) {
    const isActive = isSaleActive(item.saleStartDate, item.saleEndDate);

    return {
      currentPrice: convertToEuros(item.price) ?? item.price / 100,
      salePrice:
        isActive && item.salePrice ? convertToEuros(item.salePrice) : null,
      salePercent: isActive && item.salePrice ? item.salePercent || null : null,
      isOnSale: isActive && !!item.salePrice,
      lowestPriceBeforeSale:
        isActive && item.salePrice
          ? convertToEuros(item.lowestPriceBeforeSale ?? null)
          : null,
    };
  }

  // Find variation with lowest effective price among active sales
  const variations = item.variations.map((variation) => {
    const isActive = isSaleActive(
      variation.saleStartDate,
      variation.saleEndDate
    );

    return {
      currentPrice: convertToEuros(variation.price ?? null) || 0,
      salePrice:
        isActive && variation.salePrice
          ? convertToEuros(variation.salePrice)
          : null,
      salePercent:
        isActive && variation.salePrice ? variation.salePercent || null : null,
      isOnSale: isActive && !!variation.salePrice,
      lowestPriceBeforeSale:
        isActive && variation.salePrice
          ? convertToEuros(variation.lowestPriceBeforeSale ?? null)
          : null,
    };
  });

  // Find the variation with the lowest effective price
  const lowestPriceVariation = variations.reduce((lowest, current) => {
    const currentEffectivePrice = current.salePrice || current.currentPrice;
    const lowestEffectivePrice = lowest.salePrice || lowest.currentPrice;
    return currentEffectivePrice < lowestEffectivePrice ? current : lowest;
  });

  return lowestPriceVariation;
};

export const getDisplayPriceSelectedProduct = (
  product: ProductDetail,
  variation?: ProductVariation
) => {
  if (variation) {
    // Handle variation-specific pricing logic
    const isVariationOnSale =
      isSaleActive(variation.saleStartDate, variation.saleEndDate) &&
      variation.salePrice !== null;
    return isVariationOnSale
      ? (variation.salePrice ?? 0) / 100
      : (variation.price ?? 0) / 100;
  }

  // Fallback to product-level pricing logic
  const isProductOnSale =
    isSaleActive(product.saleStartDate, product.saleEndDate) &&
    product.salePrice !== null;
  return isProductOnSale && product.salePrice !== null
    ? product.salePrice / 100
    : product.price / 100;
};

/**
 * Announced discount percentage. KKV 4.5 (EUT C-330/23): when a 30-day lowest
 * price exists the reduction is measured against it, not the regular price —
 * and a sale price that does not undercut it is no reduction at all (null).
 * Without a reference (store toggle off, no 30-day history) fall back to the
 * merchant's percentage against the regular price.
 * Prices in any unit as long as both use the same one.
 */
export const announcedDiscountPercent = (
  salePrice: number | null,
  lowestPriceBeforeSale: number | null | undefined,
  salePercent: string | null | undefined
): string | null => {
  if (salePrice === null) return null;
  if (lowestPriceBeforeSale != null) {
    if (salePrice >= lowestPriceBeforeSale) return null;
    return Math.round((1 - salePrice / lowestPriceBeforeSale) * 100).toString();
  }
  if (salePercent && !isNaN(parseFloat(salePercent))) {
    return ((1 - parseFloat(salePercent)) * 100).toFixed(0);
  }
  return null;
};

/** Reads the KSL 2:11 § reference off any API object that may carry it. */
export const lowestPriceOf = (o: object | null | undefined): number | null => {
  if (!o || !("lowestPriceBeforeSale" in o)) return null;
  const v = (o as { lowestPriceBeforeSale?: unknown }).lowestPriceBeforeSale;
  return typeof v === "number" ? v : null;
};

export const OPEN_GRAPH_IMAGE = "/kuva1.jpg";
export const TWITTER_IMAGE = "/kuva2.jpg";
