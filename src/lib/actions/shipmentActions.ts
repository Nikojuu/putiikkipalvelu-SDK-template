"use server";

import { storefront } from "@/lib/storefront";
import type {
  ShipmentMethodsResponse,
  CartItem,
  Campaign,
} from "@putiikkipalvelu/storefront-sdk";
import { StorefrontError } from "@putiikkipalvelu/storefront-sdk";

export type ShippingOptionsResult =
  | { success: true; data: ShipmentMethodsResponse }
  | { success: false; error: string };

/**
 * Get shipping options for a postal code
 * @param postalCode - Customer's postal code for location-based filtering
 * @param cartItems - Cart items for weight-based filtering (SDK calculates weight)
 * @param campaigns - Active campaigns for accurate cart total calculation (free shipping threshold)
 * @param discountAmount - Discount code amount in cents (subtracted from cart total for free shipping threshold)
 */
export async function getShippingOptions(
  postalCode: string,
  cartItems?: CartItem[],
  campaigns?: Campaign[],
  discountAmount?: number
): Promise<ShippingOptionsResult> {
  try {
    const data = await storefront.shipping.getOptions(postalCode, {
      cartItems,
      campaigns,
      discountAmount,
    });
    return { success: true, data };
  } catch (error) {
    const message =
      error instanceof StorefrontError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Tuntematon virhe";
    return { success: false, error: message };
  }
}
