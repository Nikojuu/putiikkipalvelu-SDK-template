"use server";

import { storefront } from "@/lib/storefront";
import type {
  ShipmentMethodsResponse,
  CartItem,
  Campaign,
} from "@putiikkipalvelu/storefront-sdk";

/**
 * Get shipping options for a postal code
 * @param postalCode - Customer's postal code for location-based filtering
 * @param cartItems - Cart items for weight-based filtering (SDK calculates weight)
 * @param campaigns - Active campaigns for accurate cart total calculation (free shipping threshold)
 */
export async function getShippingOptions(
  postalCode: string,
  cartItems?: CartItem[],
  campaigns?: Campaign[]
): Promise<ShipmentMethodsResponse> {
  return storefront.shipping.getOptions(postalCode, { cartItems, campaigns });
}

/**
 * @deprecated Use getShippingOptions instead
 */
export async function getShipmentMethods(
  postalCode: string,
  cartItems?: CartItem[]
): Promise<ShipmentMethodsResponse> {
  return getShippingOptions(postalCode, cartItems);
}
